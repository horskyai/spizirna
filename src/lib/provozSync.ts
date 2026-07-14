// Synchronizace PROVOZU (sklad + menu) mezi telefony majitele a zaměstnance.
// Stejný princip jako familySync: cloud vrstva vedle localStorage, push/pull,
// last-write-wins, realtime. Etapa 1 = sklad (polozky) + menu. Prodejky = etapa 2.

import { supabase } from "@/lib/supabase";
import { useProvozShareStore } from "@/store/provozShareStore";
import { useProvozStore } from "@/store/provozStore";
import { useKasaStore } from "@/store/kasaStore";

type Tabulka = "shared_provoz_polozky" | "shared_provoz_menu" | "shared_provoz_prodejky";

let realtimeCanal: ReturnType<typeof supabase.channel> | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

async function pushItems(tabulka: Tabulka, provozId: string, items: { id: string }[]) {
  if (!items.length) return;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  const rows = items.map((it) => ({
    provozovna_id: provozId,
    client_id: it.id,
    payload: it,
    updated_at: new Date().toISOString(),
    updated_by: uid,
    deleted: false,
  }));
  await supabase.from(tabulka).upsert(rows, { onConflict: "provozovna_id,client_id" });
}

async function pullSklad(provozId: string) {
  const { data } = await supabase
    .from("shared_provoz_polozky")
    .select("client_id, payload, deleted")
    .eq("provozovna_id", provozId);
  if (!data) return;
  const cloud = data.filter((r) => !r.deleted).map((r) => r.payload as any);
  const cloudDeleted = new Set(data.filter((r) => r.deleted).map((r) => r.client_id));
  const local = useProvozStore.getState().polozky;
  const cloudIds = new Set(cloud.map((i: any) => i.id));
  const jenLokalni = local.filter((i) => !cloudIds.has(i.id) && !cloudDeleted.has(i.id));
  useProvozStore.setState({ polozky: [...cloud, ...jenLokalni] });
}

async function pullMenu(provozId: string) {
  const { data } = await supabase
    .from("shared_provoz_menu")
    .select("client_id, payload, deleted")
    .eq("provozovna_id", provozId);
  if (!data) return;
  const cloud = data.filter((r) => !r.deleted).map((r) => r.payload as any);
  const cloudDeleted = new Set(data.filter((r) => r.deleted).map((r) => r.client_id));
  const local = useKasaStore.getState().menu;
  const cloudIds = new Set(cloud.map((i: any) => i.id));
  const jenLokalni = local.filter((i) => !cloudIds.has(i.id) && !cloudDeleted.has(i.id));
  useKasaStore.setState({ menu: [...cloud, ...jenLokalni] });
}

// Prodejky: sdílíme jako EVIDENCI tržby. Sklad se NEodečítá podruhé —
// odečet řeší ten, kdo prodává (lokálně), tady jen sloučíme seznam účtenek,
// ať majitel vidí, co zaměstnanec prodal.
async function pullProdejky(provozId: string) {
  const { data } = await supabase
    .from("shared_provoz_prodejky")
    .select("client_id, payload, deleted")
    .eq("provozovna_id", provozId);
  if (!data) return;
  const cloud = data.filter((r) => !r.deleted).map((r) => r.payload as any);
  const cloudDeleted = new Set(data.filter((r) => r.deleted).map((r) => r.client_id));
  const local = useKasaStore.getState().prodejky;
  const cloudIds = new Set(cloud.map((i: any) => i.id));
  const jenLokalni = local.filter((i) => !cloudIds.has(i.id) && !cloudDeleted.has(i.id));
  // seřaď podle data (nejnovější nahoře), ať účtenky nepřeskakují
  const vse = [...cloud, ...jenLokalni].sort((a, b) => (b.datum || "").localeCompare(a.datum || ""));
  useKasaStore.setState({ prodejky: vse });
}

export async function provozSyncNow() {
  const pid = useProvozShareStore.getState().provozovnaId;
  if (!pid) return;
  try {
    await pushItems("shared_provoz_polozky", pid, useProvozStore.getState().polozky);
    await pushItems("shared_provoz_menu", pid, useKasaStore.getState().menu);
    await pushItems("shared_provoz_prodejky", pid, useKasaStore.getState().prodejky);
    await pullSklad(pid);
    await pullMenu(pid);
    await pullProdejky(pid);
  } catch { /* sync není kritický, appka jede lokálně */ }
}

// Push ostatním členům provozovny (přes Edge Function) při přibytí zboží/prodeje.
async function notifyProvoz(title: string, body: string) {
  const pid = useProvozShareStore.getState().provozovnaId;
  if (!pid) return;
  try {
    await supabase.functions.invoke("send-share-push", {
      body: { scope: "provoz", groupId: pid, title, body },
    });
  } catch { /* push není kritický */ }
}

let lastPolozkyCount = useProvozStore.getState().polozky.length;
let lastProdejkyCount = useKasaStore.getState().prodejky.length;

export function provozSchedulePush() {
  const pid = useProvozShareStore.getState().provozovnaId;
  if (!pid) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const polozky = useProvozStore.getState().polozky;
    const prodejky = useKasaStore.getState().prodejky;
    pushItems("shared_provoz_polozky", pid, polozky).catch(() => {});
    pushItems("shared_provoz_menu", pid, useKasaStore.getState().menu).catch(() => {});
    pushItems("shared_provoz_prodejky", pid, prodejky).catch(() => {});
    // Push jen při PŘIBYTÍ (nová skladová položka / nový prodej).
    if (polozky.length > lastPolozkyCount) {
      const nova = polozky[polozky.length - 1];
      notifyProvoz("Sklad 📦", nova?.nazev ? `Přibylo: ${nova.nazev}` : "Přibyla skladová položka.");
    } else if (prodejky.length > lastProdejkyCount) {
      notifyProvoz("Nový prodej 🧾", "Na kase proběhl prodej.");
    }
    lastPolozkyCount = polozky.length;
    lastProdejkyCount = prodejky.length;
  }, 1200);
}

export function provozStartRealtime() {
  const pid = useProvozShareStore.getState().provozovnaId;
  if (!pid || realtimeCanal) return;
  realtimeCanal = supabase
    .channel(`provoz-${pid}`)
    .on("postgres_changes",
      { event: "*", schema: "public", table: "shared_provoz_polozky", filter: `provozovna_id=eq.${pid}` },
      () => { pullSklad(pid).catch(() => {}); })
    .on("postgres_changes",
      { event: "*", schema: "public", table: "shared_provoz_menu", filter: `provozovna_id=eq.${pid}` },
      () => { pullMenu(pid).catch(() => {}); })
    .on("postgres_changes",
      { event: "*", schema: "public", table: "shared_provoz_prodejky", filter: `provozovna_id=eq.${pid}` },
      () => { pullProdejky(pid).catch(() => {}); })
    .subscribe();
}

export function provozStopRealtime() {
  if (realtimeCanal) { supabase.removeChannel(realtimeCanal); realtimeCanal = null; }
}
