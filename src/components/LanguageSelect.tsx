"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useLocaleStore, Locale } from "@/store/localeStore";
import { translate } from "@/lib/i18n";

// Volíme zemi, ne jazyk — Česko nastaví češtinu, Slovensko slovenčinu.
const COUNTRIES: {
  code: Locale;
  flag: string;
  nameKey: "lang.czech" | "lang.slovak";
}[] = [
  { code: "cs", flag: "🇨🇿", nameKey: "lang.czech" },
  { code: "sk", flag: "🇸🇰", nameKey: "lang.slovak" },
];

export function LanguageSelect({ onDone }: { onDone: () => void }) {
  const setLocale = useLocaleStore((s) => s.setLocale);
  // Předvybrané Česko, ať tlačítko dává smysl hned. Texty se vykreslují
  // v jazyce zvolené země, takže uživatel rovnou vidí náhled.
  const [selected, setSelected] = useState<Locale>("cs");

  const confirm = () => {
    setLocale(selected);
    onDone();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 350,
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 28px",
        paddingTop: "calc(32px + env(safe-area-inset-top, 0px))",
        paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Logo */}
      <img
        src="/icon-192.png"
        alt=""
        width={84}
        height={84}
        draggable={false}
        style={{ borderRadius: 22, marginBottom: 28, boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}
      />

      <h1
        style={{
          fontSize: 24, fontWeight: 800, color: "var(--text-primary)",
          textAlign: "center", margin: "0 0 4px", lineHeight: 1.2,
        }}
      >
        {translate("lang.title", selected)}
      </h1>
      <p style={{ fontSize: 13, color: "var(--text-tertiary)", textAlign: "center", margin: "0 0 32px" }}>
        {translate("lang.subtitle", selected)}
      </p>

      {/* Volby země */}
      <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {COUNTRIES.map(({ code, flag, nameKey }) => {
          const active = selected === code;
          return (
            <button
              key={code}
              onClick={() => setSelected(code)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px 18px", borderRadius: 18,
                background: "white",
                border: `2px solid ${active ? "var(--green-primary)" : "var(--border)"}`,
                boxShadow: active ? "0 4px 16px rgba(76,175,130,0.18)" : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                textAlign: "left", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 30, lineHeight: 1 }}>{flag}</span>
              <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
                {translate(nameKey, selected)}
              </span>
              <span
                style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: active ? "var(--green-primary)" : "transparent",
                  border: active ? "none" : "2px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white",
                }}
              >
                {active && <Check size={14} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Potvrzení */}
      <div style={{ width: "100%", maxWidth: 340 }}>
        <button onClick={confirm} className="btn-primary">
          {translate("lang.continue", selected)}
        </button>
      </div>
    </div>
  );
}
