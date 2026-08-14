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
//
// PODPOROVANÍ ŘETĚZCI: každý má vlastní "adapter" (discover + fetchMeta), ale
// všichni vrací stejný tvar { pdfUrl, numPages, sourceId, title } — samotné
// stažení PDF + render stránek + upload je pak společné, viz syncOneLeaflet.
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

// Vercel Hobby maxDuration=60 se v praxi ukázal jako tvrdě vynucený —
// FUNCTION_INVOCATION_TIMEOUT přišel i s vnitřním rozpočtem 45s, protože
// fáze "objevování letáků" (discover přes všechny řetězce, viz níž) žádný
// časový strop neměla. Rozpočet je teď nižší a hlídá se i tam.
const TIME_BUDGET_MS = 25_000;
const UA = { "User-Agent": "Mozilla/5.0 (compatible; SpizirnaLeafletSync/1.0)" };

// Skutečná příčina FUNCTION_INVOCATION_TIMEOUT (dvě vrstvy):
// 1) Obyčejný fetch() nemá žádný timeout a některé adaptéry (hlavně Billa)
//    dělají desítky volání na cizí servery.
// 2) I s AbortController na fetch() samotném zůstávalo čtení TĚLA odpovědi
//    (.text()/.json()) mimo ochranu, pokud se timeout zrušil hned po
//    přijetí hlaviček — u Billy z Vercelu (na rozdíl od lokálního běhu)
//    tělo evidentně přichází velmi pomalu/přerušovaně a čtení viselo bez
//    limitu dál. Timeout proto musí krýt CELOU operaci včetně čtení těla.
// Poslední záchranná pojistka: AbortController spolehlivě přeruší fetch(),
// dokud věc visí NA ÚROVNI HTTP (pomalé/přerušované tělo apod.) — ale když
// je spojení tiše blokované/zahazované už na síťové vrstvě (typicky WAF/CDN
// specificky pro datacentrové IP, jak se ukázalo u Billy z Vercelu), umí se
// stát, že se ani AbortSignal ke slovu nedostane a promise visí navždy.
// raceTimeout garantuje návrat bez ohledu na to, co dělá vnitřek — zaseklá
// promise se prostě opustí (appka stejně za chvíli vrací odpověď).
function raceTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function withTimeout<T>(timeoutMs: number, work: (signal: AbortSignal) => Promise<T>): Promise<T | null> {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), timeoutMs);
  try {
    return await work(abort.signal);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTextWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 8_000): Promise<string | null> {
  return withTimeout(timeoutMs, async (signal) => {
    const res = await fetch(url, { ...opts, signal });
    if (!res.ok) throw new Error(`http ${res.status}`);
    return res.text();
  });
}

async function fetchJsonWithTimeout<T = unknown>(url: string, opts: RequestInit = {}, timeoutMs = 8_000): Promise<T | null> {
  return withTimeout(timeoutMs, async (signal) => {
    const res = await fetch(url, { ...opts, signal });
    if (!res.ok) throw new Error(`http ${res.status}`);
    return (await res.json()) as T;
  });
}

async function headOkWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 5_000): Promise<boolean> {
  const ok = await withTimeout(timeoutMs, async (signal) => {
    const res = await fetch(url, { ...opts, method: "HEAD", signal });
    return res.ok;
  });
  return !!ok;
}

async function fetchBufferWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 8_000): Promise<{ buf: Uint8Array; contentType: string } | null> {
  return withTimeout(timeoutMs, async (signal) => {
    const res = await fetch(url, { ...opts, signal });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    return { buf, contentType: res.headers.get("content-type") || "" };
  });
}

interface RetailerLeaflet {
  retailer: string;
  slug: string;
}

// Dva zdrojové tvary: většina řetězců dává PDF, které si musíme sami
// rozřezat na stránky (pdfjs + canvas). FlippingBook (Penny) ale stránky
// nabízí rovnou jako hotové obrázky — tam se jen zkopírují, bez PDF renderu.
type LeafletMeta =
  | { kind: "pdf"; pdfUrl: string; numPages: number; sourceId: string; title: string }
  | { kind: "images"; pageImageUrl: (page: number) => string; numPages: number; sourceId: string; title: string };

interface RetailerAdapter {
  discover(): Promise<RetailerLeaflet[]>;
  fetchMeta(slug: string): Promise<LeafletMeta | null>;
}

// ── Albert (Publitas, vlastní doména letaky.albert.cz) ──────────────────────
function humanTitleAlbert(slug: string): string {
  if (slug.includes("_katalog_")) return slug.includes("hm") ? "Katalog (hypermarket)" : "Katalog (supermarket)";
  if (slug.includes("hm")) return "Akční leták — hypermarket";
  if (slug.includes("sm")) return "Akční leták — supermarket";
  return "Akční leták";
}

const albertAdapter: RetailerAdapter = {
  async discover() {
    const html = await fetchTextWithTimeout("https://www.albert.cz/aktualni-letaky", { headers: UA });
    if (!html) return [];
    const slugs = new Set<string>();
    const re = /letaky\.albert\.cz\/([a-z0-9_]+)\//g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) slugs.add(m[1]);
    return [...slugs].map((slug) => ({ retailer: "albert", slug }));
  },
  async fetchMeta(slug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await fetchJsonWithTimeout<any>(`https://letaky.albert.cz/${slug}/data.json`, { headers: UA });
    if (!data?.config?.downloadPdfUrl || !data?.numPages) return null;
    return { kind: "pdf", pdfUrl: data.config.downloadPdfUrl, numPages: data.numPages, sourceId: String(data.id), title: humanTitleAlbert(slug) };
  },
};

// ── Lidl (vlastní platforma leaflets.schwarz, sdílená se Schwarz Group) ─────
// Widget na hlavní stránce s letáky vrací JSON se seznamem všech aktuálních
// letáků (id widgetu je pevně dané, viz nález v konverzaci — kdyby ho Lidl
// změnil, discover() prostě vrátí 0 letáků a sync tenhle řetězec jen přeskočí).
const LIDL_WIDGET_ID = "1ab29c9b-5237-11ee-9b1d-fa163f6db1d0";

const lidlAdapter: RetailerAdapter = {
  async discover() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await fetchJsonWithTimeout<any>(`https://endpoints.leaflets.schwarz/v4/widget?widget_id=${LIDL_WIDGET_ID}&store_id=0&region_id=0`, { headers: UA });
    const flyers: { url: string }[] = data?.widget?.flyers ?? [];
    const slugs = new Set<string>();
    for (const f of flyers) {
      const m = /\/letak\/([a-z0-9-]+)\//.exec(f.url ?? "");
      if (m) slugs.add(m[1]);
    }
    return [...slugs].map((slug) => ({ retailer: "lidl", slug }));
  },
  async fetchMeta(slug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await fetchJsonWithTimeout<any>(`https://endpoints.leaflets.schwarz/v4/flyer?flyer_identifier=${slug}`, { headers: UA });
    const flyer = data?.flyer;
    if (!flyer?.pdfUrl || !Array.isArray(flyer?.pages)) return null;
    return { kind: "pdf", pdfUrl: flyer.pdfUrl, numPages: flyer.pages.length, sourceId: String(flyer.id), title: `${flyer.name} (${flyer.title})`.trim() };
  },
};

// ── Billa (taky Publitas, ale na view.publitas.com/billa-cz/… místo vlastní
//    domény) — discover() je dvoufázový: nejdřív najdi na billa.cz podstránky
//    letáků (přes jejich vlastní CMS content API), pak z KAŽDÉ vytáhni
//    aktuální Publitas slug. slug uložený v naší DB je billa-cz/{...}, aby
//    šel přímo použít i pro fetchMeta.
const BILLA_CONTENT_API = "https://www.billa.cz/api/content/page?slug=";

async function findPublitasSlugOnBillaPage(pageSlug: string): Promise<string | null> {
  const text = await fetchTextWithTimeout(`${BILLA_CONTENT_API}${encodeURIComponent(pageSlug)}`, { headers: UA });
  if (!text) return null;
  const m = /billa-cz\/([a-z0-9-]+)/.exec(text);
  return m ? `billa-cz/${m[1]}` : null;
}

const billaAdapter: RetailerAdapter = {
  async discover() {
    const slugs = new Set<string>();

    // "Velký leták" a "malý leták" žijí jako dvě záložky na jedné stránce —
    // najdi VŠECHNY výskyty (findPublitasSlugOnBillaPage níže vrací jen první).
    const mainText = await fetchTextWithTimeout(`${BILLA_CONTENT_API}letaky-billa`, { headers: UA });
    if (mainText) {
      const re = /billa-cz\/([a-z0-9-]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(mainText))) slugs.add(`billa-cz/${m[1]}`);
    }

    // Ostatní letáky/katalogy jsou samostatné podstránky pod /akcni-letaky/*.
    const indexText = await fetchTextWithTimeout(`${BILLA_CONTENT_API}akcni-letaky`, { headers: UA });
    if (indexText) {
      const subSlugs = new Set<string>();
      const re = /akcni-letaky\/([a-z0-9-]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(indexText))) subSlugs.add(m[1]);
      // Paralelně, ne sekvenčně — jinak by devět dotazů po 8s timeoutu mohlo
      // v nejhorším případě trvat přes minutu místo pár sekund.
      const found = await Promise.all([...subSlugs].map((sub) => findPublitasSlugOnBillaPage(`akcni-letaky/${sub}`)));
      for (const f of found) if (f) slugs.add(f);
    }

    return [...slugs].map((slug) => ({ retailer: "billa", slug }));
  },
  async fetchMeta(slug) {
    // slug má tvar "billa-cz/nazev-letaku" — Publitas cesta je view.publitas.com/{slug}/data.json.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await fetchJsonWithTimeout<any>(`https://view.publitas.com/${slug}/data.json`, { headers: UA });
    if (!data?.config?.downloadPdfUrl || !data?.numPages) return null;
    const niceName = (data?.config?.publicationTitle ?? slug.split("/")[1] ?? slug).replace(/^BILLA(\.cz)?\s*-\s*/i, "");
    return { kind: "pdf", pdfUrl: data.config.downloadPdfUrl, numPages: data.numPages, sourceId: String(data.id), title: niceName };
  },
};

// ── Penny (FlippingBook, hostováno na REWE — files.rewe.co.at) ──────────────
// Stránky jsou statické, nepodepsané obrázky na předvídatelné cestě — žádné
// PDF, žádné API s počtem stránek, tak se prostě zkusí, kam až existují
// (HEAD dotazy, levné). Slug je datem kódovaná složka (mění se při každém
// novém letáku), takže sourceId může být klidně jen slug sám.
const PENNY_BASE = "https://files.rewe.co.at/PennyIntLeaflet/CZ";

async function pennyPageExists(slug: string, page: number): Promise<boolean> {
  const url = `${PENNY_BASE}/${slug}/files/assets/common/page-html5-substrates/page${String(page).padStart(4, "0")}_2.jpg`;
  return headOkWithTimeout(url, { headers: UA }, 5_000);
}

// Exponenciální + binární hledání poslední existující stránky (řádově log2(n)
// dotazů místo lineárního zkoušení každé stránky zvlášť — pro leták s 60
// stránkami je to ~7 dotazů místo 60).
async function pennyPageCount(slug: string): Promise<number> {
  if (!(await pennyPageExists(slug, 1))) return 0;
  let lo = 1;
  let hi = 2;
  while (hi <= 128 && (await pennyPageExists(slug, hi))) { lo = hi; hi *= 2; }
  hi = Math.min(hi, 128);
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (await pennyPageExists(slug, mid)) lo = mid; else hi = mid;
  }
  return lo;
}

const pennyAdapter: RetailerAdapter = {
  async discover() {
    const html = await fetchTextWithTimeout("https://www.penny.cz/letaky", { headers: UA });
    if (!html) return [];
    const slugs = new Set<string>();
    const re = /PennyIntLeaflet\/CZ\/([a-zA-Z0-9_]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) slugs.add(m[1]);
    return [...slugs].map((slug) => ({ retailer: "penny", slug }));
  },
  async fetchMeta(slug) {
    const numPages = await pennyPageCount(slug);
    if (numPages === 0) return null;
    const title = slug.includes("katalog") ? "Katalog" : "Akční leták";
    return {
      kind: "images",
      pageImageUrl: (page: number) => `${PENNY_BASE}/${slug}/files/assets/common/page-html5-substrates/page${String(page).padStart(4, "0")}_2.jpg`,
      numPages,
      sourceId: slug,
      title,
    };
  },
};

const ADAPTERS: Record<string, RetailerAdapter> = {
  albert: albertAdapter,
  lidl: lidlAdapter,
  billa: billaAdapter,
  penny: pennyAdapter,
};

type LeafletOutcome = "done" | "progressed" | "unchanged" | "skipped";

// Zpracuje JEDEN leták — max do vyčerpání zbývajícího časového rozpočtu.
// Vrátí "progressed", pokud stihl jen část stránek (další běh naváže).
async function syncOneLeaflet(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  item: RetailerLeaflet,
  meta: LeafletMeta,
  deadline: number,
  log: string[],
): Promise<LeafletOutcome> {
  const { numPages, sourceId, title } = meta;

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
        { retailer: item.retailer, slug: item.slug, source_id: sourceId, title, num_pages: numPages, updated_at: new Date().toISOString() },
        { onConflict: "retailer,slug" },
      )
      .select("id")
      .single();
    leafletId = upserted?.id;
    if (!leafletId) {
      log.push(`[${item.retailer}/${item.slug}] nepodařilo se založit/najít řádek v leaflets`);
      return "skipped";
    }
    await supabase.from("leaflet_pages").delete().eq("leaflet_id", leafletId);
    startPage = 1;
  }

  const savePage = async (pageNum: number, buf: Uint8Array, contentType: string) => {
    const ext = contentType === "image/jpeg" ? "jpg" : "png";
    const path = `${item.retailer}/${item.slug}/${pageNum}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("leaflet-pages")
      .upload(path, buf, { contentType, upsert: true });
    if (uploadErr) {
      log.push(`[${item.retailer}/${item.slug}] upload stránky ${pageNum} selhal: ${uploadErr.message}`);
      return false;
    }
    const { data: pub } = supabase.storage.from("leaflet-pages").getPublicUrl(path);
    // Ukládáme rovnou po jedné stránce — když čas dojde uprostřed, hotové
    // stránky zůstanou uložené a příští běh nezačíná od nuly.
    await supabase.from("leaflet_pages").upsert(
      { leaflet_id: leafletId, page_number: pageNum, image_url: pub.publicUrl },
      { onConflict: "leaflet_id,page_number" },
    );
    return true;
  };

  let renderedNow = 0;
  let pageNum = startPage;

  if (meta.kind === "pdf") {
    // Stáhni PDF (i při navazování — nic si mezi běhy neukládáme, je to
    // jednodušší a stažení+rozparsování je u většiny letáků oproti renderu
    // stránek rychlé). Některé PDF (viděno u Lidlu — 50+ MB) se ale samotné
    // stáhnou déle, než má celý běh k dispozici. Stahování proto časově
    // omezíme zvlášť, ať takový leták nezablokuje i ostatní — příště dostane
    // zase celý čerstvý rozpočet.
    const downloadBudgetMs = Math.min(10_000, Math.max(5_000, deadline - Date.now() - 3_000));
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), downloadBudgetMs);
    let pdfBuf: Uint8Array;
    try {
      const pdfRes = await fetch(meta.pdfUrl, { signal: abort.signal });
      if (!pdfRes.ok) {
        log.push(`[${item.retailer}/${item.slug}] stažení PDF selhalo (${pdfRes.status})`);
        return "skipped";
      }
      pdfBuf = new Uint8Array(await pdfRes.arrayBuffer());
    } catch (e) {
      log.push(`[${item.retailer}/${item.slug}] PDF se nestihlo stáhnout do ${downloadBudgetMs}ms (velký soubor?) — zkusí se příště: ${e instanceof Error ? e.message : String(e)}`);
      return "skipped";
    } finally {
      clearTimeout(timeout);
    }
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjsLib.getDocument({ data: pdfBuf }).promise;

    for (; pageNum <= numPages; pageNum++) {
      if (Date.now() >= deadline) break;
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext("2d");
      // @ts-expect-error — @napi-rs/canvas kontext je API-kompatibilní s tím, co pdf.js očekává.
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const buf = canvas.toBuffer("image/jpeg", 80);
      if (await savePage(pageNum, buf, "image/jpeg")) renderedNow++;
    }
  } else {
    // FlippingBook (Penny): stránky jsou už hotové obrázky na jejich serveru,
    // jen je zkopírujeme — žádný PDF render potřeba.
    for (; pageNum <= numPages; pageNum++) {
      if (Date.now() >= deadline) break;
      const img = await fetchBufferWithTimeout(meta.pageImageUrl(pageNum), { headers: UA });
      if (!img) {
        log.push(`[${item.retailer}/${item.slug}] stránka ${pageNum} se nepodařila stáhnout`);
        continue;
      }
      if (await savePage(pageNum, img.buf, img.contentType.includes("png") ? "image/png" : "image/jpeg")) renderedNow++;
    }
  }

  const doneUpTo = pageNum - 1;
  log.push(`[${item.retailer}/${item.slug}] stránky ${startPage}–${doneUpTo} z ${numPages} (${renderedNow} nově v tomto běhu)`);
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

  // Volitelně omez na jeden řetězec: ?retailer=lidl (hodí se pro ruční test).
  const onlyRetailer = req.nextUrl.searchParams.get("retailer");
  const retailers = onlyRetailer ? [onlyRetailer] : Object.keys(ADAPTERS);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const startedAt = Date.now();
  const deadline = startedAt + TIME_BUDGET_MS;
  const log: string[] = [];
  const result = { done: [] as string[], progressed: [] as string[], unchanged: [] as string[], skipped: [] as string[], notReached: [] as string[] };

  const targets: RetailerLeaflet[] = [];
  for (const retailer of retailers) {
    if (Date.now() >= deadline) {
      log.push(`Časový rozpočet vyčerpán už při objevování letáků, "${retailer}" (a případně další) se na tenhle běh nedostal.`);
      break;
    }
    const adapter = ADAPTERS[retailer];
    if (!adapter) { log.push(`Neznámý řetězec "${retailer}", přeskočeno.`); continue; }
    try {
      const remaining = Math.max(3_000, deadline - Date.now());
      const found = await raceTimeout(adapter.discover(), Math.min(10_000, remaining), []);
      log.push(`${retailer}: nalezeno ${found.length} letáků k prověření.`);
      targets.push(...found);
    } catch (e) {
      log.push(`${retailer}: objevování letáků selhalo: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  for (let i = 0; i < targets.length; i++) {
    if (Date.now() >= deadline) {
      result.notReached = targets.slice(i).map((t) => `${t.retailer}/${t.slug}`);
      log.push(`Časový rozpočet vyčerpán, na tenhle běh se nedostalo: ${result.notReached.join(", ")}`);
      break;
    }
    const item = targets[i];
    const key = `${item.retailer}/${item.slug}`;
    try {
      const metaRemaining = Math.max(3_000, deadline - Date.now());
      const meta = await raceTimeout(ADAPTERS[item.retailer].fetchMeta(item.slug), Math.min(10_000, metaRemaining), null);
      if (!meta) {
        log.push(`[${key}] přeskočeno — chybí metadata (PDF odkaz / počet stránek, nebo to nestihlo odpovědět)`);
        result.skipped.push(key);
        continue;
      }
      // +10s rezerva nad deadline: syncOneLeaflet svůj vlastní čas hlídá sám
      // (viz downloadBudgetMs uvnitř), tohle je jen krajní pojistka pro
      // případ, že by přece jen něco viselo úplně mimo jeho vlastní kontrolu.
      const syncRemaining = Math.max(3_000, deadline - Date.now() + 10_000);
      const outcome = await raceTimeout(syncOneLeaflet(supabase, item, meta, deadline, log), syncRemaining, "skipped" as LeafletOutcome);
      result[outcome].push(key);
      // Progresivní leták spotřeboval celý rozpočet — další v pořadí by stejně
      // hned narazil na deadline, tak nemá cenu dál zkoušet v tomhle běhu.
      if (outcome === "progressed") {
        result.notReached = targets.slice(i + 1).map((t) => `${t.retailer}/${t.slug}`);
        break;
      }
    } catch (e) {
      log.push(`[${key}] chyba: ${e instanceof Error ? e.message : String(e)}`);
      result.skipped.push(key);
    }
  }

  return NextResponse.json({ ...result, tookMs: Date.now() - startedAt, log });
}
