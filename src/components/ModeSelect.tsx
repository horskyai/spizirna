"use client";

import { useState } from "react";
import { useModeStore, AppMode } from "@/store/modeStore";
import { useLocaleStore, Locale } from "@/store/localeStore";
import { useT } from "@/lib/i18n";
import {
  Check,
  ScanLine, BookOpen, ShoppingCart, RefreshCw,
  Package, Truck, Sparkles, FileText
} from "lucide-react";

// ── Štítky plánů ──────────────────────────────────────────────────────────────
type Plan = "domacnost" | "provoz";

const PLAN_CHIP: Record<Plan, { labelKey: "plan.domacnost" | "plan.provoz"; bg: string; color: string }> = {
  domacnost: { labelKey: "plan.domacnost", bg: "var(--green-light)", color: "var(--green-dark)" },
  provoz: { labelKey: "plan.provoz", bg: "#FDEBD7", color: "#B85C00" },
};

// Dvojjazyčný text (čeština + slovenština)
type L10n = { cs: string; sk: string };

// ── Slides onboardingu ────────────────────────────────────────────────────────
const SLIDES: { img: string; title: L10n; text: L10n; plans: Plan[] }[] = [
  {
    img: "/icon-192.png",
    title: { cs: "Vítej ve Spižírně!", sk: "Vitaj v Špajze!" },
    text: {
      cs: "Chytrá správa potravin pro domácnost i profesionální provoz. Nikdy víc prošlé jídlo ani chybějící zásoby.",
      sk: "Inteligentná správa potravín pre domácnosť aj profesionálnu prevádzku. Už nikdy prešlé jedlo ani chýbajúce zásoby.",
    },
    plans: ["domacnost", "provoz"],
  },
  {
    img: "/onboarding/zasoby.png",
    title: { cs: "Přehled zásob", sk: "Prehľad zásob" },
    text: {
      cs: "Vidíš, co máš v lednici, mrazáku i spíži — včetně množství a data spotřeby. Aplikace tě upozorní, než něco projde.",
      sk: "Vidíš, čo máš v chladničke, mrazničke aj špajze — vrátane množstva a dátumu spotreby. Aplikácia ťa upozorní skôr, než niečo prejde.",
    },
    plans: ["domacnost", "provoz"],
  },
  {
    img: "/onboarding/skener.png",
    title: { cs: "Skenuj EAN kódem", sk: "Skenuj EAN kódom" },
    text: {
      cs: "Naskenuj čárový kód z obalu. Aplikace produkt automaticky najde v databázi a doplní název, nutriční hodnoty i alergeny za tebe.",
      sk: "Naskenuj čiarový kód z obalu. Aplikácia produkt automaticky nájde v databáze a doplní názov, nutričné hodnoty aj alergény za teba.",
    },
    plans: ["domacnost", "provoz"],
  },
  {
    img: "/onboarding/recepty.png",
    title: { cs: "Recepty z toho, co máš", sk: "Recepty z toho, čo máš" },
    text: {
      cs: "Stovky českých receptů s postupem. Aplikace porovná suroviny s tvojí spižírnou a chybějící položky pošle rovnou do nákupního seznamu.",
      sk: "Stovky receptov s postupom. Aplikácia porovná suroviny s tvojou špajzou a chýbajúce položky pošle rovno do nákupného zoznamu.",
    },
    plans: ["domacnost", "provoz"],
  },
  {
    img: "/onboarding/nakup-hlas.png",
    title: { cs: "Nákupní seznam s hlasem", sk: "Nákupný zoznam hlasom" },
    text: {
      cs: "Nadiktuj nákup hlasem — „dvě kila brambor a mléko“ — a aplikace položky roztřídí podle kategorií. V obchodě jen odškrtáváš.",
      sk: "Nadiktuj nákup hlasom — „dve kilá zemiakov a mlieko“ — a aplikácia položky roztriedi podľa kategórií. V obchode už len odškrtávaš.",
    },
    plans: ["domacnost", "provoz"],
  },
  {
    img: "/onboarding/opakovani.png",
    title: { cs: "Opakované nákupy", sk: "Opakované nákupy" },
    text: {
      cs: "Granule, káva, prací prášek… Aplikace si pamatuje, jak často je kupuješ, a včas připomene, že docházejí.",
      sk: "Granule, káva, prací prášok… Aplikácia si pamätá, ako často ich kupuješ, a včas pripomenie, že dochádzajú.",
    },
    plans: ["domacnost"],
  },
  {
    img: "/onboarding/zasoby.png",
    title: { cs: "Kalorie & statistiky", sk: "Kalórie & štatistiky" },
    text: {
      cs: "Volitelně si zapneš deník jídla — zapisuješ, co jíš, a sleduješ kalorie i cíl. A statistiky ukážou hodnotu spížírny i kolik jsi ušetřil nebo vyhodil.",
      sk: "Voliteľne si zapneš denník jedla — zapisuješ, čo ješ, a sleduješ kalórie aj cieľ. A štatistiky ukážu hodnotu špajze aj koľko si ušetril alebo vyhodil.",
    },
    plans: ["domacnost"],
  },
  {
    img: "/onboarding/provozovna.png",
    title: { cs: "Kasa (pokladna)", sk: "Pokladňa" },
    text: {
      cs: "Prodáváš na kase a zboží se automaticky odečítá ze skladu. Nemusíš už nic ručně odepisovat — obchod i restaurace.",
      sk: "Predávaš na pokladni a tovar sa automaticky odčíta zo skladu. Už nemusíš nič ručne odpisovať — obchod aj reštaurácia.",
    },
    plans: ["provoz"],
  },
  {
    img: "/onboarding/inventura.png",
    title: { cs: "Denní porce & sklad", sk: "Denné porcie & sklad" },
    text: {
      cs: "Restaurace: ráno navaříš porce a kasa hlídá, kolik zbývá. Obchod: naskladníš zboží a rovnou prodáváš. Inventura pak jen porovná realitu.",
      sk: "Reštaurácia: ráno navaríš porcie a pokladňa stráži, koľko zostáva. Obchod: naskladníš tovar a rovno predávaš. Inventúra potom len porovná realitu.",
    },
    plans: ["provoz"],
  },
  {
    img: "/onboarding/inventura.png",
    title: { cs: "Účetnictví & tržby", sk: "Účtovníctvo & tržby" },
    text: {
      cs: "Denní uzávěrka, tržby hotově i kartou, zisk, marže a DPH. Export pro účetní v PDF nebo Excelu — za den, měsíc i celý rok.",
      sk: "Denná uzávierka, tržby hotovo aj kartou, zisk, marža a DPH. Export pre účtovníka v PDF alebo Exceli — za deň, mesiac aj celý rok.",
    },
    plans: ["provoz"],
  },
];

// ── Feature řádky pro každý plán ─────────────────────────────────────────────
const DOMACNOST_FEATURES: { icon: React.ReactNode; text: L10n }[] = [
  { icon: <ScanLine size={14} />, text: { cs: "Spižírna & skenování EAN", sk: "Špajza & skenovanie EAN" } },
  { icon: <BookOpen size={14} />, text: { cs: "Recepty s postupem vaření", sk: "Recepty s postupom varenia" } },
  { icon: <ShoppingCart size={14} />, text: { cs: "Nákupní seznam s hlasem", sk: "Nákupný zoznam hlasom" } },
  { icon: <RefreshCw size={14} />, text: { cs: "Opakované nákupy & připomínky", sk: "Opakované nákupy & pripomienky" } },
  { icon: <Sparkles size={14} />, text: { cs: "Gamifikace & streak", sk: "Gamifikácia & streak" } },
];

const PROVOZ_FEATURES: { icon: React.ReactNode; text: L10n }[] = [
  { icon: <ShoppingCart size={14} />, text: { cs: "Kasa — prodej odečítá sklad", sk: "Pokladňa — predaj odčíta sklad" } },
  { icon: <FileText size={14} />, text: { cs: "Účetnictví: tržby, zisk, DPH", sk: "Účtovníctvo: tržby, zisk, DPH" } },
  { icon: <Package size={14} />, text: { cs: "Sklad, inventura, denní porce", sk: "Sklad, inventúra, denné porcie" } },
  { icon: <ScanLine size={14} />, text: { cs: "Skenování EAN & čárové kódy", sk: "Skenovanie EAN & čiarové kódy" } },
  { icon: <Truck size={14} />, text: { cs: "Dodavatelé & export PDF/Excel", sk: "Dodávatelia & export PDF/Excel" } },
];

// ── Pomocné chipy ─────────────────────────────────────────────────────────────
function PlanChips({ plans, t }: { plans: Plan[]; t: (k: "plan.domacnost" | "plan.provoz") => string }) {
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
            {t(chip.labelKey)}
          </span>
        );
      })}
    </div>
  );
}

// ── Hlavní komponenta ─────────────────────────────────────────────────────────
export function ModeSelect({ onDone }: { onDone: () => void }) {
  const setMode = useModeStore((s) => s.setMode);
  const locale: Locale = useLocaleStore((s) => s.locale) ?? "cs";
  const t = useT();
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
        <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>{t("tab.spizirna")}</span>
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
          <div key={slide} className="animate-fade-in" style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, paddingBottom: 8 }}>
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
              {current.title[locale]}
            </h1>
            <p style={{
              fontSize: 14, color: "var(--text-secondary)",
              textAlign: "center", lineHeight: 1.6,
              maxWidth: 300, margin: 0,
            }}>
              {current.text[locale]}
            </p>

            <PlanChips plans={current.plans} t={t} />
          </div>
        )}

        {/* ── VÝBĚR PLÁNU ── */}
        {isChoosing && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflowY: "auto", paddingBottom: 16 }}>
            <div style={{ textAlign: "center", padding: "16px 0 14px" }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 3px" }}>{t("onb.choosePlanTitle")}</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{t("onb.freeTrial")}</p>
            </div>

            {/* Dvě karty vedle sebe — stejně vysoké, rostou dle obsahu (žádné ořezání). */}
            <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>

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
                <img
                  src="/onboarding/domacnost.png"
                  alt=""
                  width={44}
                  height={44}
                  draggable={false}
                  style={{ borderRadius: 12, marginBottom: 8 }}
                />
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px" }}>{t("plan.domacnost")}</p>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 8px" }}>{t("onb.forFamilies")}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: "var(--green-primary)", margin: "0 0 1px", lineHeight: 1 }}>
                  {t("onb.free")}<span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)" }}> {t("onb.domFreeLimit")}</span>
                </p>
                <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 1px" }}>{t("onb.domPaid")}</p>
                <p style={{ fontSize: 9, fontWeight: 500, color: "var(--text-tertiary)", margin: "0 0 8px", lineHeight: 1.3 }}>{t("onb.domYearly")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                  {DOMACNOST_FEATURES.map(f => (
                    <div key={f.text.cs} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <div style={{
                        width: 15, height: 15, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: "var(--green-light)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--green-primary)",
                      }}>
                        <Check size={9} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.35 }}>{f.text[locale]}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 10, padding: "8px 0", borderRadius: 12,
                  background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
                  textAlign: "center",
                  fontSize: 12, fontWeight: 700, color: "white",
                }}>
                  {t("onb.select")}
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
                  <img
                    src="/onboarding/provozovna.png"
                    alt=""
                    width={44}
                    height={44}
                    draggable={false}
                    style={{ borderRadius: 12 }}
                  />
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white", background: "#E8862E", padding: "2px 7px", borderRadius: 99, letterSpacing: "0.04em" }}>
                    {t("onb.forBusiness")}
                  </span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px" }}>{t("plan.provoz")}</p>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 8px" }}>{t("onb.restaurants")}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#E8862E", margin: "0 0 1px", lineHeight: 1 }}>
                  {t("onb.provozPrice")}<span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)" }}>{t("onb.provozPriceMonth")}</span>
                </p>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--green-primary)", margin: "0 0 1px" }}>{t("onb.provozTrial")}</p>
                <p style={{ fontSize: 9, fontWeight: 500, color: "var(--text-tertiary)", margin: "0 0 8px", lineHeight: 1.3 }}>{t("onb.provozYearly")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                  {PROVOZ_FEATURES.map(f => (
                    <div key={f.text.cs} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <div style={{
                        width: 15, height: 15, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: "#FDEBD7",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#E8862E",
                      }}>
                        <Check size={9} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.35 }}>{f.text[locale]}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 10, padding: "8px 0", borderRadius: 12,
                  background: "linear-gradient(135deg, #F7B267 0%, #E8862E 100%)",
                  textAlign: "center",
                  fontSize: 12, fontWeight: 700, color: "white",
                }}>
                  {t("onb.select")}
                </div>
              </button>
            </div>

            <p style={{ fontSize: 10, color: "var(--text-tertiary)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
              {t("onb.planNote")}
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
              {slide === SLIDES.length - 1 ? t("onb.choosePlan") : t("onb.next")}
            </button>
            <button
              onClick={() => setSlide(SLIDES.length)}
              style={{ color: "var(--text-tertiary)", fontSize: 13, fontWeight: 500, padding: "6px 0" }}
            >
              {t("onb.skipToPlan")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
