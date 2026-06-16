import type { Translation } from "./dict";

// Překlady pro detail produktu (ProductSheet). Prefix klíčů: "product."
export const productsheet: Record<string, Translation> = {
  // ── Umístění ──
  "product.locLednice": { cs: "Lednice", sk: "Chladnička" },
  "product.locMrazak": { cs: "Mrazák", sk: "Mraznička" },
  "product.locSpiz": { cs: "Spíž", sk: "Špajza" },
  "product.locSkrinka": { cs: "Skříňka", sk: "Skrinka" },

  // ── Záhlaví / taby ──
  "product.camera": { cs: "Kamera", sk: "Kamera" },
  "product.tabInfo": { cs: "Informace", sk: "Informácie" },
  "product.addToPantry": { cs: "Přidat do spižírny", sk: "Pridať do špajze" },

  // ── Výživové hodnoty ──
  "product.editNutrition": { cs: "Upravit výživové hodnoty", sk: "Upraviť výživové hodnoty" },
  "product.noNutritionData": { cs: "Výrobce data neposkytl", sk: "Výrobca dáta neposkytol" },
  "product.enterValuesHint": {
    cs: "Zadej hodnoty ručně ze štítku produktu (na 100g/ml).",
    sk: "Zadaj hodnoty ručne zo štítku produktu (na 100g/ml).",
  },
  "product.calories": { cs: "Kalorie (kcal)", sk: "Kalórie (kcal)" },
  "product.protein": { cs: "Bílkoviny", sk: "Bielkoviny" },
  "product.carbs": { cs: "Sacharidy", sk: "Sacharidy" },
  "product.fat": { cs: "Tuky", sk: "Tuky" },
  "product.fiber": { cs: "Vláknina", sk: "Vláknina" },
  "product.proteinG": { cs: "Bílkoviny (g)", sk: "Bielkoviny (g)" },
  "product.carbsG": { cs: "Sacharidy (g)", sk: "Sacharidy (g)" },
  "product.fatG": { cs: "Tuky (g)", sk: "Tuky (g)" },
  "product.kcalPer100g": { cs: "kcal / 100g", sk: "kcal / 100g" },

  // ── Alergeny ──
  "product.allergens": { cs: "Alergeny", sk: "Alergény" },

  // ── Historie cen ──
  "product.priceHistory": { cs: "HISTORIE CEN", sk: "HISTÓRIA CIEN" },
  "product.bestPrice": { cs: "Nejlepší cena", sk: "Najlepšia cena" },

  // ── Zdroj ──
  "product.sourceLabel": { cs: "Zdroj:", sk: "Zdroj:" },
  "product.sourceCzechDb": { cs: "Česká databáze", sk: "Česká databáza" },
  "product.sourceUser": { cs: "Uživatelský vstup", sk: "Používateľský vstup" },

  // ── Přidání do spižírny ──
  "product.quantity": { cs: "MNOŽSTVÍ", sk: "MNOŽSTVO" },
  "product.location": { cs: "UMÍSTĚNÍ", sk: "UMIESTNENIE" },
  "product.expiryOptional": { cs: "SPOTŘEBUJTE DO (volitelné)", sk: "SPOTREBUJTE DO (voliteľné)" },
  "product.priceOptional": { cs: "CENA (volitelné)", sk: "CENA (voliteľné)" },
  "product.dateExpired": { cs: "Toto datum už prošlo", sk: "Tento dátum už prešiel" },
  "product.consumeToday": { cs: "Spotřebujte dnes", sk: "Spotrebujte dnes" },
  "product.consumeTomorrow": { cs: "Spotřebujte zítra", sk: "Spotrebujte zajtra" },
  "product.lastsDays": { cs: "Vydrží ještě {n} dní", sk: "Vydrží ešte {n} dní" },
  "product.recipeTip": {
    cs: "Tip: v Receptech najdeš, co z toho uvařit",
    sk: "Tip: v Receptoch nájdeš, čo z toho uvariť",
  },
  "product.expiryHint": {
    cs: "Zadejte datum z obalu — připomeneme vám, než potravina projde.",
    sk: "Zadajte dátum z obalu — pripomenieme vám, kým potravina prejde.",
  },

  // ── Existující položka ──
  "product.alreadyInPantry": { cs: "Už máš ve spižírně", sk: "Už máš v špajze" },
  "product.inLocation": { cs: "{n}× v {loc}", sk: "{n}× v {loc}" },
  "product.addToExisting": { cs: "Přičíst {n}× k existujícímu", sk: "Pripočítať {n}× k existujúcemu" },
  "product.addAsNew": { cs: "Přidat jako nový záznam", sk: "Pridať ako nový záznam" },
};
