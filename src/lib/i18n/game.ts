import type { Translation } from "./dict";

// Texty pro odznak pokroku (gamifikace) — úrovně, série, zachráněné potraviny.
export const game: Record<string, Translation> = {
  // Úrovně (podle skóre)
  "game.level.beginner": { cs: "Začátečník", sk: "Začiatočník" },
  "game.level.cook": { cs: "Domácí kuchař", sk: "Domáci kuchár" },
  "game.level.chef": { cs: "Spořivý šéfkuchař", sk: "Šetrný šéfkuchár" },
  "game.level.master": { cs: "Mistr spižírny", sk: "Majster špajze" },
  "game.level.legend": { cs: "Legendární hospodář", sk: "Legendárny hospodár" },

  // Odznak v přehledu
  "game.streak": { cs: "{n} dní v řadě", sk: "{n} dní v rade" },
  "game.streakOne": { cs: "1 den v řadě", sk: "1 deň v rade" },
  "game.streakZero": { cs: "Začni sérii ještě dnes", sk: "Začni sériu ešte dnes" },
  "game.saved": { cs: "{n} potravin zachráněno", sk: "{n} potravín zachránených" },
  "game.savedOne": { cs: "1 potravina zachráněna", sk: "1 potravina zachránená" },
  "game.savedZero": { cs: "Zatím nic nezachráněno", sk: "Zatiaľ nič nezachránené" },
  "game.toNext": { cs: "{n} bodů do další úrovně", sk: "{n} bodov do ďalšej úrovne" },
  "game.maxLevel": { cs: "Nejvyšší úroveň 🎉", sk: "Najvyššia úroveň 🎉" },
  "game.points": { cs: "{n} bodů", sk: "{n} bodov" },
};
