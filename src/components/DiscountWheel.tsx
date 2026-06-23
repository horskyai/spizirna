"use client";

import { useState } from "react";
import { useDiscountStore, DISCOUNT_YEARLY, REGULAR_YEARLY } from "@/store/discountStore";
import { playSpinSound, playWinFanfare, vibrateWin } from "@/lib/winFx";
import { Confetti } from "@/components/Confetti";
import { useT } from "@/lib/i18n";

// Kolo štěstí — uvítací sleva na roční plán. Vždy dojede na zvýhodněnou
// roční cenu (990 Kč). Segmenty střídají 990 a běžných 1490, ať kolo
// vypadá "hrané", ale vyhrává se vždy ta lepší cena.
const SEGMENTS = [DISCOUNT_YEARLY, REGULAR_YEARLY, DISCOUNT_YEARLY, REGULAR_YEARLY, DISCOUNT_YEARLY, REGULAR_YEARLY];
const SEG_ANGLE = 360 / SEGMENTS.length; // 60°
const COLORS = ["#2E7D5A", "#cBdCd2", "#2E7D5A", "#cBdCd2", "#2E7D5A", "#cBdCd2"];
const WIN_INDEX = 0; // segment s 990 Kč, na kterém kolo vždy skončí

type View = "wheel" | "won" | "pay";

export function DiscountWheel({ onClose }: { onClose: () => void }) {
  const t = useT();
  const setWon = useDiscountStore((s) => s.setWon);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [view, setView] = useState<View>("wheel");

  const SPIN_MS = 4200;

  const spin = () => {
    if (spinning || view !== "wheel") return;
    setSpinning(true);

    // Napínavý zvuk po dobu točení.
    playSpinSound(SPIN_MS);

    // Vždy dojede na segment s 990 Kč. 5 plných otáček pro efekt.
    const target = 360 * 5 + (360 - (WIN_INDEX * SEG_ANGLE + SEG_ANGLE / 2));
    setRotation(target);

    setTimeout(() => {
      setView("won");
      setWon(DISCOUNT_YEARLY);
      setSpinning(false);
      // Oslava výhry — fanfára, vibrace, konfety.
      playWinFanfare();
      vibrateWin();
    }, SPIN_MS);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, background: "rgba(0,0,0,0.55)" }}>
      <div className="card animate-slide-up" style={{ width: "100%", maxWidth: 360, padding: 28, textAlign: "center" }}>

        {/* ── KOLO ── */}
        {view === "wheel" && (
          <>
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{t("wheel.title")}</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>{t("wheel.subtitle")}</p>

            <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto 20px" }}>
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
                  const mid = ((i + 0.5) * SEG_ANGLE - 90) * (Math.PI / 180);
                  const tx = 50 + 32 * Math.cos(mid);
                  const ty = 50 + 32 * Math.sin(mid);
                  const isWin = i === WIN_INDEX;
                  return (
                    <g key={i}>
                      <path d={`M50 50 L${x1} ${y1} A50 50 0 0 1 ${x2} ${y2} Z`} fill={COLORS[i]} />
                      <text x={tx} y={ty} fill={isWin ? "white" : "#5a6b60"} fontSize="8" fontWeight="800" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${i * SEG_ANGLE + SEG_ANGLE / 2}, ${tx}, ${ty})`}>
                        {val} Kč
                      </text>
                    </g>
                  );
                })}
                <circle cx="50" cy="50" r="6" fill="white" />
              </svg>
            </div>

            <button onClick={spin} disabled={spinning} className="btn-primary" style={{ opacity: spinning ? 0.7 : 1 }}>
              {spinning ? t("wheel.spinning") : t("wheel.spin")}
            </button>
          </>
        )}

        {/* ── VÝHERNÍ KARTA ── */}
        {view === "won" && (
          <div className="animate-win-pop">
            <div style={{ fontSize: 44, marginBottom: 4 }}>🎉</div>
            <h2 className="font-bold" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 4 }}>{t("wheel.wonTitle")}</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)", marginBottom: 18 }}>{t("wheel.wonPlan")}</p>

            {/* Cena: zvýhodněná velká + přeškrtnutá původní */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, marginBottom: 4 }}>
              <span className="font-bold" style={{ fontSize: 36, color: "var(--green-dark)" }}>{t("wheel.wonPrice")}</span>
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{t("wheel.wonPerYear")}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18 }}>
              <span className="text-sm" style={{ color: "var(--text-tertiary)", textDecoration: "line-through" }}>{t("wheel.wonRegular")}</span>
              <span className="text-xs font-bold" style={{ background: "#FFF3E0", color: "#E8862E", padding: "3px 10px", borderRadius: 99 }}>{t("wheel.wonSave")}</span>
            </div>

            <p className="text-xs" style={{ color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 18 }}>{t("wheel.wonHint")}</p>

            <button onClick={() => setView("pay")} className="btn-primary" style={{ marginBottom: 8 }}>{t("wheel.claim")}</button>
            <button onClick={onClose} className="text-sm w-full py-2" style={{ color: "var(--text-tertiary)", fontWeight: 600 }}>{t("wheel.later")}</button>
          </div>
        )}

        {/* ── PLATEBNÍ OBRAZOVKA (atrapa) ── */}
        {view === "pay" && (
          <div className="animate-fade-in" style={{ textAlign: "left" }}>
            <h2 className="font-bold text-center" style={{ fontSize: 20, color: "var(--text-primary)", marginBottom: 18 }}>{t("wheel.pay.title")}</h2>

            <div className="rounded-2xl" style={{ background: "var(--bg-primary)", padding: 16, marginBottom: 16 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{t("wheel.pay.plan")}</span>
                <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{t("wheel.wonPrice")}</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t("wheel.pay.billed")}</p>
            </div>

            <div className="flex items-center justify-between" style={{ marginBottom: 18, padding: "0 4px" }}>
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{t("wheel.pay.total")}</span>
              <span className="font-bold" style={{ fontSize: 18, color: "var(--green-dark)" }}>{t("wheel.wonPrice")}</span>
            </div>

            <button onClick={onClose} className="btn-primary" style={{ marginBottom: 10 }}>{t("wheel.pay.button")}</button>
            <p className="text-xs text-center" style={{ color: "var(--text-tertiary)", lineHeight: 1.5, marginBottom: 10 }}>{t("wheel.pay.note")}</p>
            <button onClick={() => setView("won")} className="text-sm w-full py-1" style={{ color: "var(--text-tertiary)", fontWeight: 600 }}>{t("wheel.pay.cancel")}</button>
          </div>
        )}

      </div>
      {view === "won" && <Confetti />}
    </div>
  );
}
