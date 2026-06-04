import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Recipe, RecipeIngredient } from "@/types";

interface RecipeStore {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, "id">) => void;
  updateRecipe: (id: string, recipe: Omit<Recipe, "id">) => void;
  deleteRecipe: (id: string) => void;
}

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set) => ({
      recipes: [],

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
    { name: "recipe-store" }
  )
);
