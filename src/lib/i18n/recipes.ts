import type { Translation } from "./dict";

// Překlady pro obrazovku Recepty (RecipesView).
export const recipes: Record<string, Translation> = {
  // ── RecipeCard — štítky a meta ──
  "recipes.haveAll": { cs: "Máš vše ✓", sk: "Máš všetko ✓" },
  "recipes.canMake": { cs: "Lze {n} {porce}", sk: "Dá sa {n} {porcie}" },
  "recipes.portionOne": { cs: "porci", sk: "porciu" },
  "recipes.portionMany": { cs: "porce", sk: "porcie" },
  "recipes.min": { cs: "min", sk: "min" },
  "recipes.servingsUnit": { cs: "porce", sk: "porcie" },
  "recipes.kcalPerServing": { cs: "kcal/porci", sk: "kcal/porciu" },
  "recipes.ingredientsRatio": { cs: "{n}/{total} surovin", sk: "{n}/{total} surovín" },

  // ── RecipeCard — menší porce / chybí ──
  "recipes.missingForPortions": {
    cs: "Chybí na {n} porcí, ale máš na {max}",
    sk: "Chýba na {n} porcií, ale máš na {max}",
  },
  "recipes.cookFromWhatIHave": {
    cs: "Uvařit {n} {porce} z toho co mám",
    sk: "Uvariť {n} {porcie} z toho čo mám",
  },

  // ── Sekce ──
  "recipes.ingredients": { cs: "Ingredience", sk: "Suroviny" },
  "recipes.ingredientsAlt": { cs: "Suroviny", sk: "Suroviny" },
  "recipes.instructions": { cs: "Postup", sk: "Postup" },
  "recipes.ingredientMissing": { cs: "(chybí {n})", sk: "(chýba {n})" },
  "recipes.missingMe": { cs: "Chybí mi", sk: "Chýba mi" },

  // ── Akční tlačítka ──
  "recipes.addedToShoppingList": { cs: "✓ Přidáno na nákupní seznam", sk: "✓ Pridané do nákupného zoznamu" },
  "recipes.addMissingToShopping": { cs: "Přidat chybějící do nákupu ({n})", sk: "Pridať chýbajúce do nákupu ({n})" },
  "recipes.cookNow": { cs: "Uvařím teď", sk: "Uvarím teraz" },
  "recipes.deleteRecipe": { cs: "Smazat recept", sk: "Vymazať recept" },

  // ── CookModal ──
  "recipes.cook.portionsCount": { cs: "POČET PORCÍ", sk: "POČET PORCIÍ" },
  "recipes.cook.kcalTotal": { cs: "{n} kcal celkem", sk: "{n} kcal celkom" },
  "recipes.cook.deductFromPantry": { cs: "ODEČTE SE ZE SPIŽÍRNY", sk: "ODPOČÍTA SA ZO ŠPAJZY" },
  "recipes.cook.missingInPantry": { cs: "CHYBÍ V SPIŽÍRNĚ", sk: "CHÝBA V ŠPAJZI" },
  "recipes.cook.addMissingToList": { cs: "Přidat chybějící na seznam", sk: "Pridať chýbajúce do zoznamu" },
  "recipes.cook.deductedDone": { cs: "✓ Odečteno ze spižírny!", sk: "✓ Odpočítané zo špajzy!" },
  "recipes.cook.cookedDeduct": { cs: "Uvařeno — odečíst ze spižírny", sk: "Uvarené — odpočítať zo špajzy" },
  "recipes.cook.logToDiary": { cs: "Zapsat porci do deníku ({n} kcal)", sk: "Zapísať porciu do denníka ({n} kcal)" },

  // ── TodaySuggestionWidget ──
  "recipes.today.title": { cs: "Co uvařím dnes?", sk: "Čo uvarím dnes?" },
  "recipes.today.anotherSuggestion": { cs: "Jiný návrh", sk: "Iný návrh" },
  "recipes.today.pantryIngredients": { cs: "Suroviny v spižírně", sk: "Suroviny v špajzi" },
  "recipes.today.hideRecipe": { cs: "Skrýt recept", sk: "Skryť recept" },
  "recipes.today.showRecipe": { cs: "Zobrazit recept", sk: "Zobraziť recept" },
  "recipes.today.greatDone": { cs: "✓ Výborně!", sk: "✓ Výborne!" },
  "recipes.today.cookFromWhatIHave": { cs: "Uvařím z toho co mám", sk: "Uvarím z toho čo mám" },
  "recipes.today.addToList": { cs: "+{n} na seznam", sk: "+{n} do zoznamu" },

  // ── RecipesView — vyhledávání, kategorie, prázdné stavy ──
  "recipes.searchPlaceholder": { cs: "Hledat recepty...", sk: "Hľadať recepty..." },
  "recipes.empty.title": { cs: "Žádné recepty", sk: "Žiadne recepty" },
  "recipes.empty.subtitle": { cs: "Přidejte svůj první recept.", sk: "Pridajte svoj prvý recept." },
  "recipes.addRecipe": { cs: "Přidat recept", sk: "Pridať recept" },
  "recipes.noneFound": { cs: "Žádný recept nenalezen", sk: "Nenašiel sa žiadny recept" },

  // ── Kategorie ──
  "recipes.cat.vse": { cs: "Vše", sk: "Všetko" },
  "recipes.cat.ceskaKlasika": { cs: "Česká klasika", sk: "Česká klasika" },
  "recipes.cat.slovenskaKuchyne": { cs: "Slovenská kuchyně", sk: "Slovenská kuchyňa" },
  "recipes.cat.polevky": { cs: "Polévky", sk: "Polievky" },
  "recipes.cat.testoviny": { cs: "Těstoviny", sk: "Cestoviny" },
  "recipes.cat.kureci": { cs: "Kuřecí", sk: "Kuracie" },
  "recipes.cat.ryby": { cs: "Ryby & mořské plody", sk: "Ryby & morské plody" },
  "recipes.cat.vegetarianske": { cs: "Vegetariánské", sk: "Vegetariánske" },
  "recipes.cat.veganske": { cs: "Veganské", sk: "Vegánske" },
  "recipes.cat.snidane": { cs: "Snídaně", sk: "Raňajky" },
  "recipes.cat.salaty": { cs: "Saláty", sk: "Šaláty" },
  "recipes.cat.mezinarodni": { cs: "Mezinárodní", sk: "Medzinárodné" },
  "recipes.cat.dezerty": { cs: "Dezerty", sk: "Dezerty" },
  "recipes.cat.rychlaJidla": { cs: "Rychlá jídla", sk: "Rýchle jedlá" },
};
