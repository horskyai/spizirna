"use client";

import { useState } from "react";
import { useDiscountStore } from "@/store/discountStore";
import { useT } from "@/lib/i18n";

// Kolo štěstí — uvítací sleva. Vždy vyhraje (10/20/30 %), 6 segmentů.
// Segmenty střídají hodnoty, ať kolo vypadá bohatě, ale výhra je vždy sleva.
const SEGMENTS = [10, 20, 30, 10, 20, 30];
const SEG_ANGLE = 360 / SEGMENTS.length; // 60°
const COLORS = ["#4CAF82", "#2E7D5A", "#F7B267", "#4CAF82", "#2E7D5A", "#F7B267"];

export function DiscountWheel({ onClose }: { onClose: () => void }) {
  const t = useT();
  const setResult = useDiscountStore((s) => s.setResult);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<number | null>(null);

  const spin = () => {
    if (spinning || won !== null) return;
    setSpinning(true);

    // Vyber cílový segment náhodně (každý je výhra).
    const idx = Math.floor(Math.random() * SEGMENTS.length);
    const prize = SEGMENTS[idx];

    // Úhel tak, aby střed segmentu skončil nahoře pod ukazatelem (12 hodin).
    // Přidáme 5 plných otáček pro efekt.
    const target = 360 * 5 + (360 - (idx * SEG_ANGLE + SEG_ANGLE / 2));
    setRotation(target);

    // Po dotočení (musí sednout na CSS transition 4s) ulož výsledek.
    setTimeout(() => {
      setWon(prize);
      setResult(prize);
      setSpinning(false);
    }, 4200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, background: "rgba(0,0,0,0.55)" }}>
      <div className="card animate-slide-up" style={{ width: "100%", maxWidth: 360, padding: 28, textAlign: "center" }}>
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{t("wheel.title")}</h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>{t("wheel.subtitle")}</p>

        {/* Kolo */}
        <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto 20px" }}>
          {/* Ukazatel nahoře */}
          <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", zIndex: 2, width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: "18px solid var(--text-primary)" }} />
          <svg
            viewBox="0 0 100 100"
            width={240}
            height={240}
            style={{ transform: `rotate(${rotation}deg)`, transition: "transform 4s cubic-bezier(0.17, 0.67, 0.16, 1)" }}
          >
            {SEGMENTS.map((val, i) => {
              const start = (i * SEG_ANGLE - 90) * (Math.PI / 180);
              const end = ((i + 1) * SEG_ANGLE - 90) * (Math.PI / 180);
              const x1 = 50 + 50 * Math.cos(start);
              const y1 = 50 + 50 * Math.sin(start);
              const x2 = 50 + 50 * Math.cos(end);
              const y2 = 50 + 50 * Math.sin(end);
              // Pozice textu — uprostřed segmentu, blíž k okraji.
              const mid = ((i + 0.5) * SEG_ANGLE - 90) * (Math.PI / 180);
              const tx = 50 + 32 * Math.cos(mid);
              const ty = 50 + 32 * Math.sin(mid);
              return (
                <g key={i}>
                  <path d={`M50 50 L${x1} ${y1} A50 50 0 0 1 ${x2} ${y2} Z`} fill={COLORS[i]} />
                  <text x={tx} y={ty} fill="white" fontSize="9" fontWeight="800" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${i * SEG_ANGLE + SEG_ANGLE / 2}, ${tx}, ${ty})`}>
                    {val}%
                  </text>
                </g>
              );
            })}
            <circle cx="50" cy="50" r="6" fill="white" />
          </svg>
        </div>

        {won === null ? (
          <button onClick={spin} disabled={spinning} className="btn-primary" style={{ opacity: spinning ? 0.7 : 1 }}>
            {spinning ? t("wheel.spinning") : t("wheel.spin")}
          </button>
        ) : (
          <>
            <p className="text-lg font-bold mb-1" style={{ color: "var(--green-dark)" }}>
              🎉 {t("wheel.won").replace("{n}", String(won))}
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>{t("wheel.wonHint")}</p>
            <button onClick={onClose} className="btn-primary">{t("wheel.claim")}</button>
          </>
        )}
      </div>
    </div>
  );
}
