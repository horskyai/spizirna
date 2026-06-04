"use client";

import { useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { usePantryStore } from "@/store/pantryStore";
import { Plus, Bell, ScanLine, PenLine, X } from "lucide-react";
import { AddProductManual } from "@/components/AddProductManual";
import { AddRecipeModal } from "@/components/AddRecipeModal";

const TITLES: Record<string, string> = {
  spizirna: "Spižírna",
  jidlo: "Jídlo",
  skenovat: "Skenovat",
  recepty: "Recepty",
  nakup: "Nákupní seznam",
};

export function AppHeader() {
  const { activeTab, setTab } = useUIStore();
  const expiringCount = usePantryStore((s) => s.getExpiringItems(3).length);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const title = TITLES[activeTab] ?? "Spižírna";

  if (activeTab === "skenovat") return null;

  return (
    <>
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}
      >
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>

        <div className="flex items-center gap-2">
          {/* Expiry notification */}
          {expiringCount > 0 && activeTab === "spizirna" && (
            <button className="relative w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#FEF3E2" }}>
              <Bell size={16} style={{ color: "#B85C00" }} />
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center font-bold text-white"
                style={{ background: "#D95757", fontSize: 10 }}
              >
                {expiringCount}
              </span>
            </button>
          )}

          {/* Add button for pantry */}
          {activeTab === "spizirna" && (
            <button
              onClick={() => setShowAddMenu(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: "var(--green-primary)" }}
            >
              <Plus size={18} color="white" strokeWidth={2.5} />
            </button>
          )}

          {/* Add button for recipes */}
          {activeTab === "recepty" && (
            <button
              onClick={() => setShowAddRecipe(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: "var(--green-primary)" }}
            >
              <Plus size={18} color="white" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </header>

      {/* Add menu sheet */}
      {showAddMenu && (
        <div className="absolute inset-0 flex flex-col justify-end" style={{ zIndex: 60 }}>
          <div className="absolute inset-0 sheet-overlay" onClick={() => setShowAddMenu(false)} />
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
    </>
  );
}
