import { fetchProductByEAN } from "@/lib/openFoodFacts";
import { fetchFromCatalog, saveToCatalog } from "@/lib/catalogRemote";
import { useProductCatalogStore } from "@/store/productCatalogStore";
import { ProductInfo } from "@/types";

// Vyhledání produktu podle EAN v pořadí:
//   1. lokální katalog (okamžité, offline) — ručně přidané + dřívější nálezy
//   2. sdílený katalog na Supabase — co přidal kdokoliv z uživatelů
//   3. Open Food Facts — veřejná databáze
// Každý nález se uloží lokálně i sdíleně, takže příště je hned a vidí ho ostatní.
export async function lookupProductByEAN(ean: string): Promise<ProductInfo | null> {
  const local = useProductCatalogStore.getState();

  // 1. lokální katalog
  const cached = local.getProduct(ean);
  if (cached) return cached;

  // 2. sdílený katalog (komunitní databáze Spižírny)
  const shared = await fetchFromCatalog(ean);
  if (shared) {
    local.saveProduct(shared);
    return shared;
  }

  // 3. Open Food Facts — a nález rozšíříme do obou katalogů
  const product = await fetchProductByEAN(ean);
  if (product) {
    local.saveProduct(product);
    void saveToCatalog(product);
  }
  return product;
}

// Uloží ručně vytvořený produkt do lokálního i sdíleného katalogu.
export function rememberProduct(product: ProductInfo): void {
  useProductCatalogStore.getState().saveProduct(product);
  void saveToCatalog(product);
}
