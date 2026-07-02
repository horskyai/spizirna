import { create } from "zustand";
import { persist } from "zustand/middleware";

// Volitelné funkce appky, které si uživatel zapíná sám. Ve výchozím stavu
// VYPNUTÉ — běžného uživatele (jen spižírna) nezahltíme. Kdo chce, zapne.
interface FeaturesStore {
  // Sledování kalorií a deník jídla (tab "Jídlo", kalorie u produktů,
  // zápis porce receptu do deníku, denní cíl). Default: vypnuto.
  calorieTracking: boolean;
  setCalorieTracking: (on: boolean) => void;

  // Statistiky domácnosti (hodnota spižírny, plýtvání v Kč, herní pokrok).
  // Default: zapnuto — je to spíš „hezký přehled", koho nezajímá, vypne.
  showStats: boolean;
  setShowStats: (on: boolean) => void;
}

export const useFeaturesStore = create<FeaturesStore>()(
  persist(
    (set) => ({
      calorieTracking: false,
      setCalorieTracking: (on) => set({ calorieTracking: on }),

      showStats: true,
      setShowStats: (on) => set({ showStats: on }),
    }),
    { name: "features-store" }
  )
);
