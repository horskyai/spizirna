import type { Translation } from "./dict";

// Překlady pro PricesView (sledování cen). Prefix "prices.".
export const prices: Record<string, Translation> = {
  "prices.title": { cs: "Ceny", sk: "Ceny" },

  // ── Prázdný stav ──
  "prices.emptyTitle": { cs: "Žádná cenová data", sk: "Žiadne cenové dáta" },
  "prices.emptyDesc": {
    cs: "Při skenování produktů zadejte cenu pro sledování vývoje.",
    sk: "Pri skenovaní produktov zadajte cenu pre sledovanie vývoja.",
  },

  // ── Karta produktu ──
  "prices.eanLabel": { cs: "EAN:", sk: "EAN:" },
  "prices.recordsOne": { cs: "{n} záznam", sk: "{n} záznam" },
  "prices.recordsMany": { cs: "{n} záznamů", sk: "{n} záznamov" },
  "prices.save": { cs: "Ušetřit {n} CZK", sk: "Ušetriť {n} CZK" },
  "prices.cheapest": { cs: "nejlevnější", sk: "najlacnejšie" },
  "prices.bestPriceLabel": { cs: "Nejlepší cena:", sk: "Najlepšia cena:" },
  "prices.bestPriceIn": { cs: "v", sk: "v" },
};
