// Sdílená matchovací logika recept ↔ zásoby (spižírna i provozní sklad).
// Používá ji RecipesView (karty, denní návrh) i chytré notifikace, ať se
// pravidla (STOP slova, fuzzy shoda) nikdy nerozcházejí.

import { Recipe } from "@/types";

// Unifikovaná zásoba napříč režimy (spižírna i provozní sklad).
export interface StockItem { id: string; name: string; quantity: number; ean?: string }

const MATCH_STOP = new Set(["konzervovaná", "konzervovaný", "konzervované", "čerstvý", "čerstvá", "čerstvé",
  "sušený", "sušená", "sušené", "mražený", "mražená", "mražené", "celý", "celá", "celé",
  "strouhaný", "strouhaná", "nakrájený", "nakrájená", "mletý", "mletá", "mleté",
  "uvařená", "uvařený", "velký", "velká", "malý", "malá", "baby", "sterilované", "sterilovaný"]);

// Rozseká název na klíčová slova bez stopslov.
export function matchKeywords(str: string): string[] {
  return str.toLowerCase()
    .split(/[\s,()\/]+/)
    .map(w => w.replace(/[^a-záčďéěíňóřšťúůýž]/g, ""))
    .filter(w => w.length > 2 && !MATCH_STOP.has(w));
}

// Shodují se názvy ingredience a produktu aspoň jedním klíčovým slovem?
export function nameMatches(ingName: string, stockName: string): boolean {
  const iw = matchKeywords(ingName), pw = matchKeywords(stockName);
  return iw.some(a => pw.some(b => b.includes(a) || a.includes(b)));
}

// Najde ve skladu položku odpovídající ingredienci (přesně přes EAN/název,
// jinak fuzzy přes klíčová slova). Sdíleno domácností i provozem.
export function findStock(
  stock: StockItem[],
  ing: { name: string; linked_ean?: string; linked_product_name?: string },
): StockItem | null {
  if (ing.linked_ean) {
    const m = stock.find((p) => p.ean && p.ean === ing.linked_ean);
    if (m) return m;
  }
  if (ing.linked_product_name) {
    const m = stock.find((p) => p.name === ing.linked_product_name);
    if (m) return m;
  }
  return stock.find((p) => nameMatches(ing.name, p.name)) ?? null;
}

// Kolik ingrediencí receptu je pokryto zásobami + celkem. Prázdný recept → 0/0.
export function recipeCoverage(recipe: Recipe, stock: StockItem[]): { have: number; total: number } {
  const total = recipe.ingredients.length;
  if (total === 0) return { have: 0, total: 0 };
  let have = 0;
  for (const ing of recipe.ingredients) {
    const m = findStock(stock, ing);
    if (m && (ing.quantity === 0 || m.quantity >= ing.quantity)) have++;
  }
  return { have, total };
}

// Vybere recept, který jde NEJLÍP uvařit z aktuálních zásob.
// Vrací null, když nic rozumného (potřebujeme aspoň minHave pokrytých ingrediencí
// a aspoň nějaké procento pokrytí), ať notifikace nenavrhuje nesmysl.
export function bestRecipeFromStock(
  recipes: Recipe[],
  stock: StockItem[],
  opts: { minHave?: number; minRatio?: number } = {},
): { recipe: Recipe; have: number; total: number } | null {
  const minHave = opts.minHave ?? 2;
  const minRatio = opts.minRatio ?? 0.6;
  let best: { recipe: Recipe; have: number; total: number; ratio: number } | null = null;
  for (const r of recipes) {
    const { have, total } = recipeCoverage(r, stock);
    if (total === 0) continue;
    const ratio = have / total;
    if (have < minHave || ratio < minRatio) continue;
    // Preferuj vyšší pokrytí; při shodě víc pokrytých ingrediencí.
    if (!best || ratio > best.ratio || (ratio === best.ratio && have > best.have)) {
      best = { recipe: r, have, total, ratio };
    }
  }
  return best ? { recipe: best.recipe, have: best.have, total: best.total } : null;
}
