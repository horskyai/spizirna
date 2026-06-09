"use client";

import { useModeStore, AppMode } from "@/store/modeStore";
import { Home, ClipboardList, Layers, ChefHat, Check } from "lucide-react";

const PLANS: {
  id: AppMode;
  name: string;
  price: string;
  priceNote: string;
  desc: string;
  color: string;
  colorLight: string;
  icon: React.ReactNode;
  badge?: string;
  features: string[];
  tags: string[];
}[] = [
  {
    id: "domacnost",
    name: "Domácnost",
    price: "99 Kč",
    priceNote: "/ měsíc",
    desc: "Pro rodiny a jednotlivce",
    color: "var(--green-primary)",
    colorLight: "var(--green-light)",
    icon: <Home size={20} style={{ color: "var(--green-primary)" }} />,
    features: [
      "Spižírna & skenování EAN",
      "Recepty s postupem vaření",
      "Nákupní seznam s hlasem",
      "Zásoby & připomínky",
      "Gamifikace & streak",
    ],
    tags: ["Spižírna", "Recepty", "Nákup", "Zásoby"],
  },
  {
    id: "provoz",
    name: "Provoz",
    price: "199 Kč",
    priceNote: "/ měsíc",
    desc: "Pro restaurace, jídelny, bary",
    color: "#4A6BC4",
    colorLight: "#EEF4FF",
    icon: <ClipboardList size={20} style={{ color: "#4A6BC4" }} />,
    badge: "Pro firmy",
    features: [
      "Spižírna & skenování EAN",
      "Recepty s postupem vaření",
      "Nákupní seznam s hlasem",
      "Inventura skladu",
      "Správa dodavatelů",
    ],
    tags: ["Spižírna", "Recepty", "Nákup", "Inventura", "Dodavatelé"],
  },
  {
    id: "kompletni",
    name: "Kompletní",
    price: "249 Kč",
    priceNote: "/ měsíc",
    desc: "Domácnost i provoz v jednom",
    color: "#9B6BC4",
    colorLight: "#F5EEFF",
    icon: <Layers size={20} style={{ color: "#9B6BC4" }} />,
    badge: "Nejlepší hodnota",
    features: [
      "Vše z plánu Domácnost",
      "Vše z plánu Provoz",
      "Zásoby & připomínky",
      "Inventura skladu",
      "Správa dodavatelů",
    ],
    tags: ["Domácnost", "Provoz", "Vše v jednom"],
  },
];

export function ModeSelect({ onDone }: { onDone: () => void }) {
  const setMode = useModeStore((s) => s.setMode);

  const handleSelect = (mode: AppMode) => {
    setMode(mode);
    onDone();
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg-primary)",
      paddingTop: "env(safe-area-inset-top, 20px)",
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
      overflowY: "auto",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 32px" }}>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
            boxShadow: "0 8px 24px rgba(76,175,130,0.4)",
            marginBottom: 12,
          }}>
            <ChefHat size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>
            Spižírna
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "3px 0 0" }}>
            Chytrá správa potravin
          </p>
        </div>

        {/* Nadpis */}
        <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: 4 }}>
          Vyberte svůj plán
        </p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", marginBottom: 20 }}>
          14 dní zdarma · Zrušit kdykoli
        </p>

        {/* Plány */}
        <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 }}>
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handleSelect(plan.id)}
              style={{
                width: "100%", textAlign: "left",
                background: "white", borderRadius: 20,
                border: `2px solid ${plan.id === "kompletni" ? plan.color + "40" : "transparent"}`,
                boxShadow: plan.id === "kompletni"
                  ? `0 4px 20px ${plan.color}25`
                  : "0 2px 12px rgba(0,0,0,0.07)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.1s",
              }}
              onTouchStart={e => { e.currentTarget.style.transform = "scale(0.985)"; }}
              onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {/* Badge na Kompletní */}
              {plan.badge && (
                <div style={{
                  background: plan.color,
                  padding: "5px 16px",
                  textAlign: "center",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "white", letterSpacing: "0.04em" }}>
                    {plan.badge === "Nejlepší hodnota" ? "⭐ " : ""}{plan.badge}
                  </span>
                </div>
              )}

              <div style={{ padding: "14px 16px" }}>
                {/* Hlavička */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: plan.colorLight,
                  }}>
                    {plan.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      {plan.name}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                      {plan.desc}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: plan.color, margin: 0, lineHeight: 1 }}>
                      {plan.price}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>
                      {plan.priceNote}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: plan.colorLight,
                      }}>
                        <Check size={10} style={{ color: plan.color }} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA tlačítko */}
                <div style={{
                  width: "100%", padding: "10px 0",
                  borderRadius: 14, textAlign: "center",
                  background: plan.color,
                  fontSize: 13, fontWeight: 700, color: "white",
                }}>
                  Vybrat {plan.name}
                </div>
              </div>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          Po 14 dnech zdarma se aktivuje platba.{"\n"}Plán lze změnit v nastavení profilu.
        </p>
      </div>
    </div>
  );
}
