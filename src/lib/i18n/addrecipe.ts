import type { Translation } from "./dict";

// Překlady pro přidání receptu (AddRecipeModal). Prefix: "addrecipe."
export const addrecipe: Record<string, Translation> = {
  // ── Pantry picker ──
  "addrecipe.pickFromPantry": { cs: "Vybrat ze spižírny", sk: "Vybrať zo špajze" },
  "addrecipe.searchProductPlaceholder": { cs: "Hledat produkt...", sk: "Hľadať produkt..." },
  "addrecipe.pantryEmpty": { cs: "Spižírna je prázdná", sk: "Špajza je prázdna" },
  "addrecipe.pantryEmptyHint": { cs: "Přidejte produkty do spižírny nejdřív", sk: "Pridajte produkty do špajze najprv" },
  "addrecipe.nothingFound": { cs: "Nic nenalezeno", sk: "Nič nenájdené" },
  "addrecipe.atHome": { cs: "doma", sk: "doma" },

  // ── Záhlaví ──
  "addrecipe.title": { cs: "Nový recept", sk: "Nový recept" },

  // ── Kroky ──
  "addrecipe.stepBasic": { cs: "Základní", sk: "Základné" },
  "addrecipe.stepIngredients": { cs: "Suroviny", sk: "Suroviny" },
  "addrecipe.stepInstructions": { cs: "Postup", sk: "Postup" },

  // ── Základní info ──
  "addrecipe.nameLabel": { cs: "NÁZEV RECEPTU *", sk: "NÁZOV RECEPTU *" },
  "addrecipe.namePlaceholder": { cs: "např. Hovězí guláš", sk: "napr. Hovädzí guláš" },
  "addrecipe.descLabel": { cs: "POPIS", sk: "POPIS" },
  "addrecipe.descPlaceholder": { cs: "Krátký popis receptu...", sk: "Krátky popis receptu..." },

  // ── Porce a čas ──
  "addrecipe.portionsAndTime": { cs: "PORCE A ČAS", sk: "PORCIE A ČAS" },
  "addrecipe.portions": { cs: "Porcí", sk: "Porcií" },
  "addrecipe.prep": { cs: "Příprava", sk: "Príprava" },
  "addrecipe.cooking": { cs: "Vaření", sk: "Varenie" },

  // ── Výživa na porci ──
  "addrecipe.nutritionPerServing": { cs: "VÝŽIVA NA PORCI (volitelné)", sk: "VÝŽIVA NA PORCIU (voliteľné)" },
  "addrecipe.calories": { cs: "Kalorie (kcal)", sk: "Kalórie (kcal)" },
  "addrecipe.proteinG": { cs: "Bílkoviny (g)", sk: "Bielkoviny (g)" },
  "addrecipe.carbsG": { cs: "Sacharidy (g)", sk: "Sacharidy (g)" },
  "addrecipe.fatG": { cs: "Tuky (g)", sk: "Tuky (g)" },

  // ── Štítky ──
  "addrecipe.tagsLabel": { cs: "ŠTÍTKY", sk: "ŠTÍTKY" },
  "addrecipe.customTagPlaceholder": { cs: "Vlastní štítek...", sk: "Vlastný štítok..." },
  "addrecipe.nextIngredients": { cs: "Dál — Suroviny", sk: "Ďalej — Suroviny" },

  // ── Suroviny ──
  "addrecipe.linkHint": {
    cs: "Propojte suroviny se spižírnou pro přesné sledování",
    sk: "Prepojte suroviny so špajzou pre presné sledovanie",
  },
  "addrecipe.linked": { cs: "Propojeno: {name}", sk: "Prepojené: {name}" },
  "addrecipe.ingredientNamePlaceholder": { cs: "Název suroviny...", sk: "Názov suroviny..." },
  "addrecipe.quantityPlaceholder": { cs: "Množství", sk: "Množstvo" },
  "addrecipe.linkToPantry": { cs: "Propojit se spižírnou", sk: "Prepojiť so špajzou" },
  "addrecipe.changeLink": { cs: "Změnit propojení", sk: "Zmeniť prepojenie" },
  "addrecipe.addIngredient": { cs: "Přidat surovinu", sk: "Pridať surovinu" },
  "addrecipe.voiceIngredients": { cs: "Nadiktovat suroviny hlasem", sk: "Nadiktovať suroviny hlasom" },
  "addrecipe.nextInstructions": { cs: "Dál — Postup vaření", sk: "Ďalej — Postup varenia" },
  "addrecipe.saveWithoutInstructions": { cs: "Uložit bez postupu", sk: "Uložiť bez postupu" },

  // ── Postup ──
  "addrecipe.describeSteps": { cs: "Popište kroky vaření", sk: "Popíšte kroky varenia" },
  "addrecipe.stepPlaceholder": { cs: "Krok {n}...", sk: "Krok {n}..." },
  "addrecipe.addStep": { cs: "Přidat krok", sk: "Pridať krok" },
  "addrecipe.saveRecipe": { cs: "Uložit recept", sk: "Uložiť recept" },

  // ── Jednotky (UNITS) — symboly mají cs===sk, slovní jednotky překládáme ──
  "addrecipe.unit.g": { cs: "g", sk: "g" },
  "addrecipe.unit.kg": { cs: "kg", sk: "kg" },
  "addrecipe.unit.ml": { cs: "ml", sk: "ml" },
  "addrecipe.unit.l": { cs: "l", sk: "l" },
  "addrecipe.unit.ks": { cs: "ks", sk: "ks" },
  "addrecipe.unit.lžíce": { cs: "lžíce", sk: "lyžica" },
  "addrecipe.unit.lžička": { cs: "lžička", sk: "lyžička" },
  "addrecipe.unit.hrnek": { cs: "hrnek", sk: "hrnček" },
  "addrecipe.unit.stroužky": { cs: "stroužky", sk: "strúčiky" },
  "addrecipe.unit.větvičky": { cs: "větvičky", sk: "vetvičky" },

  // ── Štítky receptů (TAGS_PRESET) ──
  "addrecipe.tag.rychlé": { cs: "rychlé", sk: "rýchle" },
  "addrecipe.tag.zdravé": { cs: "zdravé", sk: "zdravé" },
  "addrecipe.tag.vegetariánské": { cs: "vegetariánské", sk: "vegetariánske" },
  "addrecipe.tag.veganské": { cs: "veganské", sk: "vegánske" },
  "addrecipe.tag.bezlepkové": { cs: "bezlepkové", sk: "bezlepkové" },
  "addrecipe.tag.česká kuchyně": { cs: "česká kuchyně", sk: "česká kuchyňa" },
  "addrecipe.tag.asijské": { cs: "asijské", sk: "ázijské" },
  "addrecipe.tag.polévka": { cs: "polévka", sk: "polievka" },
  "addrecipe.tag.snídaně": { cs: "snídaně", sk: "raňajky" },
  "addrecipe.tag.oběd": { cs: "oběd", sk: "obed" },
  "addrecipe.tag.večeře": { cs: "večeře", sk: "večera" },
};
