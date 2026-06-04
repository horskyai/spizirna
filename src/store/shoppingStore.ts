import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  recipe_id?: string;
  recipe_name?: string;
  ean_code?: string;
  category?: string;
}

interface ShoppingStore {
  items: ShoppingItem[];
  addItem: (item: Omit<ShoppingItem, "id" | "checked">) => void;
  addItems: (items: Omit<ShoppingItem, "id" | "checked">[]) => void;
  toggleItem: (id: string) => void;
  removeItem: (id: string) => void;
  removeChecked: () => void;
  clearAll: () => void;
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        // Merge if same name already exists
        const existing = get().items.find(
          (i) => i.name.toLowerCase() === item.name.toLowerCase() && !i.checked
        );
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          }));
        } else {
          set((s) => ({
            items: [...s.items, { ...item, id: crypto.randomUUID(), checked: false }],
          }));
        }
      },

      addItems: (items) => {
        items.forEach((item) => get().addItem(item));
      },

      toggleItem: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
        })),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      removeChecked: () =>
        set((s) => ({ items: s.items.filter((i) => !i.checked) })),

      clearAll: () => set({ items: [] }),
    }),
    { name: "shopping-store" }
  )
);
