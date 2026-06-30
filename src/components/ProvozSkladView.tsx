"use client";

import { useState, useMemo } from "react";
import { Search, X, AlertTriangle, Package } from "lucide-react";
import { useProvozStore, INVENTURA_KATEGORIE } from "@/store/provozStore";
import { useUIStore } from "@/store/uiStore";
import { TodaySummary } from "@/components/TodaySummary";
import { ProgressBadge } from "@/components/ProgressBadge";
import { useT } from "@/lib/i18n";

// Přehled skladu provozovny v tabu "Spižírna" — rychlý seznam položek skladu
// (název, jednotka, kategorie, zda je pod minimem). Detailní inventura je v tabu Provoz.
export function ProvozSkladView() {
  const t = useT();
  const { polozky, getPolozkyCritical } = useProvozStore();
  const { setTab } = useUIStore();
  const [search, setSearch] = useState("");

  // ID položek pod minimem (poslední zaznamenaný stav <= minZasoba)
  const criticalIds = useMemo(
    () => new Set(getPolozkyCritical().map((p) => p.id)),
    [getPolozkyCritical]
  );

  const filtered = search.trim()
    ? polozky.filter((p) => p.nazev.toLowerCase().includes(search.trim().toLowerCase()))
    : polozky;

  const katEmoji = (id: string) => INVENTURA_KATEGORIE.find((k) => k.id === id)?.emoji ?? "📦";

  // Prázdný sklad
  if (polozky.length === 0) {
    return (
      <div className="relative flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Package size={38} strokeWidth={1.4} style={{ color: "var(--green-primary)" }} />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{t("provozsklad.emptyTitle")}</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>{t("provozsklad.emptySubtitle")}</p>
        </div>
        <button className="btn-primary" style={{ width: "100%", maxWidth: 280 }} onClick={() => setTab("provoz")}>
          {t("provozsklad.goToProvoz")}
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="px-5 pt-0 pb-4">
        {/* Dnešní přehled — pod minimem, k nákupu */}
        <TodaySummary />

        {/* Úroveň / odznaky (gamifikace běží i v provozu) */}
        <ProgressBadge />

        {/* Hledání */}
        <div className="flex items-center gap-2.5 mb-4" style={{ background: "white", borderRadius: 16, padding: "12px 14px", boxShadow: "var(--shadow)" }}>
          <Search size={17} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("provozsklad.searchPlaceholder")}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: "100%", color: "var(--text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ flexShrink: 0, display: "flex" }}>
              <X size={15} style={{ color: "var(--text-tertiary)" }} />
            </button>
          )}
        </div>

        {/* Počet + odkaz do inventury */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("provozsklad.count").replace("{n}", String(polozky.length))}
          </span>
          <button onClick={() => setTab("provoz")} className="text-sm font-semibold" style={{ color: "var(--green-dark)" }}>
            {t("provozsklad.openInventory")} →
          </button>
        </div>

        {/* Seznam položek */}
        <div className="flex flex-col gap-2">
          {filtered.map((p) => {
            const critical = criticalIds.has(p.id);
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: "white", boxShadow: "var(--shadow)", border: critical ? "1.5px solid #F59E42" : "1.5px solid transparent" }}
              >
                {p.fotoUrl ? (
                  <img src={p.fotoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <span style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: "var(--green-light)" }}>{katEmoji(p.kategorie)}</span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nazev}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {t("provozsklad.minStock").replace("{n}", String(p.minZasoba)).replace("{unit}", p.jednotka)}
                    {p.cenaJednotka ? ` · ${p.cenaJednotka} Kč/${p.jednotka}` : ""}
                  </p>
                </div>
                {critical && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0" style={{ background: "#FEF3E2", color: "#B85C00" }}>
                    <AlertTriangle size={11} /> {t("provozsklad.belowMin")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
