"use client";

import { useState } from "react";
import { useModeStore, AppMode } from "@/store/modeStore";
import {
  ChefHat, Home, ClipboardList, Check,
  ScanLine, BookOpen, ShoppingCart, RefreshCw,
  Package, Truck, Sparkles, ChevronRight
} from "lucide-react";

// ── Slides onboardingu ────────────────────────────────────────────────────────
const SLIDES = [
  {
    emoji: "👋",
    title: "Vítej ve Spižírně!",
    text: "Chytrá správa potravin pro domácnost i profesionální provoz. Nikdy víc prošlé jídlo ani chybějící zásoby.",
    color: "var(--green-light)",
    accent: "var(--green-primary)",
  },
  {
    emoji: "📷",
    title: "Skenuj EAN kódem",
    text: "Naskenuj čárový kód z obalu. Aplikace produkt automaticky najde v databázi a doplní vše za tebe.",
    color: "#FFF8E1",
    accent: "#F9A825",
  },
  {
    emoji: "🍽️",
    title: "Recepty & nákup",
    text: "Stovky receptů s postupem. Aplikace zjistí co máš doma a sestaví nákupní seznam za tebe.",
    color: "#FDE8F0",
    accent: "#E91E8C",
  },
  {
    emoji: "📊",
    title: "Provoz & inventura",
    text: "Pro restaurace a jídelny: přesná inventura skladu, správa dodavatelů a export do PDF nebo Excelu.",
    color: "#EEF4FF",
    accent: "#4A6BC4",
  },
];

// ── Feature řádky pro každý plán ─────────────────────────────────────────────
const DOMACNOST_FEATURES = [
  { icon: <ScanLine size={14} />, text: "Spižírna & skenování EAN" },
  { icon: <BookOpen size={14} />, text: "Recepty s postupem vaření" },
  { icon: <ShoppingCart size={14} />, text: "Nákupní seznam s hlasem" },
  { icon: <RefreshCw size={14} />, text: "Zásoby & připomínky" },
  { icon: <Sparkles size={14} />, text: "Gamifikace & streak" },
];

const PROVOZ_FEATURES = [
  { icon: <ScanLine size={14} />, text: "Spižírna & skenování EAN" },
  { icon: <BookOpen size={14} />, text: "Recepty s postupem vaření" },
  { icon: <Package size={14} />, text: "Inventura skladu" },
  { icon: <Truck size={14} />, text: "Správa dodavatelů" },
  { icon: <ChevronRight size={14} />, text: "Export PDF & Excel" },
];

// ── Hlavní komponenta ─────────────────────────────────────────────────────────
export function ModeSelect({ onDone }: { onDone: () => void }) {
  const setMode = useModeStore((s) => s.setMode);
  const [slide, setSlide] = useState(0);
  const totalSlides = SLIDES.length + 1; // +1 pro výběr plánu
  const isChoosing = slide === SLIDES.length;

  const handleSelect = (mode: AppMode) => {
    setMode(mode);
    onDone();
  };

  const current = SLIDES[slide];

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "var(--bg-primary)",
      display: "flex",
      flexDirection: "column",
      paddingTop: "env(safe-area-inset-top, 20px)",
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
      overflow: "hidden",
    }}>

      {/* Logo nahoře */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 20px 0" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
        }}>
          <ChefHat size={18} color="white" />
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Spižírna</span>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "14px 0 0" }}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div key={i} style={{
            width: i === slide ? 22 : 6,
            height: 6, borderRadius: 99,
            background: i === slide ? "var(--green-primary)" : i < slide ? "var(--green-primary)" : "var(--border)",
            opacity: i < slide ? 0.4 : 1,
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      {/* Obsah — flex-1 aby zaplnil zbytek */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 20px", minHeight: 0 }}>

        {/* ── ONBOARDING SLIDE ── */}
        {!isChoosing && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
            {/* Emoji box */}
            <div style={{
              width: 96, height: 96, borderRadius: 26,
              background: current.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 46, marginBottom: 24,
              boxShadow: `0 8px 24px ${current.accent}30`,
            }}>
              {current.emoji}
            </div>

            <h1 style={{
              fontSize: 24, fontWeight: 800, color: "var(--text-primary)",
              textAlign: "center", margin: "0 0 12px", lineHeight: 1.2,
            }}>
              {current.title}
            </h1>
            <p style={{
              fontSize: 14, color: "var(--text-secondary)",
              textAlign: "center", lineHeight: 1.6,
              maxWidth: 300, margin: 0,
            }}>
              {current.text}
            </p>
          </div>
        )}

        {/* ── VÝBĚR PLÁNU ── */}
        {isChoosing && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ textAlign: "center", padding: "16px 0 14px" }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 3px" }}>Vyberte svůj plán</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>14 dní zdarma · Zrušit kdykoli</p>
            </div>

            {/* Dvě karty vedle sebe */}
            <div style={{ display: "flex", gap: 10, flex: 1, minHeight: 0, maxHeight: 340 }}>

              {/* Domácnost */}
              <button
                onClick={() => handleSelect("domacnost")}
                onTouchStart={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
                onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  background: "white", borderRadius: 20,
                  border: "2px solid var(--green-primary)",
                  padding: "14px 12px", textAlign: "left",
                  boxShadow: "0 4px 16px rgba(76,175,130,0.15)",
                  cursor: "pointer", transition: "transform 0.15s",
                  overflow: "hidden",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, marginBottom: 8,
                  background: "var(--green-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Home size={20} style={{ color: "var(--green-primary)" }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px" }}>Domácnost</p>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 8px" }}>Pro rodiny</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: "var(--green-primary)", margin: "0 0 10px", lineHeight: 1 }}>
                  99 Kč<span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-tertiary)" }}>/měs</span>
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                  {DOMACNOST_FEATURES.map(f => (
                    <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <div style={{
                        width: 15, height: 15, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: "var(--green-light)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--green-primary)",
                      }}>
                        <Check size={9} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.35 }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 10, padding: "8px 0", borderRadius: 12,
                  background: "var(--green-primary)", textAlign: "center",
                  fontSize: 12, fontWeight: 700, color: "white",
                }}>
                  Vybrat
                </div>
              </button>

              {/* Provoz */}
              <button
                onClick={() => handleSelect("provoz")}
                onTouchStart={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
                onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  background: "white", borderRadius: 20,
                  border: "2px solid #4A6BC4",
                  padding: "14px 12px", textAlign: "left",
                  boxShadow: "0 4px 16px rgba(74,107,196,0.15)",
                  cursor: "pointer", transition: "transform 0.15s",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: "#EEF4FF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <ClipboardList size={20} style={{ color: "#4A6BC4" }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white", background: "#4A6BC4", padding: "2px 7px", borderRadius: 99, letterSpacing: "0.04em" }}>
                    PRO FIRMY
                  </span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px" }}>Provoz</p>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 8px" }}>Restaurace & bary</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#4A6BC4", margin: "0 0 10px", lineHeight: 1 }}>
                  199 Kč<span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-tertiary)" }}>/měs</span>
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                  {PROVOZ_FEATURES.map(f => (
                    <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <div style={{
                        width: 15, height: 15, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: "#EEF4FF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#4A6BC4",
                      }}>
                        <Check size={9} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.35 }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 10, padding: "8px 0", borderRadius: 12,
                  background: "#4A6BC4", textAlign: "center",
                  fontSize: 12, fontWeight: 700, color: "white",
                }}>
                  Vybrat
                </div>
              </button>
            </div>

            <p style={{ fontSize: 10, color: "var(--text-tertiary)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
              Po 14 dnech zdarma se aktivuje platba. Plán lze změnit v nastavení.
            </p>
          </div>
        )}

        {/* Tlačítka navigace — jen na slide stránkách */}
        {!isChoosing && (
          <div style={{ paddingBottom: 8, display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => setSlide(s => s + 1)}
              className="btn-primary"
            >
              {slide === SLIDES.length - 1 ? "Vybrat plán →" : "Další"}
            </button>
            <button
              onClick={() => setSlide(SLIDES.length)}
              style={{ color: "var(--text-tertiary)", fontSize: 13, fontWeight: 500, padding: "6px 0" }}
            >
              Přeskočit na výběr plánu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
