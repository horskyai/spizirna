"use client";

import { useModeStore, AppMode } from "@/store/modeStore";
import { Home, ClipboardList, ChefHat } from "lucide-react";

export function ModeSelect({ onDone }: { onDone: () => void }) {
  const setMode = useModeStore((s) => s.setMode);

  const handleSelect = (mode: AppMode) => {
    setMode(mode);
    onDone();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        background: "var(--bg-primary)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
          boxShadow: "0 8px 24px rgba(76,175,130,0.4)",
          marginBottom: 14,
        }}>
          <ChefHat size={32} color="white" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>Spižírna</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>Chytrá správa potravin</p>
      </div>

      {/* Otázka */}
      <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: 6 }}>
        Pro koho je aplikace?
      </p>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
        Podle výběru upravíme rozhraní.
      </p>

      {/* Karty */}
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Domácnost */}
        <button
          onClick={() => handleSelect("domacnost")}
          style={{
            width: "100%", textAlign: "left",
            background: "white", borderRadius: 20, padding: "14px 16px",
            border: "2px solid transparent",
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            display: "flex", alignItems: "center", gap: 14,
            transition: "border-color 0.15s, box-shadow 0.15s",
            cursor: "pointer",
          }}
          onTouchStart={e => { e.currentTarget.style.borderColor = "var(--green-primary)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(76,175,130,0.2)"; }}
          onTouchEnd={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}
        >
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--green-light)",
          }}>
            <Home size={20} style={{ color: "var(--green-primary)" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px" }}>Domácnost</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Pro rodiny a jednotlivce
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {["Spižírna", "Recepty", "Nákup", "Zásoby"].map(f => (
                <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "var(--green-light)", color: "var(--green-dark)" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--green-light)",
          }}>
            <span style={{ fontSize: 14, color: "var(--green-primary)", fontWeight: 700 }}>›</span>
          </div>
        </button>

        {/* Provoz */}
        <button
          onClick={() => handleSelect("provoz")}
          style={{
            width: "100%", textAlign: "left",
            background: "white", borderRadius: 20, padding: "14px 16px",
            border: "2px solid transparent",
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            display: "flex", alignItems: "center", gap: 14,
            transition: "border-color 0.15s, box-shadow 0.15s",
            cursor: "pointer",
          }}
          onTouchStart={e => { e.currentTarget.style.borderColor = "#4A6BC4"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(74,107,196,0.2)"; }}
          onTouchEnd={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}
        >
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#EEF4FF",
          }}>
            <ClipboardList size={20} style={{ color: "#4A6BC4" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Provoz</p>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#EEF4FF", color: "#4A6BC4" }}>
                Pro firmy
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Restaurace, jídelny, bary
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {["Spižírna", "Recepty", "Nákup", "Inventura", "Sklad", "Dodavatelé"].map(f => (
                <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#EEF4FF", color: "#4A6BC4" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#EEF4FF",
          }}>
            <span style={{ fontSize: 14, color: "#4A6BC4", fontWeight: 700 }}>›</span>
          </div>
        </button>
      </div>

      <p style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", marginTop: 20 }}>
        Režim lze kdykoli změnit v nastavení
      </p>
    </div>
  );
}
