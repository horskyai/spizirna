"use client";

import { useState } from "react";
import { useModeStore, AppMode } from "@/store/modeStore";
import {
  Home, ClipboardList, Check,
  ScanLine, BookOpen, ShoppingCart, RefreshCw,
  Package, Truck, Sparkles, FileText
} from "lucide-react";

// ── Štítky plánů ──────────────────────────────────────────────────────────────
type Plan = "domacnost" | "provoz";

const PLAN_CHIP: Record<Plan, { label: string; bg: string; color: string }> = {
  domacnost: { label: "Domácnost", bg: "var(--green-light)", color: "var(--green-dark)" },
  provoz: { label: "Provozovna", bg: "#FDEBD7", color: "#B85C00" },
};

// ── Slides onboardingu ────────────────────────────────────────────────────────
const SLIDES: { img: string; title: string; text: string; plans: Plan[] }[] = [
  {
    img: "/icon-192.png",
    title: "Vítej ve Spižírně!",
    text: "Chytrá správa potravin pro domácnost i profesionální provoz. Nikdy víc prošlé jídlo ani chybějící zásoby.",
    plans: ["domacnost", "provoz"],
  },
  {
    img: "/tabs/spizirna.png",
    title: "Přehled zásob",
    text: "Vidíš, co máš v lednici, mrazáku i spíži — včetně množství a data spotřeby. Aplikace tě upozorní, než něco projde.",
    plans: ["domacnost", "provoz"],
  },
  {
    img: "/tabs/skenovat.png",
    title: "Skenuj EAN kódem",
    text: "Naskenuj čárový kód z obalu. Aplikace produkt automaticky najde v databázi a doplní název, nutriční hodnoty i alergeny za tebe.",
    plans: ["domacnost", "provoz"],
  },
  {
    img: "/tabs/recepty.png",
    title: "Recepty z toho, co máš",
    text: "Stovky českých receptů s postupem. Aplikace porovná suroviny s tvojí spižírnou a chybějící položky pošle rovnou do nákupního seznamu.",
    plans: ["domacnost", "provoz"],
  },
  {
    img: "/tabs/nakup.png",
    title: "Nákupní seznam s hlasem",
    text: "Nadiktuj nákup hlasem — „dvě kila brambor a mléko“ — a aplikace položky roztřídí podle kategorií. V obchodě jen odškrtáváš.",
    plans: ["domacnost", "provoz"],
  },
  {
    img: "/tabs/opakovani.png",
    title: "Opakované nákupy",
    text: "Granule, káva, prací prášek… Aplikace si pamatuje, jak často je kupuješ, a včas připomene, že docházejí.",
    plans: ["domacnost"],
  },
  {
    img: "/tabs/provoz.png",
    title: "Inventura & dodavatelé",
    text: "Pro restaurace a jídelny: přesná inventura skladu s minimálními zásobami, správa dodavatelů a export do PDF nebo Excelu.",
    plans: ["provoz"],
  },
];

// ── Feature řádky pro každý plán ─────────────────────────────────────────────
const DOMACNOST_FEATURES = [
  { icon: <ScanLine size={14} />, text: "Spižírna & skenování EAN" },
  { icon: <BookOpen size={14} />, text: "Recepty s postupem vaření" },
  { icon: <ShoppingCart size={14} />, text: "Nákupní seznam s hlasem" },
  { icon: <RefreshCw size={14} />, text: "Opakované nákupy & připomínky" },
  { icon: <Sparkles size={14} />, text: "Gamifikace & streak" },
];

const PROVOZ_FEATURES = [
  { icon: <ScanLine size={14} />, text: "Spižírna & skenování EAN" },
  { icon: <BookOpen size={14} />, text: "Recepty s postupem vaření" },
  { icon: <Package size={14} />, text: "Inventura skladu" },
  { icon: <Truck size={14} />, text: "Správa dodavatelů" },
  { icon: <FileText size={14} />, text: "Export PDF & Excel" },
];

// ── Pomocné chipy ─────────────────────────────────────────────────────────────
function PlanChips({ plans }: { plans: Plan[] }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
      {plans.map((p) => {
        const chip = PLAN_CHIP[p];
        return (
          <span
            key={p}
            style={{
              fontSize: 11, fontWeight: 700,
              background: chip.bg, color: chip.color,
              padding: "4px 12px", borderRadius: 99,
              letterSpacing: "0.02em",
            }}
          >
            {chip.label}
          </span>
        );
      })}
    </div>
  );
}

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
        <img
          src="/icon-192.png"
          alt=""
          width={36}
          height={36}
          draggable={false}
          style={{ borderRadius: 10 }}
        />
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
          <div key={slide} className="animate-fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
            <img
              src={current.img}
              alt=""
              width={104}
              height={104}
              draggable={false}
              style={{
                borderRadius: 26, marginBottom: 24,
                boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
              }}
            />

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

            <PlanChips plans={current.plans} />
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
                  background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Home size={20} color="white" />
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
                  background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
                  textAlign: "center",
                  fontSize: 12, fontWeight: 700, color: "white",
                }}>
                  Vybrat
                </div>
              </button>

              {/* Provozovna */}
              <button
                onClick={() => handleSelect("provoz")}
                onTouchStart={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
                onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  background: "white", borderRadius: 20,
                  border: "2px solid #F59E42",
                  padding: "14px 12px", textAlign: "left",
                  boxShadow: "0 4px 16px rgba(245,158,66,0.18)",
                  cursor: "pointer", transition: "transform 0.15s",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: "linear-gradient(135deg, #F7B267 0%, #E8862E 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <ClipboardList size={20} color="white" />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white", background: "#E8862E", padding: "2px 7px", borderRadius: 99, letterSpacing: "0.04em" }}>
                    PRO FIRMY
                  </span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px" }}>Provozovna</p>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 8px" }}>Restaurace & bary</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#E8862E", margin: "0 0 10px", lineHeight: 1 }}>
                  199 Kč<span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-tertiary)" }}>/měs</span>
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                  {PROVOZ_FEATURES.map(f => (
                    <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <div style={{
                        width: 15, height: 15, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: "#FDEBD7",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#E8862E",
                      }}>
                        <Check size={9} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.35 }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 10, padding: "8px 0", borderRadius: 12,
                  background: "linear-gradient(135deg, #F7B267 0%, #E8862E 100%)",
                  textAlign: "center",
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
