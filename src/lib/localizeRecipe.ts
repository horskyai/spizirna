import { Recipe, RecipeIngredient } from "@/types";
import { Locale } from "@/store/localeStore";

// Vrátí recept v daném jazyce. Pro slovenštinu použije slovenské varianty
// (name_sk, description_sk, instructions_sk, ingredience name_sk), kde chybí,
// padá zpět na český originál. Pro češtinu vrací recept beze změny.
//
// Zachovává všechna ostatní pole (id, množství, makra, tagy, propojení na
// spižírnu) — mění jen zobrazované texty, takže logika porovnávání se
// spižírnou i ukládání zůstává nedotčená.
export function localizeRecipe(recipe: Recipe, locale: Locale): Recipe {
  if (locale !== "sk") return recipe;
  return {
    ...recipe,
    name: recipe.name_sk || recipe.name,
    description: recipe.description_sk || recipe.description,
    instructions: recipe.instructions_sk?.length ? recipe.instructions_sk : recipe.instructions,
    ingredients: recipe.ingredients.map(localizeIngredient),
  };
}

function localizeIngredient(ing: RecipeIngredient): RecipeIngredient {
  if (!ing.name_sk) return ing;
  return { ...ing, name: ing.name_sk };
}
