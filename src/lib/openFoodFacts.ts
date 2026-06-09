import { ProductInfo } from "@/types";

const FIELDS = "product_name,brands,categories_tags,nutriments,allergens_tags,image_url,image_front_url,image_front_display_url,image_front_small_url,quantity";

// All four Open*Facts databases — tried in order until one returns a result
const DATABASES: { base: string; source: ProductInfo["source"] }[] = [
  { base: "https://world.openfoodfacts.org/api/v2/product", source: "open_food_facts" },
  { base: "https://world.openbeautyfacts.org/api/v2/product", source: "open_food_facts" },
  { base: "https://world.openpetfoodfacts.org/api/v2/product", source: "open_food_facts" },
  { base: "https://world.openproductsfacts.org/api/v2/product", source: "open_food_facts" },
];

async function fetchFromDatabase(ean: string, base: string, source: ProductInfo["source"]): Promise<ProductInfo | null> {
  try {
    const res = await fetch(`${base}/${ean}.json?fields=${FIELDS}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1) return null;
    const p = data.product;
    if (!p.product_name) return null;

    const qty = parseQuantity(p.quantity ?? "");
    const imageUrl = p.image_front_display_url || p.image_front_url || p.image_url || p.image_front_small_url || "";

    return {
      ean_code: ean,
      product_name: p.product_name,
      brand: p.brands || "",
      category: formatCategory(p.categories_tags?.[0] ?? ""),
      subcategory: formatCategory(p.categories_tags?.[1] ?? ""),
      image_url: imageUrl,
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
      source,
      verified: true,
    };
  } catch {
    return null;
  }
}

export async function fetchProductByEAN(ean: string): Promise<ProductInfo | null> {
  for (const db of DATABASES) {
    const result = await fetchFromDatabase(ean, db.base, db.source);
    if (result) return result;
  }
  return null;
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
  const lower = qty.toLowerCase().trim();
  // extract first number (supports comma as decimal separator)
  const match = lower.match(/[\d]+[.,]?[\d]*/);
  if (!match) return { unit: "g" };
  const num = parseFloat(match[0].replace(",", "."));
  if (isNaN(num) || num <= 0) return { unit: "g" };

  if (lower.includes("cl")) return { volume_ml: Math.round(num * 10), unit: "ml" };
  if (lower.includes("ml")) return { volume_ml: Math.round(num), unit: "ml" };
  if (/\d\s*l\b/.test(lower) || lower.endsWith(" l") || lower === `${num}l`) {
    return { volume_ml: Math.round(num * 1000), unit: "ml" };
  }
  if (lower.includes("kg")) return { weight_g: Math.round(num * 1000), unit: "g" };
  if (lower.includes(" g") || lower.endsWith("g")) return { weight_g: Math.round(num), unit: "g" };
  if (lower.includes("ks") || lower.includes("pcs") || lower.includes("st")) return { pieces_count: num, unit: "ks" };
  return { unit: "g" };
}
