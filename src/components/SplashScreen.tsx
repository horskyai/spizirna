"use client";

import { useState, useEffect } from "react";

const MIN_DISPLAY_MS = 1100;
const FADE_MS = 450;

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
        gap: 20,
        background: "linear-gradient(160deg, var(--hero-bg) 0%, var(--hero-card) 100%)",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <img
        src="/icon-192.png"
        alt=""
        width={104}
        height={104}
        className="splash-icon"
        style={{ borderRadius: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}
      />
      <div style={{ color: "white", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Spižírna
      </div>
      <div className="flex gap-2" style={{ marginTop: 4 }}>
        <span className="splash-dot" />
        <span className="splash-dot" style={{ animationDelay: "0.15s" }} />
        <span className="splash-dot" style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}
