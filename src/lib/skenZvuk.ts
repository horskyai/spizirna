// Zvukové + haptické potvrzení skenu v kase.
// Obsluha nemusí koukat na displej — ucho/prst řekne, jak sken dopadl:
//   ok       = jeden vysoký příjemný "bíp" (zboží přidáno)
//   duplicita = dva rychlé bípy (např. stejný kód znovu / opětovné přidání)
//   chyba    = jeden nízký delší tón (neznámý kód / není ve skladu)
//
// Zvuk generujeme přes Web Audio API (žádný externí soubor → funguje offline).
// Haptika přes navigator.vibrate (na mobilu). Vše je best-effort: když
// prohlížeč něco nepodporuje, tiše se přeskočí.

type SkenVysledek = "ok" | "duplicita" | "chyba";

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    // iOS/Chrome uspí kontext, dokud uživatel neklikne — probudíme ho.
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

// Jeden tón: frekvence (Hz), délka (s), hlasitost, začátek od now+offset.
function ton(ac: AudioContext, freq: number, delka: number, hlasitost: number, offset = 0) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const start = ac.currentTime + offset;
  // Krátký náběh/doběh, ať to necvaká.
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(hlasitost, start + 0.008);
  gain.gain.linearRampToValueAtTime(0, start + delka);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(start);
  osc.stop(start + delka + 0.02);
}

function vibrace(vzor: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(vzor);
  } catch {
    /* haptika není kritická */
  }
}

// Hlavní funkce — zavolá se po skenu / pokusu o přidání.
export function skenZvuk(vysledek: SkenVysledek) {
  const ac = audioCtx();
  switch (vysledek) {
    case "ok":
      if (ac) ton(ac, 880, 0.09, 0.18); // A5, krátký příjemný bíp
      vibrace(35);
      break;
    case "duplicita":
      if (ac) { ton(ac, 780, 0.07, 0.16, 0); ton(ac, 780, 0.07, 0.16, 0.11); } // dva bípy
      vibrace([30, 40, 30]);
      break;
    case "chyba":
      if (ac) ton(ac, 220, 0.28, 0.2); // nízký delší tón = pozor
      vibrace([80, 50, 80]);
      break;
  }
}
