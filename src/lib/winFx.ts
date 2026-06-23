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

// Napínavý zvuk během točení: tikání kolíčku (zpomaluje) + pod tím
// pomalu stoupající "drone" tón, který buduje napětí (jako kdyby rostlo
// očekávání), a vrcholí těsně před koncem. durationMs = délka animace.
export function playSpinSound(durationMs: number) {
  const ctx = getCtx();
  if (!ctx) return;
  const start = ctx.currentTime;
  const total = durationMs / 1000;

  // 1) Tikání kolíčku — zpomaluje se.
  let t = 0;
  let gap = 0.05;
  while (t < total) {
    tick(ctx, start + t, 880);
    t += gap;
    gap *= 1.12;
  }

  // 2) Napínavý stoupající tón pod tím (drone) — z hloubky nahoru, sílí.
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, start);
  osc.frequency.exponentialRampToValueAtTime(440, start + total); // stoupá
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.06, start + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.16, start + total - 0.2); // sílí ke konci
  gain.gain.exponentialRampToValueAtTime(0.0001, start + total + 0.1);
  // Jemné chvění (tremolo) pro "stresový" pocit.
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 7;
  lfoGain.gain.value = 0.04;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  lfo.start(start);
  osc.stop(start + total + 0.15);
  lfo.stop(start + total + 0.15);
}

// Jeden tón fanfáry.
function tone(ctx: AudioContext, f: number, start: number, d: number, vol: number, type: OscillatorType) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = f;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + d);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + d + 0.05);
}

// Oslavná fanfára na konci — výrazná vzestupná melodie + závěrečný akord.
export function playWinFanfare() {
  const ctx = getCtx();
  if (!ctx) return;
  const base = ctx.currentTime + 0.03;
  // Veselá melodie: G–C–E–G–vysoké C.
  const melody = [
    { f: 392.0, t: 0.0, d: 0.13 },
    { f: 523.25, t: 0.11, d: 0.13 },
    { f: 659.25, t: 0.22, d: 0.13 },
    { f: 783.99, t: 0.33, d: 0.13 },
    { f: 1046.5, t: 0.44, d: 0.45 },
  ];
  melody.forEach(({ f, t, d }) => tone(ctx, f, base + t, d, 0.32, "triangle"));
  // Závěrečný durový akord (C–E–G) pro plný "vítězný" zvuk.
  const chordStart = base + 0.44;
  [523.25, 659.25, 783.99].forEach((f) => tone(ctx, f, chordStart, 0.6, 0.18, "sine"));
}

// Jemné zavibrování (haptika), pokud to zařízení umí.
export function vibrateWin() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([40, 60, 40]);
  }
}
