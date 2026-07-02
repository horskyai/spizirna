// Export osobních dat domácnosti (GDPR — právo na přenositelnost).
// Dvě podoby:
//   • JSON — kompletní strojově čitelná záloha všeho (spižírna, nákup, deník, gamifikace).
//   • CSV  — přehledná spižírna do Excelu/tabulek.
// Data se čtou přímo z localStorage (persist klíče zustandu), aby export nezávisel
// na tom, které storey jsou právě načtené v paměti.

import type { PantryItem, FoodLogEntry } from "@/types";
import type { ShoppingItem } from "@/store/shoppingStore";

// Bezpečně přečti persistnutý zustand stav z localStorage.
// Persist ukládá tvar { state: {...}, version: n } — vracíme `state`.
function readPersisted<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed?.state ?? null) as T | null;
  } catch {
    return null;
  }
}

// Stáhne obsah jako soubor (stejný vzor jako provozní export).
function download(filename: string, content: string, mime: string) {
  const blob = new Blob(["﻿" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Sběr všech dat domácnosti ─────────────────────────────────────────────
export interface HouseholdExport {
  exported_at: string;
  app: string;
  mode: "domacnost";
  pantry: PantryItem[];
  shopping: ShoppingItem[];
  foodLog: FoodLogEntry[];
  gamification: unknown;
}

export function collectHouseholdData(): HouseholdExport {
  const pantry = readPersisted<{ items: PantryItem[] }>("pantry-store-domacnost");
  const shopping = readPersisted<{ domacnostItems: ShoppingItem[] }>("shopping-store");
  const foodLog = readPersisted<{ entries: FoodLogEntry[] }>("food-log-store-domacnost");
  const gamification = readPersisted<unknown>("gamification-store-domacnost");

  return {
    exported_at: new Date().toISOString(),
    app: "Spizirna",
    mode: "domacnost",
    pantry: pantry?.items ?? [],
    shopping: shopping?.domacnostItems ?? [],
    foodLog: foodLog?.entries ?? [],
    gamification: gamification ?? {},
  };
}

// ── JSON export (kompletní záloha) ─────────────────────────────────────────
export function exportHouseholdJSON() {
  const data = collectHouseholdData();
  download(`spizirna-data-${today()}.json`, JSON.stringify(data, null, 2), "application/json;charset=utf-8;");
}

// ── CSV export spižírny (přehled do Excelu) ────────────────────────────────
// Lokalizované hlavičky předává volající (aby modul nezávisel na i18n hooku).
export interface PantryCsvLabels {
  name: string;
  brand: string;
  quantity: string;
  unit: string;
  location: string;
  purchased: string;
  expires: string;
  price: string;
  store: string;
}

export function exportPantryCSV(labels: PantryCsvLabels) {
  const { pantry } = collectHouseholdData();
  const header = [
    labels.name, labels.brand, labels.quantity, labels.unit,
    labels.location, labels.purchased, labels.expires, labels.price, labels.store,
  ];
  const rows = [header];
  for (const it of pantry) {
    rows.push([
      it.product?.product_name ?? "",
      it.product?.brand ?? "",
      String(it.quantity ?? ""),
      it.unit ?? "",
      it.location ?? "",
      it.purchased_at ? it.purchased_at.slice(0, 10) : "",
      it.expires_at ? it.expires_at.slice(0, 10) : "",
      it.price_paid != null ? String(it.price_paid) : "",
      it.store ?? "",
    ]);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  download(`spizirna-${today()}.csv`, csv, "text/csv;charset=utf-8;");
}
