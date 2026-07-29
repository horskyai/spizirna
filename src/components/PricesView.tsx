"use client";

import { X, TrendingDown, Store, BarChart2 } from "lucide-react";
import { usePriceStore } from "@/store/priceStore";
import { formatDateShort } from "@/lib/dateUtils";
import { useT } from "@/lib/i18n";

// Bottom-sheet obálka kolem PricesView — otevírá se z Nastavení (viz
// SettingsModal.tsx), appka pro ni nemá vlastní tab.
export function PricesModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 210, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <div
        className="relative animate-slide-up"
        style={{
          background: "var(--bg-primary)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "90dvh",
          display: "flex",
          flexDirection: "column",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--border)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{t("prices.title")}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <PricesView />
        </div>
      </div>
    </div>
  );
}

export function PricesView() {
  const t = useT();
  const { records } = usePriceStore();

  // Group by EAN
  const grouped = records.reduce<Record<string, typeof records>>((acc, r) => {
    acc[r.ean_code] = acc[r.ean_code] || [];
    acc[r.ean_code].push(r);
    return acc;
  }, {});

  const eans = Object.keys(grouped);

  if (eans.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
          <BarChart2 size={32} strokeWidth={1.5} style={{ color: "var(--green-primary)" }} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>{t("prices.emptyTitle")}</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("prices.emptyDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 pt-2 pb-24 space-y-4">
        {eans.map((ean) => {
          const history = grouped[ean].sort((a, b) => b.date.localeCompare(a.date));
          const latest = history[0];
          const best = history.reduce((b, r) => r.price < b.price ? r : b, history[0]);
          const savings = latest.price - best.price;

          return (
            <div key={ean} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{t("prices.eanLabel")} {ean}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {(history.length > 1 ? t("prices.recordsMany") : t("prices.recordsOne")).replace("{n}", String(history.length))}
                  </p>
                </div>
                {savings > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "#E8F0E4" }}>
                    <TrendingDown size={12} style={{ color: "var(--green-dark)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--green-dark)" }}>
                      {t("prices.save").replace("{n}", savings.toFixed(0))}
                    </span>
                  </div>
                )}
              </div>

              {/* Price history */}
              <div className="space-y-2">
                {history.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: r === best ? "var(--green-light)" : "var(--bg-primary)" }}>
                    <Store size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                    <span className="text-sm flex-1 min-w-0 truncate font-medium" style={{ color: "var(--text-primary)" }}>{r.store}</span>
                    <span className="text-xs" style={{ color: "var(--text-tertiary)", flexShrink: 0, whiteSpace: "nowrap" }}>{formatDateShort(r.date)}</span>
                    <span className="text-sm font-bold" style={{ color: r === best ? "var(--green-dark)" : "var(--text-primary)", flexShrink: 0, whiteSpace: "nowrap" }}>
                      {r.price} CZK
                      {r === best && <span className="text-xs font-normal ml-1" style={{ color: "var(--green-dark)" }}>{t("prices.cheapest")}</span>}
                    </span>
                  </div>
                ))}
              </div>

              {best.price_per_kg && (
                <p className="text-xs mt-3 pt-3" style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  {t("prices.bestPriceLabel")} <b>{best.price_per_kg.toFixed(0)} CZK/kg</b> {t("prices.bestPriceIn")} {best.store}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
