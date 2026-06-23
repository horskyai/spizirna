// Efekty výhry — zvuky přes Web Audio API (bez zvukových souborů).
// spinSound: tikání během točení kola. winFanfare: oslavná melodie na konci.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) audioCtx = new AudioCtx();
    // iOS: kontext bývá "suspended", dokud ho neprobudí uživatelská akce.
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  } catch {
    return null;
  }
}

// Krátké "tik" (jedno cvaknutí kolíčku o kolo).
function tick(ctx: AudioContext, at: number, freq: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.12, at + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.07);
}

// Tikání během točení — cvaknutí se postupně zpomalují (jako dojíždějící kolo).
// durationMs by mělo odpovídat délce animace kola.
export function playSpinSound(durationMs: number) {
  const ctx = getCtx();
  if (!ctx) return;
  const start = ctx.currentTime;
  const total = durationMs / 1000;
  let t = 0;
  let gap = 0.05; // začátek: rychlé cvakání
  // Postupně zvětšujeme mezeru → kolo zpomaluje.
  while (t < total) {
    tick(ctx, start + t, 880);
    t += gap;
    gap *= 1.12; // každé další cvaknutí o něco pomalejší
  }
}

// Oslavná fanfára na konci — vzestupné akordy, čistý a veselý zvuk.
export function playWinFanfare() {
  const ctx = getCtx();
  if (!ctx) return;
  // Durový rozklad C–E–G–vysoké C, poslední tón delší a "zazvoní".
  const notes = [
    { f: 523.25, t: 0.0, d: 0.16 },
    { f: 659.25, t: 0.13, d: 0.16 },
    { f: 783.99, t: 0.26, d: 0.16 },
    { f: 1046.5, t: 0.39, d: 0.5 },
  ];
  const base = ctx.currentTime + 0.02;
  notes.forEach(({ f, t, d }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine"; // čistší a příjemnější než triangle
    osc.frequency.value = f;
    const start = base + t;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + d);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + d + 0.05);
  });
}

// Jemné zavibrování (haptika), pokud to zařízení umí.
export function vibrateWin() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([40, 60, 40]);
  }
}
