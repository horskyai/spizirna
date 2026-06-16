"use client";

import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";

// Příručka okna. Poprvé se ukáže sama (podle localStorage flagu per okno),
// pak ji lze znovu vyvolat přes "?" v hlavičce daného okna.
//
// Použití v okně:
//   const g = useScreenGuide("pantry");
//   ...tlačítko: <button onClick={g.show}>?</button>
//   ...kdekoliv: <ScreenGuide guide={g} titleKey="guide.pantry.title"
//                   introKey="guide.pantry.intro"
//                   steps={["guide.pantry.s1", "guide.pantry.s2", ...]} />
// Každý krok je prefix klíče: očekává <prefix>t (titulek) a <prefix>d (popis).

export interface ScreenGuideState {
  open: boolean;
  show: () => void;
  close: () => void;
}

export function useScreenGuide(id: string): ScreenGuideState {
  const flagKey = `guide-seen-${id}`;
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(flagKey);
  });
  const show = useCallback(() => setOpen(true), []);
  const close = useCallback(() => {
    setOpen(false);
    try { localStorage.setItem(flagKey, "1"); } catch {}
  }, [flagKey]);
  return { open, show, close };
}

interface Props {
  guide: ScreenGuideState;
  titleKey: string;
  introKey: string;
  steps: string[]; // prefixy klíčů, k nim se připojí "t" a "d"
}

export function ScreenGuide({ guide, titleKey, introKey, steps }: Props) {
  const t = useT();
  if (!guide.open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 220, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div className="sheet-overlay animate-fade-in" onClick={guide.close} style={{ position: "absolute", inset: 0 }} />
      <div
        className="relative animate-slide-up rounded-t-3xl"
        style={{ background: "var(--bg-primary)", paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))", maxHeight: "88dvh", overflowY: "auto" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="px-5 pt-2 pb-2">
          <div className="flex items-start justify-between mb-1.5">
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t(titleKey)}</h3>
            <button onClick={guide.close} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--border)" }}>
              <X size={15} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>{t(introKey)}</p>

          <div className="space-y-3">
            {steps.map((prefix, i) => (
              <div key={prefix} className="flex gap-3">
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 13 }}>
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t(prefix + "t")}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>{t(prefix + "d")}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={guide.close} className="btn-primary" style={{ marginTop: 18 }}>
            {t("guide.understood")}
          </button>
        </div>
      </div>
    </div>
  );
}
