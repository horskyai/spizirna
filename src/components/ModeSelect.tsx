"use client";

import { useModeStore, AppMode } from "@/store/modeStore";
import { Home, ClipboardList, Check, ChefHat } from "lucide-react";

export function ModeSelect({ onDone }: { onDone: () => void }) {
  const setMode = useModeStore((s) => s.setMode);

  const handleSelect = (mode: AppMode) => {
    setMode(mode);
    onDone();
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh px-6"
      style={{ background: "var(--bg-primary)", paddingTop: "env(safe-area-inset-top,0px)", paddingBottom: "env(safe-area-inset-bottom,0px)" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)", boxShadow: "0 8px 24px rgba(76,175,130,0.4)" }}
        >
          <ChefHat size={36} color="white" />
        </div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Spižírna</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Chytrá správa potravin</p>
      </div>

      <p className="text-lg font-bold text-center mb-2" style={{ color: "var(--text-primary)" }}>
        Pro koho je aplikace?
      </p>
      <p className="text-sm text-center mb-8" style={{ color: "var(--text-secondary)" }}>
        Podle výběru přizpůsobíme funkce a rozhraní.
      </p>

      <div className="w-full space-y-4 max-w-sm">
        {/* Domácnost */}
        <button
          onClick={() => handleSelect("domacnost")}
          className="w-full text-left rounded-3xl p-5 transition-all"
          style={{
            background: "white",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "2px solid transparent",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--green-primary)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--green-light)" }}
            >
              <Home size={22} style={{ color: "var(--green-primary)" }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>Domácnost</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Pro rodiny a jednotlivce. Spižírna, recepty, nákupní seznam a zásoby.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {["Spižírna", "Recepty", "Nákup", "Zásoby"].map(f => (
                  <span key={f} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--green-light)", color: "var(--green-dark)" }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </button>

        {/* Provoz */}
        <button
          onClick={() => handleSelect("provoz")}
          className="w-full text-left rounded-3xl p-5 transition-all"
          style={{
            background: "white",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "2px solid transparent",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#6B8F5E")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#EEF4FF" }}
            >
              <ClipboardList size={22} style={{ color: "#4A6BC4" }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Provoz</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#EEF4FF", color: "#4A6BC4" }}>
                  Pro firmy
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Pro restaurace, jídelny a bary. Inventura skladu, dodavatelé a správa zásob.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {["Spižírna", "Recepty", "Nákup", "Inventura", "Sklad", "Dodavatelé"].map(f => (
                  <span key={f} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#EEF4FF", color: "#4A6BC4" }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </button>
      </div>

      <p className="text-xs text-center mt-8" style={{ color: "var(--text-tertiary)" }}>
        Režim lze kdykoli změnit v nastavení
      </p>
    </div>
  );
}
