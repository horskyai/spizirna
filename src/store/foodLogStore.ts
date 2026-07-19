import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId } from "@/lib/uuid";
import { FoodLogEntry, FoodLogItem, NutritionGoal } from "@/types";
import { getCurrentMode } from "@/store/modeStore";

interface FoodLogStore {
  entries: FoodLogEntry[];
  goal: NutritionGoal;
  addEntry: (entry: Omit<FoodLogEntry, "id">) => void;
  removeEntry: (id: string) => void;
  getTodayEntries: () => FoodLogEntry[];
  getTodayTotals: () => { kcal: number; protein: number; fat: number; carbs: number };
  setGoal: (goal: NutritionGoal) => void;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export const useFoodLogStore = create<FoodLogStore>()(
  persist(
    (set, get) => ({
      entries: [],
      goal: { calories_kcal: 2000, protein_g: 150, fat_g: 65, carbs_g: 250 },

      addEntry: (entry) =>
        set((s) => ({
          entries: [...s.entries, { ...entry, id: genId() }],
        })),

      removeEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      getTodayEntries: () =>
        get().entries.filter((e) => e.date === todayStr()),

      getTodayTotals: () => {
        const today = get().getTodayEntries();
        return today.reduce(
          (acc, e) => ({
            kcal: acc.kcal + e.total_kcal,
            protein: acc.protein + e.total_protein_g,
            fat: acc.fat + e.total_fat_g,
            carbs: acc.carbs + e.total_carbs_g,
          }),
          { kcal: 0, protein: 0, fat: 0, carbs: 0 }
        );
      },

      setGoal: (goal) => set({ goal }),
    }),
    { name: `food-log-store-${getCurrentMode()}` }
  )
);
