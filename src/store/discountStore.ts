import { create } from "zustand";
import { persist } from "zustand/middleware";

// Uvítací sleva z "kola štěstí" — jednorázově po registraci (jen domácnost).
// Kolo vždy vyhraje, liší se jen kolik (10 / 20 / 30 %). Uloženou slevu pak
// ukazujeme v ceníku; skutečné uplatnění na platbu přijde s napojením IAP.

export interface DiscountStore {
  spun: boolean;          // kolo už bylo roztočeno (ukázat jen jednou)
  percent: number | null; // vyhraná sleva v %
  setResult: (percent: number) => void;
  reset: () => void;      // pro testování / reset dat
}

export const useDiscountStore = create<DiscountStore>()(
  persist(
    (set) => ({
      spun: false,
      percent: null,
      setResult: (percent) => set({ spun: true, percent }),
      reset: () => set({ spun: false, percent: null }),
    }),
    { name: "welcome-discount" }
  )
);
