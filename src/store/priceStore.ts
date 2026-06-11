import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PriceRecord } from "@/types";
import { getCurrentMode } from "@/store/modeStore";

interface PriceStore {
  records: PriceRecord[];
  addRecord: (record: PriceRecord) => void;
  getHistory: (ean: string) => PriceRecord[];
  getBestPrice: (ean: string) => PriceRecord | null;
}

export const usePriceStore = create<PriceStore>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (record) =>
        set((s) => ({ records: [...s.records, record] })),

      getHistory: (ean) =>
        get().records.filter((r) => r.ean_code === ean).sort((a, b) => b.date.localeCompare(a.date)),

      getBestPrice: (ean) => {
        const history = get().getHistory(ean);
        if (!history.length) return null;
        return history.reduce((best, r) => (!best || r.price < best.price ? r : best), null as PriceRecord | null);
      },
    }),
    { name: `price-store-${getCurrentMode()}` }
  )
);
