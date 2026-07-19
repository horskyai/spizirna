import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId } from "@/lib/uuid";
import { getCurrentMode } from "@/store/modeStore";

export interface RecurringItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  interval_days: number;
  last_purchased: string; // ISO date
  next_reminder: string;  // ISO date
  category?: string;
  store?: string;
  notes?: string;
}

export interface ConsumptionRecord {
  product_name: string;
  quantity: number;
  date: string;
}

interface RecurringStore {
  items: RecurringItem[];
  consumption: ConsumptionRecord[];
  addItem: (item: Omit<RecurringItem, "id" | "next_reminder">) => void;
  updateItem: (id: string, changes: Partial<RecurringItem>) => void;
  removeItem: (id: string) => void;
  markPurchased: (id: string) => void;
  getDueItems: () => RecurringItem[];
  getSoonItems: (days: number) => RecurringItem[];
  recordConsumption: (product_name: string, quantity: number) => void;
  predictDaysLeft: (product_name: string, currentQty: number) => number | null;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const useRecurringStore = create<RecurringStore>()(
  persist(
    (set, get) => ({
      items: [],
      consumption: [],

      addItem: (item) => {
        const next = addDays(new Date(item.last_purchased), item.interval_days);
        set((s) => ({
          items: [
            ...s.items,
            { ...item, id: genId(), next_reminder: next.toISOString() },
          ],
        }));
      },

      updateItem: (id, changes) =>
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            const updated = { ...i, ...changes };
            // přepočítat next_reminder pokud se změnil interval nebo last_purchased
            if (changes.interval_days || changes.last_purchased) {
              const next = addDays(new Date(updated.last_purchased), updated.interval_days);
              updated.next_reminder = next.toISOString();
            }
            return updated;
          }),
        })),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      markPurchased: (id) => {
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            const nowDate = new Date();
            const now = nowDate.toISOString();
            // AUTO-INTERVAL: skutečný odstup od minulého nákupu ladí interval, ať
            // se opakování samo přizpůsobí realitě (místo napořád fixního čísla).
            // Klouzavý průměr 70 % starý / 30 % nový, ať jeden výkyv nerozhodí.
            let interval = i.interval_days;
            const skutecnyOdstup = Math.round((nowDate.getTime() - new Date(i.last_purchased).getTime()) / 86_400_000);
            if (skutecnyOdstup >= 1 && skutecnyOdstup <= 120) {
              interval = Math.max(1, Math.round(i.interval_days * 0.7 + skutecnyOdstup * 0.3));
            }
            const next = addDays(nowDate, interval);
            return { ...i, interval_days: interval, last_purchased: now, next_reminder: next.toISOString() };
          }),
        }));
      },

      getDueItems: () => {
        const now = new Date();
        return get().items.filter((i) => new Date(i.next_reminder) <= now);
      },

      getSoonItems: (days) => {
        const cutoff = addDays(new Date(), days);
        const now = new Date();
        return get().items.filter((i) => {
          const d = new Date(i.next_reminder);
          return d > now && d <= cutoff;
        });
      },

      recordConsumption: (product_name, quantity) => {
        set((s) => ({
          consumption: [
            ...s.consumption.slice(-200), // max 200 záznamů
            { product_name, quantity, date: new Date().toISOString() },
          ],
        }));
      },

      predictDaysLeft: (product_name, currentQty) => {
        const records = get().consumption.filter(
          (c) => c.product_name.toLowerCase() === product_name.toLowerCase()
        );
        if (records.length < 2) return null;

        // průměrná denní spotřeba z posledních záznamů
        const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const first = new Date(sorted[0].date);
        const last = new Date(sorted[sorted.length - 1].date);
        const daysDiff = Math.max(1, (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
        const totalConsumed = records.reduce((sum, r) => sum + r.quantity, 0);
        const dailyRate = totalConsumed / daysDiff;

        if (dailyRate <= 0) return null;
        return Math.floor(currentQty / dailyRate);
      },
    }),
    { name: `recurring-store-${getCurrentMode()}` }
  )
);
