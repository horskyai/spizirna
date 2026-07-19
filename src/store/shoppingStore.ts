import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId } from "@/lib/uuid";

export type ShoppingMode = "domacnost" | "provoz";

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
  domacnostItems: ShoppingItem[];
  provozItems: ShoppingItem[];

  // Vždy pracuje s položkami daného módu
  addItem: (item: Omit<ShoppingItem, "id" | "checked">, mode: ShoppingMode) => void;
  addItems: (items: Omit<ShoppingItem, "id" | "checked">[], mode: ShoppingMode) => void;
  updateItem: (id: string, changes: Partial<Omit<ShoppingItem, "id">>, mode: ShoppingMode) => void;
  toggleItem: (id: string, mode: ShoppingMode) => void;
  removeItem: (id: string, mode: ShoppingMode) => void;
  removeChecked: (mode: ShoppingMode) => void;
  clearAll: (mode: ShoppingMode) => void;

  // Selector helper — vrátí položky pro daný mód
  getItems: (mode: ShoppingMode) => ShoppingItem[];
}

function itemsKey(mode: ShoppingMode): "domacnostItems" | "provozItems" {
  return mode === "domacnost" ? "domacnostItems" : "provozItems";
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set, get) => ({
      domacnostItems: [],
      provozItems: [],

      getItems: (mode) => get()[itemsKey(mode)],

      addItem: (item, mode) => {
        const key = itemsKey(mode);
        const existing = get()[key].find(
          (i) => i.name.toLowerCase() === item.name.toLowerCase() && !i.checked
        );
        if (existing) {
          set((s) => ({
            [key]: s[key].map((i) =>
              i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          }));
        } else {
          set((s) => ({
            [key]: [...s[key], { ...item, id: genId(), checked: false }],
          }));
        }
      },

      addItems: (items, mode) => {
        items.forEach((item) => get().addItem(item, mode));
      },

      updateItem: (id, changes, mode) => {
        const key = itemsKey(mode);
        set((s) => ({
          [key]: s[key].map((i) => (i.id === id ? { ...i, ...changes } : i)),
        }));
      },

      toggleItem: (id, mode) => {
        const key = itemsKey(mode);
        set((s) => ({
          [key]: s[key].map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
        }));
      },

      removeItem: (id, mode) => {
        const key = itemsKey(mode);
        set((s) => ({ [key]: s[key].filter((i) => i.id !== id) }));
      },

      removeChecked: (mode) => {
        const key = itemsKey(mode);
        set((s) => ({ [key]: s[key].filter((i) => !i.checked) }));
      },

      clearAll: (mode) => {
        set({ [itemsKey(mode)]: [] });
      },
    }),
    { name: "shopping-store" }
  )
);
