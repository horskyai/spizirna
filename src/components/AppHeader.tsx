"use client";

import { useState, useMemo } from "react";
import { useUIStore } from "@/store/uiStore";
import { usePantryStore } from "@/store/pantryStore";
import { useModeStore } from "@/store/modeStore";
import { useAuthStore } from "@/store/authStore";
import { useBusinessStore } from "@/store/businessStore";
import { useRecurringStore } from "@/store/recurringStore";
import { Plus, Bell, AlertTriangle, ScanLine, PenLine, Home, Briefcase, Settings, HelpCircle, ChefHat, RefreshCw, Check } from "lucide-react";
import { AddProductManual } from "@/components/AddProductManual";
import { AddRecipeModal } from "@/components/AddRecipeModal";
import { ScreenGuide, useScreenGuide } from "@/components/ScreenGuide";
import { daysUntil } from "@/lib/dateUtils";
import { useT } from "@/lib/i18n";

// Příručka pro každé okno: id (localStorage flag), titulek, intro a kroky.
// Skener má vlastní nápovědu, proto tu není.
const GUIDES: Record<string, { id: string; title: string; intro: string; steps: string[] }> = {
  spizirna: { id: "pantry", title: "guide.pantry.title", intro: "guide.pantry.intro", steps: ["guide.pantry.s1", "guide.pantry.s2", "guide.pantry.s3"] },
  // V provozu tab Spižírna ukazuje sklad → vlastní příručka o skladu.
  spizirna_provoz: { id: "sklad", title: "guide.sklad.title", intro: "guide.sklad.intro", steps: ["guide.sklad.s1", "guide.sklad.s2", "guide.sklad.s3"] },
  recepty: { id: "recipes", title: "guide.recipes.title", intro: "guide.recipes.intro", steps: ["guide.recipes.s1", "guide.recipes.s2", "guide.recipes.s3"] },
  nakup: { id: "shopping", title: "guide.shopping.title", intro: "guide.shopping.intro", steps: ["guide.shopping.s1", "guide.shopping.s2", "guide.shopping.s3"] },
  opakujici: { id: "recurring", title: "guide.recurring.title", intro: "guide.recurring.intro", steps: ["guide.recurring.s1", "guide.recurring.s2"] },
  // id "provoz2" (ne "provoz") → průvodce se po velké aktualizaci ukáže znovu
  // i těm, kdo viděli starou verzi (dozví se o Kase, Účetnictví, porcích).
  provoz: { id: "provoz2", title: "guide.provoz.title", intro: "guide.provoz.intro", steps: ["guide.provoz.s1", "guide.provoz.s2", "guide.provoz.s3", "guide.provoz.s4", "guide.provoz.s5"] },
};

const TITLES: Record<string, string> = {
  spizirna: "header.title.spizirna",
  jidlo: "header.title.jidlo",
  skenovat: "header.title.skenovat",
  recepty: "header.title.recepty",
  nakup: "header.title.nakup",
  opakujici: "header.title.opakujici",
  provoz: "header.title.provoz",
};

// Vybere pozdrav podle denní doby: ráno (5–11), odpoledne (12–17), večer (jinak).
function greetingKey(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "header.greetingMorning";
  if (h >= 12 && h < 18) return "header.greetingAfternoon";
  return "header.greetingEvening";
}

export function AppHeader({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const t = useT();
  const { activeTab, setTab } = useUIStore();
  const { mode } = useModeStore();
  // Oslovení: v provozu název provozovny, v domácnosti křestní jméno.
  const profile = useAuthStore((s) => s.profile);
  const businessName = useBusinessStore((s) => s.name);
  const firstName =
    mode === "provoz"
      ? businessName.trim()
      : profile?.display_name?.trim().split(/\s+/)[0] || "";
  const pantryItems = usePantryStore((s) => s.items);
  const expiringItems = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 3);
    return pantryItems.filter((i) => i.expires_at && new Date(i.expires_at) <= cutoff);
  }, [pantryItems]);
  // Upozornění na expiraci respektuje přepínač v nastavení
  const expiryNotifOn = typeof window === "undefined" || localStorage.getItem("expiry-notifications") !== "off";
  const expiringCount = expiryNotifOn ? expiringItems.length : 0;
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [showExpiry, setShowExpiry] = useState(false);
  const [remindedIds, setRemindedIds] = useState<string[]>([]);
  const addRecurring = useRecurringStore((s) => s.addItem);
  const title = t(TITLES[activeTab] ?? "header.title.spizirna");

  // „Co uvařit" z expirujících potravin → přepnout na Recepty.
  const handleCookFromExpiring = () => {
    setShowExpiry(false);
    setTab("recepty");
  };

  // Přidá expirující potravinu do připomínek (výchozí interval 7 dní)
  // a přepne na záložku Opakování, kde si uživatel interval upraví.
  const handleRemind = (name: string, quantity: number, unit: string) => {
    addRecurring({
      name,
      quantity: quantity || 1,
      unit: unit || "ks",
      interval_days: 7,
      last_purchased: new Date().toISOString(),
    });
    setRemindedIds((prev) => [...prev, name]);
  };

  // Příručka aktuálního okna — poprvé se ukáže sama, pak přes "?".
  // V provozu má tab Spižírna příručku o skladu (ne o domácí spižírně).
  const guideKey = activeTab === "spizirna" && mode === "provoz" ? "spizirna_provoz" : activeTab;
  const guideCfg = GUIDES[guideKey];
  const guide = useScreenGuide(guideCfg?.id ?? "none");
  const hasGuide = !!guideCfg;

  if (activeTab === "skenovat") return null;

  const HelpButton = hasGuide ? (
    <button
      onClick={guide.show}
      className="w-10 h-10 rounded-full flex items-center justify-center"
      style={{ background: "white", border: "1px solid var(--border)" }}
      aria-label={t(guideCfg.title)}
    >
      <HelpCircle size={18} style={{ color: "var(--text-secondary)" }} />
    </button>
  ) : null;

  const guideSheet = hasGuide ? (
    <ScreenGuide guide={guide} titleKey={guideCfg.title} introKey={guideCfg.intro} steps={guideCfg.steps} />
  ) : null;

  const isPantry = activeTab === "spizirna";

  return (
    <>
      {isPantry ? (
        /* ── HERO HEADER for pantry ── */
        <header
          className="flex-shrink-0 px-5 pb-4"
          style={{ paddingTop: "max(20px, env(safe-area-inset-top, 20px))" }}
        >
          {/* Top row: greeting + actions */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{t(greetingKey())}{firstName ? `, ${firstName}` : ""} 👋</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>{t("header.myPantry")}</h1>
                <span
                  title={mode === "provoz" ? t("plan.provoz") : t("plan.domacnost")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 26, height: 26, borderRadius: 99,
                    background: mode === "provoz" ? "#FDEBD7" : "var(--green-light)",
                    color: mode === "provoz" ? "#B85C00" : "var(--green-dark)",
                    border: `1px solid ${mode === "provoz" ? "#F59E42" : "var(--green-primary)"}`,
                  }}
                >
                  {mode === "provoz" ? <Briefcase size={13} /> : <Home size={13} />}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {expiringCount > 0 && (
                <button
                  onClick={() => setShowExpiry(true)}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "#FFF3E0", border: "1px solid #FFE0B2" }}
                >
                  <Bell size={17} style={{ color: "#F57C00" }} />
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ background: "var(--red)", fontSize: 9 }}
                  >
                    {expiringCount}
                  </span>
                </button>
              )}
              {HelpButton}
              <button
                onClick={onOpenSettings}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "white", border: "1px solid var(--border)" }}
                aria-label="Nastavení"
              >
                <Settings size={18} style={{ color: "var(--text-secondary)" }} />
              </button>
              <button
                onClick={() => setShowAddMenu(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: "var(--green-primary)", boxShadow: "0 4px 14px rgba(76,175,130,0.4)" }}
              >
                <Plus size={19} color="white" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </header>
      ) : (
        /* ── PLAIN HEADER for other tabs ── */
        <header
          className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3"
          style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}
        >
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
          <div className="flex items-center gap-2">
            {activeTab === "recepty" && (
              <button
                onClick={() => setShowAddRecipe(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: "var(--green-primary)", boxShadow: "0 4px 14px rgba(76,175,130,0.4)" }}
              >
                <Plus size={19} color="white" strokeWidth={2.5} />
              </button>
            )}
            {HelpButton}
            <button
              onClick={onOpenSettings}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "white", border: "1px solid var(--border)" }}
              aria-label="Nastavení"
            >
              <Settings size={18} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        </header>
      )}

      {guideSheet}

      {/* Add menu sheet */}
      {showAddMenu && (
        <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 100 }}>
          <div className="sheet-overlay animate-fade-in" onClick={() => setShowAddMenu(false)} style={{ position: "absolute", inset: 0 }} />
          <div className="relative animate-slide-up px-4 pb-8 space-y-2" style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))" }}>
            <div className="card p-1 overflow-hidden">
              <button
                onClick={() => { setShowAddMenu(false); setTab("skenovat"); }}
                className="w-full flex items-center gap-3 px-4 py-4 text-left transition-all"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--green-light)" }}>
                  <ScanLine size={18} style={{ color: "var(--green-primary)" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{t("header.scanEan")}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{t("header.scanEanDesc")}</p>
                </div>
              </button>
              <button
                onClick={() => { setShowAddMenu(false); setShowManual(true); }}
                className="w-full flex items-center gap-3 px-4 py-4 text-left transition-all"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--green-light)" }}>
                  <PenLine size={18} style={{ color: "var(--green-primary)" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{t("header.addManual")}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{t("header.addManualDesc")}</p>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowAddMenu(false)}
              className="card w-full py-4 font-semibold text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Manual add modal */}
      {showManual && <AddProductManual onClose={() => setShowManual(false)} />}

      {/* Add recipe modal */}
      {showAddRecipe && <AddRecipeModal onClose={() => setShowAddRecipe(false)} />}

      {/* Expiry panel */}
      {showExpiry && (
        <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 100 }}>
          <div className="sheet-overlay animate-fade-in" onClick={() => setShowExpiry(false)} style={{ position: "absolute", inset: 0 }} />
          <div
            className="relative animate-slide-up rounded-t-3xl"
            style={{ background: "var(--bg-primary)", paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>
            <div className="px-5 pt-2 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={18} style={{ color: "#B85C00" }} />
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("header.expiringSoon")}</h3>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                {firstName
                  ? t("header.expiryGreetingName").replace("{name}", firstName)
                  : t("header.expiryGreeting")}
              </p>
              <div className="space-y-2">
                {expiringItems.map((item) => {
                  const days = daysUntil(item.expires_at!);
                  const urgent = days <= 1;
                  const reminded = remindedIds.includes(item.product.product_name);
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl px-4 py-3"
                      style={{ background: urgent ? "#FEF3E2" : "white" }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                            {item.product.product_name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {item.quantity}× · {t(`pantry.location.${item.location}`)}
                          </p>
                        </div>
                        <span
                          className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{
                            background: urgent ? "#D95757" : "#E8B84B",
                            color: "white",
                          }}
                        >
                          {days < 0 ? t("header.expired") : days === 0 ? t("header.today") : days === 1 ? t("header.tomorrow") : t("header.inDays").replace("{n}", String(days))}
                        </span>
                      </div>
                      {/* Akce pro tuto potravinu */}
                      <div className="flex gap-2 mt-2.5">
                        <button
                          onClick={() => handleRemind(item.product.product_name, item.quantity, item.unit)}
                          disabled={reminded}
                          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: reminded ? "var(--green-light)" : "white",
                            color: reminded ? "var(--green-dark)" : "var(--text-secondary)",
                            border: `1.5px solid ${reminded ? "var(--green-primary)" : "var(--border)"}`,
                          }}
                        >
                          {reminded
                            ? <><Check size={13} /> {t("header.expiry.reminded")}</>
                            : <><RefreshCw size={13} /> {t("header.expiry.remind")}</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hromadné akce pod seznamem */}
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={handleCookFromExpiring}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-sm"
                  style={{ background: "var(--green-primary)", color: "white" }}
                >
                  <ChefHat size={17} /> {t("header.expiry.cook")}
                </button>
                {remindedIds.length > 0 && (
                  <button
                    onClick={() => { setShowExpiry(false); setTab("opakujici"); }}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-sm"
                    style={{ background: "white", color: "var(--green-dark)", border: "1.5px solid var(--green-primary)" }}
                  >
                    <RefreshCw size={16} /> {t("header.expiry.goToReminders")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
