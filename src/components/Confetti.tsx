"use client";

// Jednoduché konfety — barevné kousky padající přes celou obrazovku.
// Čistě CSS animace (confettiFall v globals.css), žádná knihovna.

const COLORS = ["#4CAF82", "#2E7D5A", "#F7B267", "#E8862E", "#5cde97", "#ffb874"];
const COUNT = 40;

export function Confetti() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 500, overflow: "hidden" }}>
      {Array.from({ length: COUNT }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const duration = 1.8 + Math.random() * 1.4;
        const color = COLORS[i % COLORS.length];
        const size = 7 + Math.random() * 7;
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}vw`,
              width: size,
              height: size * 1.4,
              background: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}
