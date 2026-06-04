import { ProductInfo } from "@/types";

const OFF_API = "https://world.openfoodfacts.org/api/v2/product";

export async function fetchProductByEAN(ean: string): Promise<ProductInfo | null> {
  try {
    const res = await fetch(`${OFF_API}/${ean}.json?fields=product_name,brands,categories_tags,nutriments,allergens_tags,image_url,quantity`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1) return null;
    const p = data.product;

    const qty = parseQuantity(p.quantity ?? "");

    return {
      ean_code: ean,
      product_name: p.product_name || "Neznámý produkt",
      brand: p.brands || "",
      category: formatCategory(p.categories_tags?.[0] ?? ""),
      subcategory: formatCategory(p.categories_tags?.[1] ?? ""),
      image_url: p.image_url || p.image_front_url || "",
      ...qty,
      calories_kcal: p.nutriments?.["energy-kcal_100g"],
      protein_g: p.nutriments?.proteins_100g,
      fat_g: p.nutriments?.fat_100g,
      saturated_fat_g: p.nutriments?.["saturated-fat_100g"],
      carbs_g: p.nutriments?.carbohydrates_100g,
      sugar_g: p.nutriments?.sugars_100g,
      fiber_g: p.nutriments?.fiber_100g,
      salt_g: p.nutriments?.salt_100g,
      allergens: (p.allergens_tags ?? []).map((a: string) => a.replace("en:", "").replace("cs:", "")),
      typical_expiry_days: undefined,
      source: "open_food_facts",
      verified: true,
    };
  } catch {
    return null;
  }
}

function formatCategory(raw: string): string {
  return raw
    .replace(/^(en:|cs:)/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .split(" ")
    .slice(0, 3)
    .join(" ");
}

function parseQuantity(qty: string): { weight_g?: number; volume_ml?: number; pieces_count?: number; unit: "g" | "ml" | "ks" } {
  const lower = qty.toLowerCase();
  const num = parseFloat(qty.replace(/[^0-9.]/g, ""));
  if (lower.includes("ml") || lower.includes("l")) {
    const ml = lower.includes(" l") || lower.endsWith("l") && !lower.includes("ml")
      ? num * 1000 : num;
    return { volume_ml: ml, unit: "ml" };
  }
  if (lower.includes("kg")) return { weight_g: num * 1000, unit: "g" };
  if (lower.includes("g")) return { weight_g: num, unit: "g" };
  if (!isNaN(num) && num > 0) return { pieces_count: num, unit: "ks" };
  return { unit: "g" };
}
