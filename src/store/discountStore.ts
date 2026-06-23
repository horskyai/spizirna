import { create } from "zustand";
import { persist } from "zustand/middleware";

// Uvítací sleva z "kola štěstí" — domácnost, 7 dní po prvním vstupu.
// Kolo vždy vyhraje roční plán za zvýhodněných 990 Kč (běžně 1 490 Kč).
// Skutečné uplatnění na platbu přijde s napojením IAP.

export const DISCOUNT_YEARLY = 990;   // zvýhodněná roční cena z kola
export const REGULAR_YEARLY = 1490;   // běžná roční cena
export const WHEEL_AFTER_DAYS = 0;    // DOČASNĚ 0 kvůli testu vzhledu (vrátit na 7!)

export interface DiscountStore {
  firstSeenAt: number | null; // čas prvního vstupu (ms), od něj počítáme 7 dní
  spun: boolean;              // kolo už bylo roztočeno (ukázat jen jednou)
  unlockedYearly: number | null; // vyhraná roční cena (990) nebo null
  markFirstSeen: (now: number) => void;
  setWon: (yearlyPrice: number) => void;
  reset: () => void;
}

export const useDiscountStore = create<DiscountStore>()(
  persist(
    (set, get) => ({
      firstSeenAt: null,
      spun: false,
      unlockedYearly: null,
      markFirstSeen: (now) => {
        if (get().firstSeenAt === null) set({ firstSeenAt: now });
      },
      setWon: (yearlyPrice) => set({ spun: true, unlockedYearly: yearlyPrice }),
      reset: () => set({ firstSeenAt: null, spun: false, unlockedYearly: null }),
    }),
    { name: "welcome-discount" }
  )
);
