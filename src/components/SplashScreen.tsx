"use client";

import { useState, useEffect } from "react";

const MIN_DISPLAY_MS = 2300;
const FADE_MS = 500;
const APP_NAME = "Spižírna";

export function SplashScreen() {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), MIN_DISPLAY_MS);
    const hideTimer = setTimeout(() => setHidden(true), MIN_DISPLAY_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        background: "linear-gradient(170deg, #0C1810 0%, #122319 100%)",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="splash-glow" />
        <div
          className="splash-zoom"
          style={{
            position: "relative",
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 16px 50px rgba(0,0,0,0.5)",
          }}
        >
          <img src="/icon-192.png" alt="" width={112} height={112} draggable={false} />
          <div className="splash-shine" />
        </div>
      </div>
      <div style={{ color: "white", fontSize: 28, fontWeight: 800, letterSpacing: "0.04em" }}>
        {APP_NAME.split("").map((ch, i) => (
          <span key={i} className="splash-letter" style={{ animationDelay: `${1.05 + i * 0.07}s` }}>
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}
