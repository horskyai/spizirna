import { fetchProductByEAN } from "@/lib/openFoodFacts";
import { useProductCatalogStore } from "@/store/productCatalogStore";
import { ProductInfo } from "@/types";

// Vyhledání produktu podle EAN: nejdřív lokální katalog (ručně přidané
// produkty + dřívější nálezy), teprve pak Open Food Facts. Úspěšné nálezy
// se cachují, takže opakované skenování funguje okamžitě a offline.
export async function lookupProductByEAN(ean: string): Promise<ProductInfo | null> {
  const catalog = useProductCatalogStore.getState();
  const local = catalog.getProduct(ean);
  if (local) return local;
  const product = await fetchProductByEAN(ean);
  if (product) catalog.saveProduct(product);
  return product;
}
