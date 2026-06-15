import { supabase } from "@/lib/supabase";
import { ProductInfo } from "@/types";

// Sdílený katalog produktů na Supabase (komunitní databáze Spižírny).
// Čtení i zápis je bezpečné selhat — když Supabase není dostupný nebo
// chybí konfigurace, voláním se jen vrátí null / false a appka pokračuje
// s lokálním katalogem a Open Food Facts.

function isRealEAN(ean: string): boolean {
  return /^\d{8,14}$/.test(ean);
}

function rowToProduct(row: any): ProductInfo {
  return {
    ean_code: row.ean_code,
    product_name: row.product_name,
    brand: row.brand ?? "",
    category: row.category ?? "",
    subcategory: row.subcategory ?? "",
    image_url: row.image_url ?? "",
    weight_g: row.weight_g ?? undefined,
    volume_ml: row.volume_ml ?? undefined,
    pieces_count: row.pieces_count ?? undefined,
    unit: (row.unit ?? "g") as "g" | "ml" | "ks",
    calories_kcal: row.calories_kcal ?? undefined,
    protein_g: row.protein_g ?? undefined,
    fat_g: row.fat_g ?? undefined,
    saturated_fat_g: row.saturated_fat_g ?? undefined,
    carbs_g: row.carbs_g ?? undefined,
    sugar_g: row.sugar_g ?? undefined,
    fiber_g: row.fiber_g ?? undefined,
    salt_g: row.salt_g ?? undefined,
    allergens: row.allergens ?? [],
    typical_expiry_days: undefined,
    source: (row.source ?? "user_added") as ProductInfo["source"],
    verified: false,
  };
}

function productToRow(p: ProductInfo) {
  return {
    ean_code: p.ean_code,
    product_name: p.product_name,
    brand: p.brand || "",
    category: p.category || "",
    subcategory: p.subcategory || "",
    image_url: p.image_url || "",
    weight_g: p.weight_g ?? null,
    volume_ml: p.volume_ml ?? null,
    pieces_count: p.pieces_count ?? null,
    unit: p.unit || "g",
    calories_kcal: p.calories_kcal ?? null,
    protein_g: p.protein_g ?? null,
    fat_g: p.fat_g ?? null,
    saturated_fat_g: p.saturated_fat_g ?? null,
    carbs_g: p.carbs_g ?? null,
    sugar_g: p.sugar_g ?? null,
    fiber_g: p.fiber_g ?? null,
    salt_g: p.salt_g ?? null,
    allergens: p.allergens ?? [],
    source: p.source || "user_added",
    updated_at: new Date().toISOString(),
  };
}

// Načte produkt ze sdíleného katalogu. Vrátí null, když není nebo nastane chyba.
export async function fetchFromCatalog(ean: string): Promise<ProductInfo | null> {
  if (!isRealEAN(ean)) return null;
  try {
    const { data, error } = await supabase
      .from("product_catalog")
      .select("*")
      .eq("ean_code", ean)
      .maybeSingle();
    if (error || !data) return null;
    return rowToProduct(data);
  } catch {
    return null;
  }
}

// Uloží produkt do sdíleného katalogu (upsert podle EAN). Tiše selže.
export async function saveToCatalog(product: ProductInfo): Promise<void> {
  if (!product.ean_code || !isRealEAN(product.ean_code)) return;
  try {
    await supabase
      .from("product_catalog")
      .upsert(productToRow(product), { onConflict: "ean_code" });
  } catch {
    /* offline / chyba — produkt zůstává aspoň v lokálním katalogu */
  }
}
