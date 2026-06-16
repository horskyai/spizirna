import type { Translation } from "./dict";

// Překlady pro FoodLogView (deník jídla).
export const foodlog: Record<string, Translation> = {
  // ── Názvy jídel (chody) ──
  "foodlog.meal.snidane": { cs: "Snídaně", sk: "Raňajky" },
  "foodlog.meal.svacina": { cs: "Svačina", sk: "Olovrant" },
  "foodlog.meal.obed": { cs: "Oběd", sk: "Obed" },
  "foodlog.meal.vecere": { cs: "Večeře", sk: "Večera" },
  "foodlog.meal.jine": { cs: "Jiné", sk: "Iné" },

  // ── Modal: přidání jídla ──
  "foodlog.addMeal": { cs: "Přidat jídlo", sk: "Pridať jedlo" },
  "foodlog.fromPantry": { cs: "Ze spižírny", sk: "Zo špajze" },
  "foodlog.manual": { cs: "Ručně", sk: "Ručne" },
  "foodlog.searchPantry": { cs: "Hledat ve spižírně...", sk: "Hľadať v špajzi..." },
  "foodlog.pantryEmpty": { cs: "Spižírna je prázdná", sk: "Špajza je prázdna" },
  "foodlog.pantryEmptyHint": {
    cs: "Přidejte produkty nebo použijte ruční zadání",
    sk: "Pridajte produkty alebo použite ručné zadanie",
  },
  "foodlog.nothingFound": { cs: "Nic nenalezeno", sk: "Nič sa nenašlo" },
  "foodlog.atHome": { cs: "doma", sk: "doma" },
  "foodlog.change": { cs: "Změnit", sk: "Zmeniť" },
  "foodlog.howMuchEaten": { cs: "KOLIK JSI SNĚDL(A)?", sk: "KOĽKO SI ZJEDOL(A)?" },
  "foodlog.logMeal": { cs: "Zaznamenat jídlo", sk: "Zaznamenať jedlo" },
  "foodlog.mealNamePlaceholder": { cs: "Název jídla...", sk: "Názov jedla..." },

  // ── Makroživiny a kalorie ──
  "foodlog.protein": { cs: "Bílkoviny", sk: "Bielkoviny" },
  "foodlog.carbs": { cs: "Sacharidy", sk: "Sacharidy" },
  "foodlog.fat": { cs: "Tuky", sk: "Tuky" },
  "foodlog.proteinShort": { cs: "bílk.", sk: "biel." },
  "foodlog.carbsShort": { cs: "sach.", sk: "sach." },
  "foodlog.fatShort": { cs: "tuky", sk: "tuky" },
  "foodlog.proteinLabel": { cs: "Bílkoviny (g)", sk: "Bielkoviny (g)" },
  "foodlog.carbsLabel": { cs: "Sacharidy (g)", sk: "Sacharidy (g)" },
  "foodlog.fatLabel": { cs: "Tuky (g)", sk: "Tuky (g)" },
  "foodlog.caloriesLabel": { cs: "Kalorie (kcal)", sk: "Kalórie (kcal)" },

  // ── Přehled / kruh kalorií ──
  "foodlog.goal": { cs: "Cíl: {n} kcal", sk: "Cieľ: {n} kcal" },
  "foodlog.remaining": { cs: "Zbývá: {n} kcal", sk: "Zostáva: {n} kcal" },
  "foodlog.noEntries": { cs: "Žádné záznamy", sk: "Žiadne záznamy" },

  // ── Modal: denní cíle ──
  "foodlog.dailyGoals": { cs: "Denní cíle", sk: "Denné ciele" },
  "foodlog.averageAdult": {
    cs: "Průměrný dospělý: 2000 kcal · 150g bílkovin · 250g sacharidů · 65g tuků",
    sk: "Priemerný dospelý: 2000 kcal · 150g bielkovín · 250g sacharidov · 65g tukov",
  },
  "foodlog.saveGoals": { cs: "Uložit cíle", sk: "Uložiť ciele" },
};
