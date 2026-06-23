"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Konfety na canvasu — JS animace frame po framu, nespoléhá na CSS keyframes.
// Vykresluje barevné obdélníčky padající a rotující přes celou obrazovku.

const COLORS = ["#4CAF82", "#2E7D5A", "#F7B267", "#E8862E", "#5cde97", "#ffb874", "#EF4444", "#3B82F6", "#A855F7"];
const COUNT = 90;

interface Piece {
  x: number; y: number; w: number; h: number;
  color: string; vy: number; vx: number;
  rot: number; vr: number;
  shape: "circle" | "rect"; wobble: number;
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);

    // Vygeneruj kousky — startují nad obrazovkou, různý tvar, rychlost, barva.
    const pieces: Piece[] = Array.from({ length: COUNT }).map(() => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.4,
      w: 7 + Math.random() * 7,
      h: 10 + Math.random() * 9,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vy: 3 + Math.random() * 4,
      vx: -2 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      vr: -0.3 + Math.random() * 0.6,
      shape: Math.random() < 0.4 ? "circle" : "rect",
      wobble: Math.random() * Math.PI * 2,
    }));

    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      pieces.forEach((p) => {
        // Vlnění do stran + gravitace → přirozenější pád.
        p.wobble += 0.1;
        p.x += p.vx + Math.sin(p.wobble) * 1.2;
        p.y += p.vy;
        p.vy += 0.04;
        p.rot += p.vr;
        if (p.y < H + 40) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      });
      if (alive) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };
    raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  if (!mounted) return null;

  // Portál na <body> — konfety jsou nad VŠÍM, mimo stacking context kola.
  return createPortal(
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 9999 }}
    />,
    document.body
  );
}
