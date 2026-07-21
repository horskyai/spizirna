import { Recipe, RecipeIngredient } from "@/types";
import { Locale } from "@/store/localeStore";
import { translateTag } from "@/lib/tagTranslations";
import { translateUnit } from "@/lib/unitTranslations";

// Vrátí recept v daném jazyce. Pro slovenštinu použije slovenské varianty
// (name_sk, description_sk, instructions_sk, ingredience name_sk), kde chybí,
// padá zpět na český originál. Tagy překládá přes tagTranslations (v datech
// nejsou dvojjazyčné, jsou to jen krátká klíčová slova). Pro češtinu vrací
// recept beze změny.
//
// Zachovává id, množství, makra a propojení na spižírnu — ty se s jazykem
// nemění, takže logika porovnávání se spižírnou i ukládání zůstává nedotčená.
export function localizeRecipe(recipe: Recipe, locale: Locale): Recipe {
  if (locale !== "sk") return recipe;
  return {
    ...recipe,
    name: recipe.name_sk || recipe.name,
    description: recipe.description_sk || recipe.description,
    instructions: recipe.instructions_sk?.length ? recipe.instructions_sk : recipe.instructions,
    ingredients: recipe.ingredients.map(localizeIngredient),
    tags: recipe.tags.map(translateTag),
  };
}

function localizeIngredient(ing: RecipeIngredient): RecipeIngredient {
  return { ...ing, name: ing.name_sk || ing.name, unit: translateUnit(ing.unit) };
}
