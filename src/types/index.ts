export type ProductSource = "open_food_facts" | "user_added" | "czech_db";

export interface ProductInfo {
  ean_code: string;
  product_name: string;
  brand: string;
  category: string;
  subcategory: string;
  image_url: string;
  // Balení
  weight_g?: number;
  volume_ml?: number;
  pieces_count?: number;
  unit: "g" | "ml" | "ks";
  // Nutriční hodnoty na 100g/100ml
  calories_kcal?: number;
  protein_g?: number;
  fat_g?: number;
  saturated_fat_g?: number;
  carbs_g?: number;
  sugar_g?: number;
  fiber_g?: number;
  salt_g?: number;
  // Alergeny
  allergens: string[];
  // Trvanlivost
  typical_expiry_days?: number;
  // Meta
  source: ProductSource;
  verified: boolean;
  added_by?: string;
}

export type StorageLocation = "lednice" | "mrazak" | "spiz" | "linka";

export interface PantryItem {
  id: string;
  product: ProductInfo;
  quantity: number;
  unit: string;
  purchased_at: string;
  expires_at?: string;
  location: StorageLocation;
  price_paid?: number;
  store?: string;
  notes?: string;
}

export interface PriceRecord {
  ean_code: string;
  price: number;
  price_per_kg?: number;
  store: string;
  date: string;
}

export interface FoodLogEntry {
  id: string;
  date: string;
  meal: "snidane" | "svacina" | "obed" | "vecere" | "jine";
  items: FoodLogItem[];
  total_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  notes?: string;
}

export interface FoodLogItem {
  product?: ProductInfo;
  name: string;
  quantity_g: number;
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  ean_code?: string;
  in_pantry?: boolean;
  pantry_quantity?: number;
  // přímé propojení na produkt ve spižírně
  linked_product_name?: string;
  linked_ean?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  category?: string;
  servings: number;
  prep_time_min: number;
  cook_time_min: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  calories_per_serving?: number;
  protein_per_serving?: number;
  fat_per_serving?: number;
  carbs_per_serving?: number;
  tags: string[];
}

export interface NutritionGoal {
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}
