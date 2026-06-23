"use client";

import { useEffect, useRef } from "react";

// Konfety na canvasu — JS animace frame po framu, nespoléhá na CSS keyframes.
// Vykresluje barevné obdélníčky padající a rotující přes celou obrazovku.

const COLORS = ["#4CAF82", "#2E7D5A", "#F7B267", "#E8862E", "#5cde97", "#ffb874", "#EF4444"];
const COUNT = 120;

interface Piece {
  x: number; y: number; w: number; h: number;
  color: string; vy: number; vx: number;
  rot: number; vr: number;
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);

    // Vygeneruj kousky — startují nahoře nad obrazovkou, různá rychlost.
    const pieces: Piece[] = Array.from({ length: COUNT }).map(() => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.5,
      w: 6 + Math.random() * 6,
      h: 9 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vy: 2.5 + Math.random() * 3.5,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
    }));

    let raf = 0;
    let frame = 0;
    const MAX_FRAMES = 220; // ~3.5 s při 60 fps

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pieces.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      frame++;
      if (frame < MAX_FRAMES) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };
    raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 600 }}
    />
  );
}
