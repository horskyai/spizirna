"use client";

import { useMemo } from "react";
import { AlertTriangle, PackageMinus, ShoppingCart, RefreshCw, ChevronRight } from "lucide-react";
import { usePantryStore } from "@/store/pantryStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useRecurringStore } from "@/store/recurringStore";
import { useProvozStore } from "@/store/provozStore";
import { useModeStore } from "@/store/modeStore";
import { useUIStore } from "@/store/uiStore";
import { daysUntil } from "@/lib/dateUtils";
import { useT } from "@/lib/i18n";

// Položku považujeme za „dochází", když z ní zbývá 1 kus nebo méně.
const LOW_STOCK_THRESHOLD = 1;
// Co „brzy expiruje" — stejná hranice jako u zvonečku v hlavičce.
const EXPIRY_DAYS = 3;

type Row = {
  key: string;
  Icon: React.FC<{ size?: number; color?: string }>;
  tint: string;
  bg: string;
  label: string;
  detail: string;
  onClick: () => void;
};

// Vybere správný text podle počtu (1 vs. více) a doplní {n}.
function plural(t: (k: string) => string, n: number, oneKey: string, manyKey: string): string {
  return n === 1 ? t(oneKey) : t(manyKey).replace("{n}", String(n));
}

export function TodaySummary() {
  const t = useT();
  const mode = useModeStore((s) => s.mode);
  const { setTab } = useUIStore();

  // Stavy z obou režimů čteme vždy (hooks nesmí být podmíněné);
  // použijeme jen ty, které odpovídají aktuálnímu režimu.
  const items = usePantryStore((s) => s.items);
  const polozky = useProvozStore((s) => s.polozky);
  const criticalCount = useProvozStore((s) => s.getPolozkyCritical().length);
  const shoppingMode = mode === "provoz" ? "provoz" : "domacnost";
  const shoppingCount = useShoppingStore(
    (s) => s.getItems(shoppingMode).filter((i) => !i.checked).length
  );
  const dueCount = useRecurringStore((s) => s.getDueItems().length);

  const expiringCount = useMemo(
    () => items.filter((i) => i.expires_at && daysUntil(i.expires_at) <= EXPIRY_DAYS).length,
    [items]
  );
  const lowStockCount = useMemo(
    () => items.filter((i) => i.quantity <= LOW_STOCK_THRESHOLD).length,
    [items]
  );

  const rows: Row[] = [];

  if (mode === "provoz") {
    // ── Provozovna: sklad má min. zásobu, ne expiraci ani opakované nákupy ──
    if (criticalCount > 0) {
      rows.push({
        key: "below-min",
        Icon: AlertTriangle,
        tint: "#B85C00",
        bg: "#FFF3E0",
        label: t("provozsklad.belowMin"),
        detail: plural(t, criticalCount, "provozsklad.summary.belowMinOne", "provozsklad.summary.belowMinItems"),
        onClick: () => setTab("provoz"),
      });
    }
    if (shoppingCount > 0) {
      rows.push({
        key: "shopping",
        Icon: ShoppingCart,
        tint: "var(--green-dark)",
        bg: "var(--green-light)",
        label: t("pantry.summary.shopping"),
        detail: plural(t, shoppingCount, "pantry.summary.shoppingOne", "pantry.summary.shoppingItems"),
        onClick: () => setTab("nakup"),
      });
    }
    // Provozovna nemá v liště tab Opakující → proklik vede na Nákup.
    if (dueCount > 0) {
      rows.push({
        key: "recurring",
        Icon: RefreshCw,
        tint: "var(--green-dark)",
        bg: "var(--green-light)",
        label: t("pantry.summary.recurring"),
        detail: plural(t, dueCount, "pantry.summary.recurringOne", "pantry.summary.recurringItems"),
        onClick: () => setTab("nakup"),
      });
    }
  } else {
    // ── Domácnost: expirace, docházející kusy, nákup, opakované ──
    if (expiringCount > 0) {
      rows.push({
        key: "expiring",
        Icon: AlertTriangle,
        tint: "#B85C00",
        bg: "#FFF3E0",
        label: t("pantry.summary.expiring"),
        detail: plural(t, expiringCount, "pantry.summary.expiringOne", "pantry.summary.expiringItems"),
        onClick: () => setTab("spizirna"),
      });
    }
    if (lowStockCount > 0) {
      rows.push({
        key: "low",
        Icon: PackageMinus,
        tint: "#C0392B",
        bg: "#FDE8E8",
        label: t("pantry.summary.lowStock"),
        detail: plural(t, lowStockCount, "pantry.summary.lowStockOne", "pantry.summary.lowStockItems"),
        onClick: () => setTab("spizirna"),
      });
    }
    if (shoppingCount > 0) {
      rows.push({
        key: "shopping",
        Icon: ShoppingCart,
        tint: "var(--green-dark)",
        bg: "var(--green-light)",
        label: t("pantry.summary.shopping"),
        detail: plural(t, shoppingCount, "pantry.summary.shoppingOne", "pantry.summary.shoppingItems"),
        onClick: () => setTab("nakup"),
      });
    }
    if (dueCount > 0) {
      rows.push({
        key: "recurring",
        Icon: RefreshCw,
        tint: "var(--green-dark)",
        bg: "var(--green-light)",
        label: t("pantry.summary.recurring"),
        detail: plural(t, dueCount, "pantry.summary.recurringOne", "pantry.summary.recurringItems"),
        onClick: () => setTab("opakujici"),
      });
    }
  }

  // Prázdná spižírna/sklad má vlastní úvodní stav — přehled nemá co ukazovat.
  if ((mode === "provoz" ? polozky.length : items.length) === 0) return null;

  return (
    <div className="card overflow-hidden mb-4">
      <div className="px-5 pt-4 pb-2.5">
        <p className="text-xs font-bold uppercase" style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}>
          {t("pantry.summary.title")}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 pb-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {t("pantry.summary.allClear")}
        </p>
      ) : (
        <div className="pb-1.5">
          {rows.map((row, idx) => (
            <button
              key={row.key}
              onClick={row.onClick}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
              style={{ borderTop: idx === 0 ? "1px solid var(--border)" : "none" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: row.bg }}
              >
                <row.Icon size={17} color={row.tint} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{row.label}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{row.detail}</p>
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
