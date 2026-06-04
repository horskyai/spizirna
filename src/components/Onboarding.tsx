"use client";

import { useState } from "react";

const STEPS = [
  {
    emoji: "👋",
    title: "Vítej ve Spižírně!",
    text: "Spižírna ti pomůže mít přehled o tom, co máš doma v lednici a skříňkách — a nikdy nic nenechat propadnout.",
  },
  {
    emoji: "📷",
    title: "Naskenuj čárový kód",
    text: "Stačí namířit kameru na čárový kód produktu. Aplikace ho automaticky najde a ukáže ti všechny informace.",
  },
  {
    emoji: "🏠",
    title: "Přidej do spižírny",
    text: "Po naskenování zvol počet kusů a kam produkt ukládáš — do lednice, mrazáku, spíže nebo skříňky.",
  },
  {
    emoji: "🍽️",
    title: "Sleduj co jíš",
    text: "V sekci Jídlo si zaznamenáš co jsi snědl a aplikace ti spočítá kalorie a makronutrienty za celý den.",
  },
  {
    emoji: "📖",
    title: "Recepty a nákup",
    text: "Přidej si oblíbené recepty a aplikace ti řekne, co máš doma a co musíš dokoupit. Nákupní seznam se sestaví sám.",
  },
];

interface Props {
  onDone: () => void;
}

export function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      onDone();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 28px",
        paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 48 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 9999,
              background: i === step ? "var(--green-primary)" : "var(--border)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Emoji */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 28,
          background: "var(--green-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          marginBottom: 32,
        }}
      >
        {current.emoji}
      </div>

      {/* Text */}
      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: "var(--text-primary)",
          textAlign: "center",
          marginBottom: 14,
          lineHeight: 1.25,
        }}
      >
        {current.title}
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "var(--text-secondary)",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 300,
          marginBottom: 48,
        }}
      >
        {current.text}
      </p>

      {/* Buttons */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={next}
          className="btn-primary"
        >
          {isLast ? "Pojďme na to!" : "Další"}
        </button>

        {!isLast && (
          <button
            onClick={onDone}
            style={{ color: "var(--text-tertiary)", fontSize: 14, fontWeight: 500, padding: "8px 0" }}
          >
            Přeskočit
          </button>
        )}
      </div>
    </div>
  );
}
