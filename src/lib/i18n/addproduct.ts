import type { Translation } from "./dict";

// Překlady pro ruční přidání produktu (AddProductManual). Prefix: "addproduct."
export const addproduct: Record<string, Translation> = {
  // ── Umístění ──
  "addproduct.locLednice": { cs: "Lednice", sk: "Chladnička" },
  "addproduct.locMrazak": { cs: "Mrazák", sk: "Mraznička" },
  "addproduct.locSpiz": { cs: "Spíž", sk: "Špajza" },
  "addproduct.locSkrinka": { cs: "Skříňka", sk: "Skrinka" },

  // ── Záhlaví ──
  "addproduct.title": { cs: "Přidat produkt ručně", sk: "Pridať produkt ručne" },
  "addproduct.voiceLabel": { cs: "Nadiktovat více produktů najednou", sk: "Nadiktovať viac produktov naraz" },
  "addproduct.orManually": { cs: "— nebo přidat ručně —", sk: "— alebo pridať ručne —" },

  // ── Kroky ──
  "addproduct.stepBasic": { cs: "Základní info", sk: "Základné info" },
  "addproduct.stepPantry": { cs: "Do spižírny", sk: "Do špajze" },
  "addproduct.stepNutrition": { cs: "Výživa", sk: "Výživa" },

  // ── Foto ──
  "addproduct.photoLabel": { cs: "FOTKA PRODUKTU", sk: "FOTKA PRODUKTU" },
  "addproduct.fromGallery": { cs: "Z galerie", sk: "Z galérie" },
  "addproduct.takePhoto": { cs: "Vyfotit", sk: "Odfotiť" },

  // ── Základní info ──
  "addproduct.nameLabel": { cs: "NÁZEV PRODUKTU *", sk: "NÁZOV PRODUKTU *" },
  "addproduct.namePlaceholder": { cs: "např. Hovězí přední bez kosti", sk: "napr. Hovädzie predné bez kosti" },
  "addproduct.brandLabel": { cs: "ZNAČKA", sk: "ZNAČKA" },
  "addproduct.brandPlaceholder": { cs: "např. Váhala", sk: "napr. Váhala" },

  // ── Kategorie ──
  "addproduct.categoryLabel": { cs: "KATEGORIE", sk: "KATEGÓRIA" },
  "addproduct.customCategoryPlaceholder": { cs: "+ Vlastní kategorie...", sk: "+ Vlastná kategória..." },

  // ── Tagy ──
  "addproduct.tagsLabel": { cs: "ŠTÍTKY (TAGY)", sk: "ŠTÍTKY (TAGY)" },
  "addproduct.customTagPlaceholder": { cs: "+ Vlastní štítek...", sk: "+ Vlastný štítok..." },

  // ── Balení ──
  "addproduct.packagingLabel": { cs: "BALENÍ", sk: "BALENIE" },
  "addproduct.qtyPlaceholderG": { cs: "např. 350", sk: "napr. 350" },
  "addproduct.qtyPlaceholderMl": { cs: "např. 500", sk: "napr. 500" },
  "addproduct.qtyPlaceholderL": { cs: "např. 1,5", sk: "napr. 1,5" },
  "addproduct.qtyPlaceholderKs": { cs: "např. 6", sk: "napr. 6" },

  // ── Tlačítka kroku Basic ──
  "addproduct.addToPantry": { cs: "Přidat do spižírny", sk: "Pridať do špajze" },
  "addproduct.addNutritionToo": { cs: "Přidat také výživové hodnoty →", sk: "Pridať aj výživové hodnoty →" },

  // ── Výživa ──
  "addproduct.nutritionHint": { cs: "Hodnoty na 100g / 100ml (volitelné)", sk: "Hodnoty na 100g / 100ml (voliteľné)" },
  "addproduct.calories": { cs: "Kalorie (kcal)", sk: "Kalórie (kcal)" },
  "addproduct.proteinG": { cs: "Bílkoviny (g)", sk: "Bielkoviny (g)" },
  "addproduct.carbsG": { cs: "Sacharidy (g)", sk: "Sacharidy (g)" },
  "addproduct.fatG": { cs: "Tuky (g)", sk: "Tuky (g)" },
  "addproduct.fiberG": { cs: "Vláknina (g)", sk: "Vláknina (g)" },
  "addproduct.saltG": { cs: "Sůl (g)", sk: "Soľ (g)" },
  "addproduct.nextToPantry": { cs: "Dál — Do spižírny", sk: "Ďalej — Do špajze" },

  // ── Spižírna (krok) ──
  "addproduct.quantity": { cs: "MNOŽSTVÍ", sk: "MNOŽSTVO" },
  "addproduct.location": { cs: "UMÍSTĚNÍ", sk: "UMIESTNENIE" },
  "addproduct.expiryOptional": { cs: "SPOTŘEBUJTE DO (volitelné)", sk: "SPOTREBUJTE DO (voliteľné)" },
  "addproduct.priceOptional": { cs: "CENA (volitelné)", sk: "CENA (voliteľné)" },
  "addproduct.dateExpired": { cs: "Toto datum už prošlo", sk: "Tento dátum už prešiel" },
  "addproduct.consumeToday": { cs: "Spotřebujte dnes", sk: "Spotrebujte dnes" },
  "addproduct.consumeTomorrow": { cs: "Spotřebujte zítra", sk: "Spotrebujte zajtra" },
  "addproduct.lastsDays": { cs: "Vydrží ještě {n} dní", sk: "Vydrží ešte {n} dní" },
  "addproduct.recipeTip": {
    cs: "Tip: v Receptech najdeš, co z toho uvařit",
    sk: "Tip: v Receptoch nájdeš, čo z toho uvariť",
  },
  "addproduct.expiryHint": {
    cs: "Zadejte datum z obalu — připomeneme vám, než potravina projde.",
    sk: "Zadajte dátum z obalu — pripomenieme vám, kým potravina prejde.",
  },
  "addproduct.added": { cs: "✓ Přidáno!", sk: "✓ Pridané!" },

  // ── Kategorie (zobrazení; hodnota zůstává kanonicky česky) ──
  "addproduct.cat.Maso": { cs: "Maso", sk: "Mäso" },
  "addproduct.cat.Ryby": { cs: "Ryby", sk: "Ryby" },
  "addproduct.cat.Mléčné výrobky": { cs: "Mléčné výrobky", sk: "Mliečne výrobky" },
  "addproduct.cat.Zelenina": { cs: "Zelenina", sk: "Zelenina" },
  "addproduct.cat.Ovoce": { cs: "Ovoce", sk: "Ovocie" },
  "addproduct.cat.Pekárenské výrobky": { cs: "Pekárenské výrobky", sk: "Pekárenské výrobky" },
  "addproduct.cat.Luštěniny": { cs: "Luštěniny", sk: "Strukoviny" },
  "addproduct.cat.Obiloviny": { cs: "Obiloviny", sk: "Obilniny" },
  "addproduct.cat.Nápoje": { cs: "Nápoje", sk: "Nápoje" },
  "addproduct.cat.Omáčky a koření": { cs: "Omáčky a koření", sk: "Omáčky a korenie" },
  "addproduct.cat.Sladkosti": { cs: "Sladkosti", sk: "Sladkosti" },
  "addproduct.cat.Mražené": { cs: "Mražené", sk: "Mrazené" },
  "addproduct.cat.Konzervy": { cs: "Konzervy", sk: "Konzervy" },
  "addproduct.cat.Jiné": { cs: "Jiné", sk: "Iné" },

  // ── Štítky (zobrazení; hodnota zůstává kanonicky česky) ──
  "addproduct.tag.Bio": { cs: "Bio", sk: "Bio" },
  "addproduct.tag.Bez lepku": { cs: "Bez lepku", sk: "Bez lepku" },
  "addproduct.tag.Laktóza free": { cs: "Laktóza free", sk: "Bez laktózy" },
  "addproduct.tag.Vegán": { cs: "Vegán", sk: "Vegán" },
  "addproduct.tag.Oblíbené": { cs: "Oblíbené", sk: "Obľúbené" },
  "addproduct.tag.Doma": { cs: "Doma", sk: "Doma" },
  "addproduct.tag.Práce": { cs: "Práce", sk: "Práca" },
  "addproduct.tag.Akce": { cs: "Akce", sk: "Akcia" },

  // ── Obchody (jen "Jiný"; značky se nepřekládají) ──
  "addproduct.store.Jiný": { cs: "Jiný", sk: "Iný" },
};
