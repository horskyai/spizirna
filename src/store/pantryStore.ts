import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PantryItem, ProductInfo, StorageLocation } from "@/types";
import { addDays } from "@/lib/dateUtils";
import { getCurrentMode } from "@/store/modeStore";

interface PantryStore {
  items: PantryItem[];
  customCategories: string[];
  addItem: (product: ProductInfo, quantity: number, location: StorageLocation, price?: number, store?: string, tags?: string[], customImageUrl?: string, expiresAt?: string) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, changes: Partial<PantryItem>) => void;
  consumeItem: (id: string, amount: number) => void;
  getExpiringItems: (days: number) => PantryItem[];
  getItemsByLocation: (location: StorageLocation) => PantryItem[];
  addCustomCategory: (cat: string) => void;
  removeCustomCategory: (cat: string) => void;
}

export const usePantryStore = create<PantryStore>()(
  persist(
    (set, get) => ({
      items: [],
      customCategories: [],

      addItem: (product, quantity, location, price, store, tags, customImageUrl, expiresAt) => {
        const item: PantryItem = {
          id: crypto.randomUUID(),
          product,
          quantity,
          unit: product.unit,
          purchased_at: new Date().toISOString(),
          expires_at: expiresAt
            ? new Date(expiresAt).toISOString()
            : product.typical_expiry_days
            ? addDays(new Date(), product.typical_expiry_days).toISOString()
            : undefined,
          location,
          price_paid: price,
          store,
          tags: tags?.length ? tags : undefined,
          custom_image_url: customImageUrl,
        };
        set((s) => ({ items: [...s.items, item] }));
      },

      addCustomCategory: (cat) =>
        set((s) => ({
          customCategories: s.customCategories.includes(cat)
            ? s.customCategories
            : [...s.customCategories, cat],
        })),

      removeCustomCategory: (cat) =>
        set((s) => ({
          customCategories: s.customCategories.filter((c) => c !== cat),
        })),

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
    { name: `pantry-store-${getCurrentMode()}` }
  )
);
