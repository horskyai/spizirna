// Efekty výhry — veselá fanfára přes Web Audio API (bez zvukových souborů)
// a jemné zavibrování telefonu. Volá se po dotočení kola štěstí.

// Zahraje krátkou vzestupnou fanfáru (ding-ding-ding-dííng).
export function playWinFanfare() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Tóny vzestupně (C–E–G–C), poslední delší — pocit "dosažení".
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const noteLen = 0.14;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * noteLen;
      const dur = i === notes.length - 1 ? 0.4 : noteLen;
      // Krátký náběh a doznění, ať to necvaká.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    });

    // Po doznění kontext zavřeme, ať nezůstává viset.
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    // Zvuk je nice-to-have — když selže (politiky prohlížeče), tiše ignoruj.
  }
}

// Jemné zavibrování (haptika), pokud to zařízení umí.
export function vibrateWin() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([40, 60, 40]);
  }
}
