import type { Translation } from "./dict";

// Kolo štěstí — uvítací sleva po registraci (jen domácnost).
export const wheel: Record<string, Translation> = {
  "wheel.title": { cs: "Dárek za týden se Spižírnou 🎁", sk: "Darček za týždeň so Špajzou 🎁" },
  "wheel.subtitle": { cs: "Zatoč kolem a získej roční předplatné se slevou", sk: "Zatoč kolesom a získaj ročné predplatné so zľavou" },
  "wheel.spin": { cs: "Zatočit kolem", sk: "Zatočiť kolesom" },
  "wheel.spinning": { cs: "Točí se…", sk: "Točí sa…" },
  "wheel.wonTitle": { cs: "Vyhráli jste!", sk: "Vyhrali ste!" },
  "wheel.wonPlan": { cs: "Roční plán Domácnost", sk: "Ročný plán Domácnosť" },
  "wheel.wonPrice": { cs: "990 Kč", sk: "39,90 €" },
  "wheel.wonRegular": { cs: "1 490 Kč", sk: "59,90 €" },
  "wheel.wonPerYear": { cs: "/ rok", sk: "/ rok" },
  "wheel.wonSave": { cs: "Ušetříte 500 Kč", sk: "Ušetríte 20 €" },
  "wheel.wonHint": {
    cs: "Tato cena platí jen pro tebe — uplatní se hned při přechodu na roční plán.",
    sk: "Táto cena platí len pre teba — uplatní sa hneď pri prechode na ročný plán.",
  },
  "wheel.claim": { cs: "Získat roční za 990 Kč", sk: "Získať ročné za 39,90 €" },
  "wheel.later": { cs: "Možná později", sk: "Možno neskôr" },

  // Platební obrazovka (atrapa — reálná platba přijde s IAP)
  "wheel.pay.title": { cs: "Dokončit předplatné", sk: "Dokončiť predplatné" },
  "wheel.pay.plan": { cs: "Roční plán Domácnost", sk: "Ročný plán Domácnosť" },
  "wheel.pay.billed": { cs: "Účtováno jednou ročně", sk: "Účtované raz ročne" },
  "wheel.pay.total": { cs: "Celkem dnes", sk: "Spolu dnes" },
  "wheel.pay.button": { cs: "Zaplatit 990 Kč", sk: "Zaplatiť 39,90 €" },
  "wheel.pay.note": {
    cs: "Ukázka platby — skutečná platba proběhne přes App Store / Google Play.",
    sk: "Ukážka platby — skutočná platba prebehne cez App Store / Google Play.",
  },
  "wheel.pay.cancel": { cs: "Zpět", sk: "Späť" },
};
