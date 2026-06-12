import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProductInfo } from "@/types";

// Lokální katalog produktů podle EAN.
// Pamatuje si ručně přidané produkty i nálezy z Open Food Facts,
// takže opakované skenování stejného kódu funguje okamžitě a offline.
// Sdílený napříč režimy (domácnost i provoz) — bez mode přípony v klíči.

interface CatalogEntry {
  product: ProductInfo;
  saved_at: string;
}

interface ProductCatalogStore {
  entries: Record<string, CatalogEntry>;
  saveProduct: (product: ProductInfo) => void;
  getProduct: (ean: string) => ProductInfo | null;
  removeProduct: (ean: string) => void;
}

// Jen skutečné čárové kódy (8–14 číslic), ne interní "manual-..." identifikátory
function isRealEAN(ean: string): boolean {
  return /^\d{8,14}$/.test(ean);
}

export const useProductCatalogStore = create<ProductCatalogStore>()(
  persist(
    (set, get) => ({
      entries: {},

      saveProduct: (product) => {
        if (!product.ean_code || !isRealEAN(product.ean_code)) return;
        set((s) => ({
          entries: {
            ...s.entries,
            [product.ean_code]: { product, saved_at: new Date().toISOString() },
          },
        }));
      },

      getProduct: (ean) => get().entries[ean]?.product ?? null,

      removeProduct: (ean) =>
        set((s) => {
          const next = { ...s.entries };
          delete next[ean];
          return { entries: next };
        }),
    }),
    { name: "product-catalog" }
  )
);
