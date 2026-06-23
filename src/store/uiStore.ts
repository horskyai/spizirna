import { create } from "zustand";
import { ProductInfo } from "@/types";

export type Tab = "spizirna" | "skenovat" | "jidlo" | "recepty" | "nakup" | "opakujici" | "provoz";
type Sheet = "product" | "add-to-pantry" | "food-log" | "recipe" | null;

interface UIStore {
  activeTab: Tab;
  activeSheet: Sheet;
  scannedProduct: ProductInfo | null;
  // Otevření Nastavení odkudkoli (banner limitu, …) bez prop-drillingu.
  settingsOpen: boolean;
  setTab: (tab: Tab) => void;
  openSheet: (sheet: Sheet, product?: ProductInfo) => void;
  closeSheet: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: "spizirna",
  activeSheet: null,
  scannedProduct: null,
  settingsOpen: false,
  setTab: (tab) => set({ activeTab: tab }),
  openSheet: (sheet, product) => set({ activeSheet: sheet, scannedProduct: product ?? null }),
  closeSheet: () => set({ activeSheet: null, scannedProduct: null }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
