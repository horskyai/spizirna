// Cron route: stáhne aktuální PDF letáky podporovaných řetězců, rozřeže je na
// obrázky stránek a uloží do Supabase (tabulky leaflets/leaflet_pages + Storage
// bucket "leaflet-pages"). Volá se přes Vercel Cron (viz vercel.json), chráněno
// sdíleným tajemstvím v ?key= nebo hlavičkou Authorization.
//
// Běží na Node.js runtime (ne Edge) — @napi-rs/canvas potřebuje nativní binárku.
//
// DÁVKOVÉ ZPRACOVÁNÍ (kvůli limitu 60s na Vercel Hobby plánu): jeden běh
// vyrenderuje jen tolik stránek, kolik se vejde do časového rozpočtu, a
// průběžně je rovnou ukládá. Příští běh (další den cronu, nebo ruční volání)
// pozná podle počtu už uložených stránek u letáku, kde skončil, a pokračuje
// odtud — žádný leták se nerenderuje od začátku znovu zbytečně.
export const runtime = "nodejs";
export const maxDuration = 60; // strop na Vercel Hobby plánu

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createCanvas } from "@napi-rs/canvas";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// Vercel Cron posílá automaticky "Authorization: Bearer $CRON_SECRET", když
// je proměnná CRON_SECRET nastavená v projektu — žádný secret pak nemusí být
// v vercel.json. ?key= navíc zůstává pro ruční/lokální test přes curl.
const SYNC_KEY = process.env.CRON_SECRET;

const TIME_BUDGET_MS = 45_000; // bezpečná rezerva pod maxDuration (studený start, upload…)

interface RetailerLeaflet {
  retailer: string;
  slug: string;
}

// Publitas vrací jako "title" jen datum vygenerování publikace (např. "August
// 07, 2026 13:24") — appce se hodí spíš lidsky čitelný název podle slugu.
function humanTitle(slug: string): string {
  if (slug.includes("_katalog_")) return slug.includes("hm") ? "Katalog (hypermarket)" : "Katalog (supermarket)";
  if (slug.includes("hm")) return "Akční leták — hypermarket";
  if (slug.includes("sm")) return "Akční leták — supermarket";
  return "Akční leták";
}

// ── Albert: seznam aktuálních letáků + jejich data (Publitas) ──────────────
async function discoverAlbertLeaflets(): Promise<RetailerLeaflet[]> {
  const res = await fetch("https://www.albert.cz/aktualni-letaky", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SpizirnaLeafletSync/1.0)" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const slugs = new Set<string>();
  const re = /letaky\.albert\.cz\/([a-z0-9_]+)\//g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) slugs.add(m[1]);
  return [...slugs].map((slug) => ({ retailer: "albert", slug }));
}

interface PublitasData {
  id: number;
  numPages: number;
  sourceDocumentTitle?: string;
  config: { downloadPdfUrl: string };
}

async function fetchPublitasData(slug: string): Promise<PublitasData | null> {
  const res = await fetch(`https://letaky.albert.cz/${slug}/data.json`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SpizirnaLeafletSync/1.0)" },
  });
  if (!res.ok) return null;
  return res.json();
}

type LeafletOutcome = "done" | "progressed" | "unchanged" | "skipped";

// Zpracuje JEDEN leták — max do vyčerpání zbývajícího časového rozpočtu.
// Vrátí "progressed", pokud stihl jen část stránek (další běh naváže).
async function syncOneLeaflet(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  item: RetailerLeaflet,
  deadline: number,
  log: string[],
): Promise<LeafletOutcome> {
  const data = await fetchPublitasData(item.slug);
  if (!data || !data.config?.downloadPdfUrl || !data.numPages) {
    log.push(`[${item.slug}] přeskočeno — chybí data.json / PDF odkaz`);
    return "skipped";
  }
  const sourceId = String(data.id);
  const numPages = data.numPages;

  const { data: existing } = await supabase
    .from("leaflets")
    .select("id, source_id")
    .eq("retailer", item.retailer)
    .eq("slug", item.slug)
    .maybeSingle();

  let leafletId: string | undefined = existing?.id;
  let startPage = 1;

  if (existing && existing.source_id === sourceId) {
    // Stejné vydání jako minule — zjisti, kolik stránek už máme hotovo.
    const { count } = await supabase
      .from("leaflet_pages")
      .select("id", { count: "exact", head: true })
      .eq("leaflet_id", leafletId);
    const already = count ?? 0;
    if (already >= numPages) return "unchanged";
    startPage = already + 1;
  } else {
    // Nový leták nebo nové vydání (jiné source_id) — založ/aktualizuj řádek
    // a smaž případné staré stránky, ať se nemíchají dvě vydání dohromady.
    const { data: upserted } = await supabase
      .from("leaflets")
      .upsert(
        { retailer: item.retailer, slug: item.slug, source_id: sourceId, title: humanTitle(item.slug), num_pages: numPages, updated_at: new Date().toISOString() },
        { onConflict: "retailer,slug" },
      )
      .select("id")
      .single();
    leafletId = upserted?.id;
    if (!leafletId) {
      log.push(`[${item.slug}] nepodařilo se založit/najít řádek v leaflets`);
      return "skipped";
    }
    await supabase.from("leaflet_pages").delete().eq("leaflet_id", leafletId);
    startPage = 1;
  }

  // Stáhni PDF (i při navazování — nic si mezi běhy neukládáme, je to jednodušší
  // a stažení+rozparsování je oproti renderu stránek rychlé).
  const pdfRes = await fetch(data.config.downloadPdfUrl);
  if (!pdfRes.ok) {
    log.push(`[${item.slug}] stažení PDF selhalo (${pdfRes.status})`);
    return "skipped";
  }
  const pdfBuf = new Uint8Array(await pdfRes.arrayBuffer());
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjsLib.getDocument({ data: pdfBuf }).promise;

  let renderedNow = 0;
  let pageNum = startPage;
  for (; pageNum <= numPages; pageNum++) {
    if (Date.now() >= deadline) break;
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");
    // @ts-expect-error — @napi-rs/canvas kontext je API-kompatibilní s tím, co pdf.js očekává.
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const buf = canvas.toBuffer("image/jpeg", 80);

    const path = `${item.retailer}/${item.slug}/${pageNum}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from("leaflet-pages")
      .upload(path, buf, { contentType: "image/jpeg", upsert: true });
    if (uploadErr) {
      log.push(`[${item.slug}] upload stránky ${pageNum} selhal: ${uploadErr.message}`);
      continue;
    }
    const { data: pub } = supabase.storage.from("leaflet-pages").getPublicUrl(path);
    // Ukládáme rovnou po jedné stránce — když čas dojde uprostřed, hotové
    // stránky zůstanou uložené a příští běh nezačíná od nuly.
    await supabase.from("leaflet_pages").upsert(
      { leaflet_id: leafletId, page_number: pageNum, image_url: pub.publicUrl },
      { onConflict: "leaflet_id,page_number" },
    );
    renderedNow++;
  }

  const doneUpTo = pageNum - 1;
  log.push(`[${item.slug}] stránky ${startPage}–${doneUpTo} z ${numPages} (${renderedNow} nově v tomto běhu)`);
  return doneUpTo >= numPages ? "done" : "progressed";
}

export async function GET(req: NextRequest) {
  const headerAuth = req.headers.get("authorization");
  const queryKey = req.nextUrl.searchParams.get("key");
  const authorized = !!SYNC_KEY && (headerAuth === `Bearer ${SYNC_KEY}` || queryKey === SYNC_KEY);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "missing_supabase_env" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const startedAt = Date.now();
  const deadline = startedAt + TIME_BUDGET_MS;
  const log: string[] = [];
  const result = { done: [] as string[], progressed: [] as string[], unchanged: [] as string[], skipped: [] as string[], notReached: [] as string[] };

  const targets = await discoverAlbertLeaflets();
  log.push(`Nalezeno ${targets.length} letáků k prověření (Albert).`);

  for (let i = 0; i < targets.length; i++) {
    if (Date.now() >= deadline) {
      result.notReached = targets.slice(i).map((t) => t.slug);
      log.push(`Časový rozpočet vyčerpán, na tenhle běh se nedostalo: ${result.notReached.join(", ")}`);
      break;
    }
    const item = targets[i];
    try {
      const outcome = await syncOneLeaflet(supabase, item, deadline, log);
      result[outcome].push(item.slug);
      // Progresivní leták spotřeboval celý rozpočet — další v pořadí by stejně
      // hned narazil na deadline, tak nemá cenu dál zkoušet v tomhle běhu.
      if (outcome === "progressed") {
        result.notReached = targets.slice(i + 1).map((t) => t.slug);
        break;
      }
    } catch (e) {
      log.push(`[${item.slug}] chyba: ${e instanceof Error ? e.message : String(e)}`);
      result.skipped.push(item.slug);
    }
  }

  return NextResponse.json({ ...result, tookMs: Date.now() - startedAt, log });
}
