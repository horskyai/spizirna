"use client";

import { useState, useMemo } from "react";
import { useUIStore } from "@/store/uiStore";
import { usePantryStore } from "@/store/pantryStore";
import { useAuthStore } from "@/store/authStore";
import { Plus, Bell, AlertTriangle, UtensilsCrossed, LogOut, User, ScanLine, PenLine } from "lucide-react";
import { AddProductManual } from "@/components/AddProductManual";
import { AddRecipeModal } from "@/components/AddRecipeModal";
import { daysUntil } from "@/lib/dateUtils";

const TITLES: Record<string, string> = {
  spizirna: "Spižírna",
  jidlo: "Jídlo",
  skenovat: "Skenovat",
  recepty: "Recepty",
  nakup: "Nákupní seznam",
  opakujici: "Zásoby & připomínky",
};

export function AppHeader() {
  const { activeTab, setTab } = useUIStore();
  const { profile, signOut } = useAuthStore();
  const pantryItems = usePantryStore((s) => s.items);
  const expiringItems = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 3);
    return pantryItems.filter((i) => i.expires_at && new Date(i.expires_at) <= cutoff);
  }, [pantryItems]);
  const expiringCount = expiringItems.length;
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [showExpiry, setShowExpiry] = useState(false);
  const title = TITLES[activeTab] ?? "Spižírna";

  if (activeTab === "skenovat") return null;

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
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Dobrý den, {profile?.display_name ?? "uživateli"} 👋</p>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>Spižírna</h1>
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
              <button
                onClick={() => setTab("jidlo")}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}
                title="Potravinový deník"
              >
                <UtensilsCrossed size={18} style={{ color: "var(--text-tertiary)" }} />
              </button>
              <button
                onClick={signOut}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}
                title="Odhlásit se"
              >
                <LogOut size={18} style={{ color: "var(--text-tertiary)" }} />
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
          </div>
        </header>
      )}

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
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Naskenovat EAN kód</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Automaticky načte info z databáze</p>
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
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Přidat ručně</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Zadejte název, výživové hodnoty a cenu</p>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowAddMenu(false)}
              className="card w-full py-4 font-semibold text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Zrušit
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
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} style={{ color: "#B85C00" }} />
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Brzy vyprší</h3>
              </div>
              <div className="space-y-2">
                {expiringItems.map((item) => {
                  const days = daysUntil(item.expires_at!);
                  const urgent = days <= 1;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl px-4 py-3"
                      style={{ background: urgent ? "#FEF3E2" : "white" }}
                    >
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {item.product.product_name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {item.quantity}× · {item.location}
                        </p>
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{
                          background: urgent ? "#D95757" : "#E8B84B",
                          color: "white",
                        }}
                      >
                        {days < 0 ? "Prošlé!" : days === 0 ? "Dnes" : days === 1 ? "Zítra" : `Za ${days} dní`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
