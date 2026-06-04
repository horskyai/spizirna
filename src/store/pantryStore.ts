import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PantryItem, ProductInfo, StorageLocation } from "@/types";
import { addDays } from "@/lib/dateUtils";

interface PantryStore {
  items: PantryItem[];
  addItem: (product: ProductInfo, quantity: number, location: StorageLocation, price?: number, store?: string) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, changes: Partial<PantryItem>) => void;
  consumeItem: (id: string, amount: number) => void;
  getExpiringItems: (days: number) => PantryItem[];
  getItemsByLocation: (location: StorageLocation) => PantryItem[];
}

export const usePantryStore = create<PantryStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity, location, price, store) => {
        const item: PantryItem = {
          id: crypto.randomUUID(),
          product,
          quantity,
          unit: product.unit,
          purchased_at: new Date().toISOString(),
          expires_at: product.typical_expiry_days
            ? addDays(new Date(), product.typical_expiry_days).toISOString()
            : undefined,
          location,
          price_paid: price,
          store,
        };
        set((s) => ({ items: [...s.items, item] }));
      },

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      updateItem: (id, changes) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...changes } : i)),
        })),

      consumeItem: (id, amount) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        const remaining = item.quantity - amount;
        if (remaining <= 0) {
          set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
        } else {
          set((s) => ({
            items: s.items.map((i) =>
              i.id === id ? { ...i, quantity: remaining } : i
            ),
          }));
        }
      },

      getExpiringItems: (days) => {
        const cutoff = addDays(new Date(), days);
        return get().items.filter((i) => {
          if (!i.expires_at) return false;
          return new Date(i.expires_at) <= cutoff;
        });
      },

      getItemsByLocation: (location) =>
        get().items.filter((i) => i.location === location),
    }),
    { name: "pantry-store" }
  )
);
