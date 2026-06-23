import type { Translation } from "./dict";

// Kolo štěstí — uvítací sleva po registraci (jen domácnost).
export const wheel: Record<string, Translation> = {
  "wheel.title": { cs: "Uvítací dárek 🎁", sk: "Uvítací darček 🎁" },
  "wheel.subtitle": { cs: "Zatoč kolem a získej slevu na předplatné", sk: "Zatoč kolesom a získaj zľavu na predplatné" },
  "wheel.spin": { cs: "Zatočit kolem", sk: "Zatočiť kolesom" },
  "wheel.spinning": { cs: "Točí se…", sk: "Točí sa…" },
  "wheel.won": { cs: "Získal jsi slevu {n} %!", sk: "Získal si zľavu {n} %!" },
  "wheel.wonHint": {
    cs: "Sleva se uplatní při přechodu na placený plán.",
    sk: "Zľava sa uplatní pri prechode na platený plán.",
  },
  "wheel.claim": { cs: "Super, beru!", sk: "Super, beriem!" },
};
