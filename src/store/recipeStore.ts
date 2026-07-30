import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId } from "@/lib/uuid";
import { Recipe } from "@/types";
import { DEFAULT_RECIPES } from "@/data/defaultRecipes";
import { PROVOZ_RECIPES } from "@/data/provozRecipes";
import { getCurrentMode } from "@/store/modeStore";

const SEED_VERSION = 5;

// Výchozí sada receptů podle režimu — domácnost vs. provozovna mají vlastní
// receptáře. Čte se synchronně, ať seed i migrace pracují se správnou sadou.
function seedRecipes(): Omit<Recipe, "id">[] {
  return getCurrentMode() === "provoz" ? PROVOZ_RECIPES : DEFAULT_RECIPES;
}

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
      recipes: seedRecipes().map((r) => ({ ...r, id: genId() })),
      seedVersion: SEED_VERSION,

      addRecipe: (recipe) =>
        set((s) => ({
          recipes: [...s.recipes, { ...recipe, id: genId() }],
        })),

      updateRecipe: (id, recipe) =>
        set((s) => ({
          recipes: s.recipes.map((r) => (r.id === id ? { ...recipe, id } : r)),
        })),

      deleteRecipe: (id) =>
        set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) })),
    }),
    {
      name: `recipe-store-${getCurrentMode()}`,
      onRehydrateStorage: () => (state) => {
        if (state && state.seedVersion < SEED_VERSION) {
          const seed = seedRecipes();
          // Mapa výchozích receptů podle názvu (zdroj slovenských překladů).
          const defaults = new Map(seed.map((r) => [r.name, r]));

          // 1) U existujících výchozích receptů doplň slovenské varianty
          //    (uživatelské recepty, které ve výchozích nejsou, necháme být).
          state.recipes = state.recipes.map((r) => {
            const def = defaults.get(r.name);
            if (!def) return r;
            return {
              ...r,
              name_sk: def.name_sk,
              description_sk: def.description_sk,
              instructions_sk: def.instructions_sk,
              ingredients: r.ingredients.map((ing, i) => ({
                ...ing,
                name_sk: def.ingredients[i]?.name_sk ?? ing.name_sk,
              })),
            };
          });

          // 2) Přidej nové výchozí recepty (rozšířená sada pro daný režim).
          const existing = new Set(state.recipes.map((r) => r.name));
          const newRecipes = seed
            .filter((r) => !existing.has(r.name))
            .map((r) => ({ ...r, id: genId() }));
          state.recipes = [...state.recipes, ...newRecipes];
          state.seedVersion = SEED_VERSION;
        }
      },
    }
  )
);

// Persist middleware ukládá do localStorage jen při set() z akce (add/
// update/deleteRecipe) — čerstvě seedovaná výchozí data (a migrace v
// onRehydrateStorage výše) by se tak jinak NIKDY nezapsala. Při každém
// dalším otevření appky by se recepty vygenerovaly znovu s novými
// náhodnými ID, což potichu rozbije cokoliv, co si ID receptu ukládá
// (např. napojení položky nabídky v Kase provozu na recept — odečet
// surovin by přestal fungovat po restartu appky). Vynutíme jeden zápis
// hned po dokončení hydratace, ať jsou ID od teď stabilní.
// (Musí to být SAMOSTATNÝ příkaz PO přiřazení useRecipeStore, ne odkaz na
// useRecipeStore zevnitř jeho vlastní inicializace — to by za určitého
// časování hydratace spadlo na "Cannot access before initialization".)
// Hydratace bývá (i asynchronně) hotová dřív, než sem execution dorazí —
// proto nejdřív zkontrolovat hasHydrated() a případně zapsat rovnou, jinak
// se přihlásit na dokončení (kryje oba možné časování).
// POZOR: na serveru (SSR) neexistuje localStorage, takže persist middleware
// tam `api.persist` vůbec nenastaví — bez týhle podmínky appka na serveru
// spadne s "Cannot read properties of undefined (reading 'hasHydrated')".
if (typeof window !== "undefined") {
  if (useRecipeStore.persist.hasHydrated()) {
    useRecipeStore.setState({});
  } else {
    useRecipeStore.persist.onFinishHydration(() => useRecipeStore.setState({}));
  }
}
