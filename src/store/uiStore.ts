import { create } from "zustand";
import { ProductInfo } from "@/types";

export type Tab = "spizirna" | "skenovat" | "jidlo" | "recepty" | "nakup" | "opakujici" | "provoz";
type Sheet = "product" | "add-to-pantry" | "food-log" | "recipe" | null;

interface UIStore {
  activeTab: Tab;
  activeSheet: Sheet;
  scannedProduct: ProductInfo | null;
  setTab: (tab: Tab) => void;
  openSheet: (sheet: Sheet, product?: ProductInfo) => void;
  closeSheet: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: "spizirna",
  activeSheet: null,
  scannedProduct: null,
  setTab: (tab) => set({ activeTab: tab }),
  openSheet: (sheet, product) => set({ activeSheet: sheet, scannedProduct: product ?? null }),
  closeSheet: () => set({ activeSheet: null, scannedProduct: null }),
}));
