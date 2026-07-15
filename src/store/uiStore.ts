import { create } from "zustand";
import { ProductInfo } from "@/types";

export type Tab = "spizirna" | "skenovat" | "jidlo" | "recepty" | "nakup" | "opakujici" | "provoz";
// Vnitřní záložka provozního režimu (Kasa/Sklad/…). Spodní lišta v provozu ji
// nastaví a ProvozView na ni skočí. null = nech výchozí / poslední.
export type ProvozSubTab = "kasa" | "ucetnictvi" | "inventura" | "sklad" | "recepty" | "historie" | "odpisy" | "dodavatele" | "uctenky" | null;
type Sheet = "product" | "add-to-pantry" | "food-log" | "recipe" | null;
// Rychlý filtr spížírny z karet „Dnešní přehled" (Brzy expiruje / Dochází).
export type PantryFilter = "expiring" | "lowStock" | null;

interface UIStore {
  activeTab: Tab;
  activeSheet: Sheet;
  scannedProduct: ProductInfo | null;
  // Filtr spížírny nastavený z přehledu; PantryView ho přečte a odfiltruje.
  pantryFilter: PantryFilter;
  // Která vnitřní záložka Provozu se má otevřít (řídí spodní provozní lišta).
  // Je to jednorázový „signál" — ProvozView na něj skočí a hned ho vynuluje.
  provozSubTab: ProvozSubTab;
  // Skutečná aktivní vnitřní záložka Provozu (trvalá) — podle ní se rozsvěcí
  // spodní lišta. Na rozdíl od provozSubTab se NEnuluje, takže lišta ví, kde jsme.
  provozActiveTab: NonNullable<ProvozSubTab>;
  // Otevření Nastavení odkudkoli (banner limitu, …) bez prop-drillingu.
  settingsOpen: boolean;
  setTab: (tab: Tab) => void;
  // Přepne na provoz a rovnou na danou vnitřní záložku (spodní lišta).
  openProvoz: (sub: ProvozSubTab) => void;
  setProvozSubTab: (sub: ProvozSubTab) => void;
  // Nastaví trvalou aktivní záložku (volá ProvozView i při vnitřním přepnutí).
  setProvozActiveTab: (sub: NonNullable<ProvozSubTab>) => void;
  // Přepne na spížírnu a rovnou zapne daný filtr (z karet přehledu).
  openPantryWithFilter: (filter: PantryFilter) => void;
  setPantryFilter: (filter: PantryFilter) => void;
  openSheet: (sheet: Sheet, product?: ProductInfo) => void;
  closeSheet: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: "spizirna",
  activeSheet: null,
  scannedProduct: null,
  pantryFilter: null,
  provozSubTab: null,
  provozActiveTab: "kasa",
  settingsOpen: false,
  // Odchod ze spížírny rychlý filtr zruší, ať se nedrží „skrytě" na pozadí.
  setTab: (tab) => set((s) => ({ activeTab: tab, pantryFilter: tab === "spizirna" ? s.pantryFilter : null })),
  // Přepni na provoz: nastav jednorázový signál i trvalou aktivní záložku (kvůli liště).
  openProvoz: (sub) => set(sub ? { activeTab: "provoz", provozSubTab: sub, provozActiveTab: sub } : { activeTab: "provoz", provozSubTab: sub }),
  setProvozSubTab: (sub) => set(sub ? { provozSubTab: sub, provozActiveTab: sub } : { provozSubTab: sub }),
  setProvozActiveTab: (sub) => set({ provozActiveTab: sub }),
  openPantryWithFilter: (filter) => set({ activeTab: "spizirna", pantryFilter: filter }),
  setPantryFilter: (filter) => set({ pantryFilter: filter }),
  openSheet: (sheet, product) => set({ activeSheet: sheet, scannedProduct: product ?? null }),
  closeSheet: () => set({ activeSheet: null, scannedProduct: null }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
