// Synchronizace spížírny + nákupu mezi členy rodiny (cloud vrstva).
// Princip: localStorage zůstává hlavní úložiště (appka funguje i offline).
// Když je uživatel v rodině, PUSH lokální změny do Supabase a PULL cizí změny
// zpět. Slučování = last-write-wins podle updated_at. Bezpečné: když sync
// selže (offline, chyba), appka jede dál lokálně.

import { supabase } from "@/lib/supabase";
import { useFamilyStore } from "@/store/familyStore";
import { usePantryStore } from "@/store/pantryStore";
import { useShoppingStore } from "@/store/shoppingStore";
import type { PantryItem } from "@/types";

type Tabulka = "shared_pantry_items" | "shared_shopping_items";

let realtimeCanal: ReturnType<typeof supabase.channel> | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

// ── PUSH: pošli lokální položky do cloudu (upsert podle client_id) ──────────
async function pushItems(tabulka: Tabulka, familyId: string, items: { id: string }[]) {
  if (!items.length) return;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  const rows = items.map((it) => ({
    family_id: familyId,
    client_id: it.id,
    payload: it,
    updated_at: new Date().toISOString(),
    updated_by: uid,
    deleted: false,
  }));
  await supabase.from(tabulka).upsert(rows, { onConflict: "family_id,client_id" });
}

// Označ položku jako smazanou v cloudu (aby zmizela i ostatním).
async function markDeleted(tabulka: Tabulka, familyId: string, clientId: string) {
  await supabase.from(tabulka)
    .update({ deleted: true, updated_at: new Date().toISOString() })
    .eq("family_id", familyId).eq("client_id", clientId);
}

// ── PULL: stáhni cloud a slouč do lokálního storu ───────────────────────────
async function pullPantry(familyId: string) {
  const { data } = await supabase
    .from("shared_pantry_items")
    .select("client_id, payload, deleted")
    .eq("family_id", familyId);
  if (!data) return;

  const cloudItems = data.filter((r) => !r.deleted).map((r) => r.payload as PantryItem);
  const cloudDeleted = new Set(data.filter((r) => r.deleted).map((r) => r.client_id));

  // Slouč: vezmi cloud jako pravdu (mimo lokálně nově přidané, které cloud ještě nezná).
  const local = usePantryStore.getState().items;
  const cloudIds = new Set(cloudItems.map((i) => i.id));
  const jenLokalni = local.filter((i) => !cloudIds.has(i.id) && !cloudDeleted.has(i.id));
  usePantryStore.setState({ items: [...cloudItems, ...jenLokalni] });
}

async function pullShopping(familyId: string) {
  const { data } = await supabase
    .from("shared_shopping_items")
    .select("client_id, payload, deleted")
    .eq("family_id", familyId);
  if (!data) return;

  const cloudItems = data.filter((r) => !r.deleted).map((r) => r.payload as any);
  const cloudDeleted = new Set(data.filter((r) => r.deleted).map((r) => r.client_id));

  const s = useShoppingStore.getState();
  const local = s.domacnostItems;
  const cloudIds = new Set(cloudItems.map((i: any) => i.id));
  const jenLokalni = local.filter((i) => !cloudIds.has(i.id) && !cloudDeleted.has(i.id));
  useShoppingStore.setState({ domacnostItems: [...cloudItems, ...jenLokalni] });
}

// ── Veřejné API ─────────────────────────────────────────────────────────────

// Kompletní synchronizace (push lokálního + pull cloudu). Volá se při startu
// a po připojení k rodině.
export async function syncNow() {
  const familyId = useFamilyStore.getState().familyId;
  if (!familyId) return;
  try {
    // nejdřív pošli, co mám lokálně, pak stáhni společný stav
    await pushItems("shared_pantry_items", familyId, usePantryStore.getState().items);
    await pushItems("shared_shopping_items", familyId, useShoppingStore.getState().domacnostItems);
    await pullPantry(familyId);
    await pullShopping(familyId);
  } catch {
    // sync není kritický — appka jede dál lokálně
  }
}

// Naplánovaný push po lokální změně (debounce, ať neposíláme při každém písmenu).
export function schedulePush() {
  const familyId = useFamilyStore.getState().familyId;
  if (!familyId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushItems("shared_pantry_items", familyId, usePantryStore.getState().items).catch(() => {});
    pushItems("shared_shopping_items", familyId, useShoppingStore.getState().domacnostItems).catch(() => {});
  }, 1200);
}

// Realtime: poslouchej změny od ostatních členů → hned je stáhni.
export function startRealtime() {
  const familyId = useFamilyStore.getState().familyId;
  if (!familyId || realtimeCanal) return;
  realtimeCanal = supabase
    .channel(`family-${familyId}`)
    .on("postgres_changes",
      { event: "*", schema: "public", table: "shared_pantry_items", filter: `family_id=eq.${familyId}` },
      () => { pullPantry(familyId).catch(() => {}); })
    .on("postgres_changes",
      { event: "*", schema: "public", table: "shared_shopping_items", filter: `family_id=eq.${familyId}` },
      () => { pullShopping(familyId).catch(() => {}); })
    .subscribe();
}

export function stopRealtime() {
  if (realtimeCanal) { supabase.removeChannel(realtimeCanal); realtimeCanal = null; }
}

export { markDeleted };
