import type { Translation } from "./dict";

// Kolo štěstí — uvítací sleva po registraci (jen domácnost).
export const wheel: Record<string, Translation> = {
  "wheel.title": { cs: "Dárek za týden se Spižírnou 🎁", sk: "Darček za týždeň so Špajzou 🎁" },
  "wheel.subtitle": { cs: "Zatoč kolem a získej roční předplatné se slevou", sk: "Zatoč kolesom a získaj ročné predplatné so zľavou" },
  "wheel.spin": { cs: "Zatočit kolem", sk: "Zatočiť kolesom" },
  "wheel.spinning": { cs: "Točí se…", sk: "Točí sa…" },
  "wheel.wonTitle": { cs: "Vyhráli jste!", sk: "Vyhrali ste!" },
  "wheel.won": { cs: "Roční jen za 990 Kč místo 1 490 Kč!", sk: "Ročné len za 39,90 € namiesto 59,90 €!" },
  "wheel.wonHint": {
    cs: "Zvýhodněná cena se uplatní při přechodu na roční plán.",
    sk: "Zvýhodnená cena sa uplatní pri prechode na ročný plán.",
  },
  "wheel.claim": { cs: "Super, beru!", sk: "Super, beriem!" },
};
