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
  "product.addToStock": { cs: "Přidat do skladu", sk: "Pridať do skladu" },

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
  // Překlad názvů alergenů z Open Food Facts (tagy chodí anglicky, např. "mustard").
  // Klíč = OFF tag bez prefixu en:/cs:, malými písmeny. Když tag chybí v mapě,
  // translate() vrátí původní text, takže se appka nikdy nerozbije.
  "product.allergen.gluten": { cs: "Lepek", sk: "Lepok" },
  "product.allergen.milk": { cs: "Mléko", sk: "Mlieko" },
  "product.allergen.eggs": { cs: "Vejce", sk: "Vajcia" },
  "product.allergen.nuts": { cs: "Ořechy", sk: "Orechy" },
  "product.allergen.peanuts": { cs: "Arašídy", sk: "Arašidy" },
  "product.allergen.soybeans": { cs: "Sója", sk: "Sója" },
  "product.allergen.soy": { cs: "Sója", sk: "Sója" },
  "product.allergen.fish": { cs: "Ryby", sk: "Ryby" },
  "product.allergen.crustaceans": { cs: "Korýši", sk: "Kôrovce" },
  "product.allergen.molluscs": { cs: "Měkkýši", sk: "Mäkkýše" },
  "product.allergen.celery": { cs: "Celer", sk: "Zeler" },
  "product.allergen.mustard": { cs: "Hořčice", sk: "Horčica" },
  "product.allergen.sesame-seeds": { cs: "Sezam", sk: "Sezam" },
  "product.allergen.sesame": { cs: "Sezam", sk: "Sezam" },
  "product.allergen.sulphur-dioxide-and-sulphites": { cs: "Oxid siřičitý a siřičitany", sk: "Oxid siričitý a siričitany" },
  "product.allergen.sulphites": { cs: "Siřičitany", sk: "Siričitany" },
  "product.allergen.lupin": { cs: "Vlčí bob (lupina)", sk: "Vlčí bôb (lupina)" },
  // Stromové ořechy (OFF je často rozepisuje samostatně)
  "product.allergen.almonds": { cs: "Mandle", sk: "Mandle" },
  "product.allergen.hazelnuts": { cs: "Lískové ořechy", sk: "Lieskové orechy" },
  "product.allergen.walnuts": { cs: "Vlašské ořechy", sk: "Vlašské orechy" },
  "product.allergen.cashew-nuts": { cs: "Kešu ořechy", sk: "Kešu orechy" },
  "product.allergen.pecan-nuts": { cs: "Pekanové ořechy", sk: "Pekanové orechy" },
  "product.allergen.pistachios": { cs: "Pistácie", sk: "Pistácie" },
  "product.allergen.macadamia-nuts": { cs: "Makadamové ořechy", sk: "Makadamové orechy" },
  "product.allergen.brazil-nuts": { cs: "Para ořechy", sk: "Para orechy" },

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
