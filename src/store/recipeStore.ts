import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Recipe } from "@/types";
import { DEFAULT_RECIPES } from "@/data/defaultRecipes";

const SEED_VERSION = 2;

interface RecipeStore {
  recipes: Recipe[];
  seedVersion: number;
  addRecipe: (recipe: Omit<Recipe, "id">) => void;
  updateRecipe: (id: string, recipe: Omit<Recipe, "id">) => void;
  deleteRecipe: (id: string) => void;
}

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set) => ({
      recipes: DEFAULT_RECIPES.map((r) => ({ ...r, id: crypto.randomUUID() })),
      seedVersion: SEED_VERSION,

      addRecipe: (recipe) =>
        set((s) => ({
          recipes: [...s.recipes, { ...recipe, id: crypto.randomUUID() }],
        })),

      updateRecipe: (id, recipe) =>
        set((s) => ({
          recipes: s.recipes.map((r) => (r.id === id ? { ...recipe, id } : r)),
        })),

      deleteRecipe: (id) =>
        set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) })),
    }),
    {
      name: "recipe-store",
      onRehydrateStorage: () => (state) => {
        if (state && state.seedVersion < SEED_VERSION) {
          const existing = new Set(state.recipes.map((r) => r.name));
          const newRecipes = DEFAULT_RECIPES
            .filter((r) => !existing.has(r.name))
            .map((r) => ({ ...r, id: crypto.randomUUID() }));
          state.recipes = [...state.recipes, ...newRecipes];
          state.seedVersion = SEED_VERSION;
        }
      },
    }
  )
);
