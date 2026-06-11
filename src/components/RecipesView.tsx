"use client";

import { useState, useMemo } from "react";
import { Clock, Users, ChevronDown, ChevronUp, Check, ShoppingCart, ChefHat, AlertCircle, Plus, Trash2, BookOpen, Sparkles, RefreshCw } from "lucide-react";
import { Recipe } from "@/types";
import { usePantryStore } from "@/store/pantryStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useUIStore } from "@/store/uiStore";
import { useModeStore } from "@/store/modeStore";
import { useRecipeStore } from "@/store/recipeStore";
import { useGamificationStore } from "@/store/gamificationStore";
import { AddRecipeModal } from "@/components/AddRecipeModal";

function RecipeCard({ recipe, onDelete }: { recipe: Recipe; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState(0);
  const [showCookModal, setShowCookModal] = useState(false);
  const [cookPortions, setCookPortions] = useState(recipe.servings);
  const pantryItems = usePantryStore((s) => s.items);
  const addItems = useShoppingStore((s) => s.addItems);
  const setTab = useUIStore((s) => s.setTab);
  const appMode = useModeStore((s) => s.mode);
  const shoppingMode = appMode === "provoz" ? "provoz" : "domacnost";
  const [addedToCart, setAddedToCart] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const findPantryMatch = (ing: typeof recipe.ingredients[0]) => {
    // 1. Přesné propojení přes linked_ean nebo linked_product_name
    if (ing.linked_ean) {
      const m = pantryItems.find((p) => p.product.ean_code === ing.linked_ean);
      if (m) return m;
    }
    if (ing.linked_product_name) {
      const m = pantryItems.find((p) => p.product.product_name === ing.linked_product_name);
      if (m) return m;
    }
    // 2. Fuzzy matching — klíčová slova z názvu ingredience vs produktu
    // Stopslova která ignorujeme při porovnání
    const STOP = new Set(["konzervovaná", "konzervovaný", "konzervované", "čerstvý", "čerstvá", "čerstvé",
      "sušený", "sušená", "sušené", "mražený", "mražená", "mražené", "celý", "celá", "celé",
      "strouhaný", "strouhaná", "strouhaný", "nakrájený", "nakrájená", "mletý", "mletá", "mleté",
      "uvařená", "uvařený", "velký", "velká", "malý", "malá", "baby", "sterilované", "sterilovaný"]);

    const keywords = (str: string) =>
      str.toLowerCase()
        .split(/[\s,()\/]+/)
        .map(w => w.replace(/[^a-záčďéěíňóřšťúůýž]/g, ""))
        .filter(w => w.length > 2 && !STOP.has(w));

    const ingWords = keywords(ing.name);

    return pantryItems.find((p) => {
      const prodWords = keywords(p.product.product_name);
      // Stačí aby se alespoň jedno klíčové slovo shodovalo
      return ingWords.some(iw =>
        prodWords.some(pw => pw.includes(iw) || iw.includes(pw))
      );
    }) ?? null;
  };

  const ingredientsWithStatus = recipe.ingredients.map((ing) => {
    const pantryMatch = findPantryMatch(ing);
    const pantryQty = pantryMatch?.quantity ?? 0;
    // available = je v spižírně A množství stačí (pokud ing.quantity=0, potřebujeme aspoň existenci v spižírně)
    const available = pantryMatch !== null && (ing.quantity === 0 || pantryQty >= ing.quantity);
    const partial = !available && pantryQty > 0;
    const missing = Math.max(0, ing.quantity - pantryQty);
    const isLinked = !!(ing.linked_ean || ing.linked_product_name);
    return { ...ing, available, partial, pantryQty, missing, isLinked };
  });

  const availableCount = ingredientsWithStatus.filter((i) => i.available).length;
  const totalCount = ingredientsWithStatus.length;
  const allAvailable = availableCount === totalCount;
  const missing = ingredientsWithStatus.filter((i) => !i.available);

  const maxRatio = recipe.ingredients.length === 0 ? 1 : Math.min(
    ...recipe.ingredients.map((ing) => {
      const m = findPantryMatch(ing);
      return m ? m.quantity / ing.quantity : 0;
    })
  );
  const maxServings = Math.max(0, Math.floor(maxRatio * recipe.servings));

  const handleAddToShopping = () => {
    addItems(missing.map((ing) => ({
      name: ing.name,
      quantity: ing.missing,
      unit: ing.unit,
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      ean_code: ing.ean_code,
    })), shoppingMode);
    setAddedToCart(true);
    setTimeout(() => { setAddedToCart(false); setTab("nakup"); }, 800);
  };

  return (
    <div className="card overflow-hidden mb-3">
      <button className="w-full text-left p-4" onClick={() => setExpanded((e) => !e)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>{recipe.name}</h3>
              {allAvailable && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold badge-ok">Máš vše ✓</span>
              )}
              {!allAvailable && maxServings > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold badge-warn">
                  Lze {maxServings} {maxServings === 1 ? "porci" : "porce"}
                </span>
              )}
            </div>
            {recipe.description && (
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{recipe.description}</p>
            )}
          </div>
          {expanded
            ? <ChevronUp size={18} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            : <ChevronDown size={18} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          }
        </div>

        <div className="flex items-center gap-4 mt-3">
          {(recipe.prep_time_min + recipe.cook_time_min) > 0 && (
            <div className="flex items-center gap-1">
              <Clock size={13} style={{ color: "var(--text-tertiary)" }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{recipe.prep_time_min + recipe.cook_time_min} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users size={13} style={{ color: "var(--text-tertiary)" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{recipe.servings} {recipe.servings === 1 ? "porce" : "porce"}</span>
          </div>
          {recipe.calories_per_serving && (
            <span className="text-xs font-semibold" style={{ color: "var(--green-primary)" }}>{recipe.calories_per_serving} kcal/porci</span>
          )}
          {totalCount > 0 && (
            <span className="text-xs ml-auto" style={{ color: allAvailable ? "#4A6B3F" : "var(--text-tertiary)" }}>
              {availableCount}/{totalCount} surovin
            </span>
          )}
        </div>

        {totalCount > 0 && (
          <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(availableCount / totalCount) * 100}%`,
                background: allAvailable ? "var(--green-primary)" : availableCount > 0 ? "#E8B84B" : "var(--border)",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t animate-fade-in" style={{ borderColor: "var(--border)" }}>

          {/* Smaller portion suggestion */}
          {!allAvailable && maxServings > 0 && (
            <div className="mx-4 mt-4 rounded-2xl p-3.5" style={{ background: "#FEF3E2" }}>
              <div className="flex items-start gap-2">
                <AlertCircle size={15} style={{ color: "#B85C00", flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs font-semibold flex-1" style={{ color: "#B85C00" }}>
                  Chybí na {recipe.servings} porcí, ale máš na {maxServings}
                </p>
              </div>
              <button
                onClick={() => { setCookPortions(maxServings); setShowCookModal(true); }}
                className="mt-2 w-full py-2 rounded-xl text-xs font-semibold"
                style={{ background: "#E8B84B", color: "white" }}
              >
                Uvařit {maxServings} {maxServings === 1 ? "porci" : "porce"} z toho co mám
              </button>
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <div className="p-4">
              <p className="text-base font-bold mb-3" style={{ color: "var(--text-primary)" }}>Ingredience</p>
              <div className="space-y-2">
                {ingredientsWithStatus.map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5"
                    style={{ background: "var(--bg-primary)", borderRadius: 14, padding: "10px 12px" }}
                  >
                    {ing.available ? (
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Check size={12} color="white" strokeWidth={3} />
                      </div>
                    ) : ing.partial ? (
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, #F7B267 0%, #E8862E 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: 11, color: "white", fontWeight: 800 }}>!</span>
                      </div>
                    ) : (
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        border: "2px solid var(--border)", background: "white",
                      }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold" style={{ color: ing.available ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {ing.name}, {ing.quantity} {ing.unit}
                      </span>
                      {ing.partial && (
                        <span className="text-xs ml-1" style={{ color: "#B85C00", fontWeight: 600 }}>(chybí {ing.missing})</span>
                      )}
                    </div>
                    {!ing.available && (
                      <span className="text-xs font-bold flex items-center gap-1 flex-shrink-0" style={{ color: "#E8862E" }}>
                        Chybí mi <ShoppingCart size={13} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-3">
              {recipe.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions.length > 0 && (
            <div className="px-4 pb-2">
              <p className="text-xs font-semibold uppercase mb-3" style={{ color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>Postup</p>
              <div className="space-y-2">
                {recipe.instructions.map((ins, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className="flex items-start gap-3 w-full text-left p-2.5 rounded-xl transition-all"
                    style={{
                      background: step === i ? "var(--green-light)" : "transparent",
                      border: `1.5px solid ${step === i ? "var(--green-primary)" : "transparent"}`,
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: step > i ? "var(--green-primary)" : step === i ? "var(--green-primary)" : "var(--border)",
                        color: step >= i ? "white" : "var(--text-tertiary)",
                      }}
                    >
                      {step > i ? "✓" : i + 1}
                    </span>
                    <p className="text-sm" style={{ color: step === i ? "var(--green-dark)" : "var(--text-primary)" }}>{ins}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-4 pb-4 space-y-2 mt-2">
            {!allAvailable && missing.length > 0 && (
              <button
                onClick={handleAddToShopping}
                className="btn-primary"
                style={addedToCart ? { background: "#4A6B3F" } : {}}
              >
                {addedToCart
                  ? "✓ Přidáno na nákupní seznam"
                  : <><ShoppingCart size={16} /> Přidat chybějící do nákupu ({missing.length})</>
                }
              </button>
            )}
            {(allAvailable || maxServings > 0) && (
              <button
                onClick={() => { setCookPortions(allAvailable ? recipe.servings : maxServings); setShowCookModal(true); }}
                className="btn-secondary"
              >
                <ChefHat size={16} /> Uvařím teď
              </button>
            )}

            {/* Delete */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2.5 rounded-2xl text-xs font-medium flex items-center justify-center gap-1.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                <Trash2 size={13} /> Smazat recept
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={onDelete}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold"
                  style={{ background: "#FDE8E8", color: "#C0392B" }}
                >
                  Smazat
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold"
                  style={{ background: "var(--border)", color: "var(--text-secondary)" }}
                >
                  Zrušit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCookModal && (
        <CookModal
          recipe={recipe}
          portions={cookPortions}
          onPortionsChange={setCookPortions}
          onClose={() => setShowCookModal(false)}
          ingredientsWithStatus={ingredientsWithStatus}
        />
      )}
    </div>
  );
}

function CookModal({ recipe, portions, onPortionsChange, onClose, ingredientsWithStatus }: {
  recipe: Recipe;
  portions: number;
  onPortionsChange: (n: number) => void;
  onClose: () => void;
  ingredientsWithStatus: any[];
}) {
  const consumeItem = usePantryStore((s) => s.consumeItem);
  const pantryItems = usePantryStore((s) => s.items);
  const addItems = useShoppingStore((s) => s.addItems);
  const appMode = useModeStore((s) => s.mode);
  const shoppingMode = appMode === "provoz" ? "provoz" : "domacnost";
  const [done, setDone] = useState(false);
  const [addedMissing, setAddedMissing] = useState(false);
  const ratio = portions / recipe.servings;
  const scaledKcal = recipe.calories_per_serving ? Math.round(recipe.calories_per_serving * ratio) : null;

  const missingIngs = ingredientsWithStatus.filter((i) => !i.available && i.pantryQty === 0);

  const handleCook = () => {
    const STOP = new Set(["konzervovaná", "konzervovaný", "konzervované", "čerstvý", "čerstvá", "čerstvé",
      "sušený", "sušená", "sušené", "mražený", "mražená", "mražené", "celý", "celá", "celé",
      "strouhaný", "strouhaná", "nakrájený", "nakrájená", "mletý", "mletá", "mleté",
      "uvařená", "uvařený", "velký", "velká", "malý", "malá", "baby", "sterilované"]);
    const keywords = (str: string) =>
      str.toLowerCase().split(/[\s,()\/]+/)
        .map(w => w.replace(/[^a-záčďéěíňóřšťúůýž]/g, ""))
        .filter(w => w.length > 2 && !STOP.has(w));

    recipe.ingredients.forEach((ing) => {
      const ingWords = keywords(ing.name);
      const m = pantryItems.find((p) => {
        const prodWords = keywords(p.product.product_name);
        return ingWords.some(iw => prodWords.some(pw => pw.includes(iw) || iw.includes(pw)));
      });
      if (m) consumeItem(m.id, ing.quantity * ratio);
    });
    setDone(true);
    setTimeout(onClose, 1200);
  };

  const handleAddMissing = () => {
    addItems(missingIngs.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity * ratio,
      unit: ing.unit,
      recipe_id: recipe.id,
      recipe_name: recipe.name,
    })), shoppingMode);
    setAddedMissing(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 100 }}>
      <div className="sheet-overlay animate-fade-in" onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div
        className="relative animate-slide-up rounded-t-3xl overflow-hidden"
        style={{ background: "var(--bg-primary)", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="px-5 pt-2 pb-8 space-y-4">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{recipe.name}</h3>

          <div className="card p-4">
            <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>POČET PORCÍ</p>
            <div className="flex items-center justify-between">
              <button onClick={() => onPortionsChange(Math.max(1, portions - 1))} className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "var(--bg-primary)" }}>−</button>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{portions}</p>
                {scaledKcal && <p className="text-xs" style={{ color: "var(--green-primary)" }}>{scaledKcal} kcal celkem</p>}
              </div>
              <button onClick={() => onPortionsChange(portions + 1)} className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "var(--green-primary)", color: "white" }}>+</button>
            </div>
          </div>

          {ingredientsWithStatus.filter((i) => i.pantryQty > 0).length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>ODEČTE SE ZE SPIŽÍRNY</p>
              <div className="space-y-2">
                {ingredientsWithStatus.filter((i) => i.pantryQty > 0).map((ing, i) => {
                  const deduct = Math.min(ing.pantryQty, ing.quantity * ratio);
                  return (
                    <div key={i} className="flex justify-between">
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>{ing.name}</span>
                      <span className="text-sm font-medium" style={{ color: "var(--green-dark)" }}>−{deduct.toFixed(0)} {ing.unit}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {missingIngs.length > 0 && (
            <div className="card p-4" style={{ background: "#FEF3E2" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#B85C00" }}>CHYBÍ V SPIŽÍRNĚ</p>
              <div className="space-y-1.5 mb-3">
                {missingIngs.map((ing, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-sm" style={{ color: "#B85C00" }}>{ing.name}</span>
                    <span className="text-sm font-medium" style={{ color: "#B85C00" }}>{(ing.quantity * ratio).toFixed(0)} {ing.unit}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddMissing}
                className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: addedMissing ? "#4A6B3F" : "#E8B84B", color: "white" }}
              >
                {addedMissing ? "✓ Přidáno na nákupní seznam" : <><ShoppingCart size={13} /> Přidat chybějící na seznam</>}
              </button>
            </div>
          )}

          <button onClick={handleCook} className="btn-primary" style={done ? { background: "#4A6B3F" } : {}}>
            {done ? "✓ Odečteno ze spižírny!" : <><ChefHat size={18} /> Uvařeno — odečíst ze spižírny</>}
          </button>
          <button onClick={onClose} className="btn-secondary">Zrušit</button>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = ["Vše", "Česká klasika", "Polévky", "Těstoviny", "Kuřecí", "Ryby & mořské plody", "Vegetariánské", "Veganské", "Snídaně", "Saláty", "Mezinárodní", "Dezerty", "Rychlá jídla"];

function getCategory(recipe: Recipe): string {
  if (recipe.category) return recipe.category;
  const t = recipe.tags.map(t => t.toLowerCase());
  if (t.some(t => ["česká klasika", "česky", "knedlík", "svíčková", "guláš"].some(k => t.includes(k)))) return "Česká klasika";
  if (t.some(t => ["polévka", "vývar", "soup"].some(k => t.includes(k)))) return "Polévky";
  if (t.some(t => ["těstoviny", "pasta", "špagety", "lasagne"].some(k => t.includes(k)))) return "Těstoviny";
  if (t.some(t => ["kuřecí", "kuře"].some(k => t.includes(k)))) return "Kuřecí";
  if (t.some(t => ["ryby", "losos", "treska", "krevety", "mořské"].some(k => t.includes(k)))) return "Ryby & mořské plody";
  if (t.some(t => ["vegan", "veganský", "veganské"].some(k => t.includes(k)))) return "Veganské";
  if (t.some(t => ["vegetariánský", "vegetariánské", "bez masa"].some(k => t.includes(k)))) return "Vegetariánské";
  if (t.some(t => ["snídaně", "breakfast"].some(k => t.includes(k)))) return "Snídaně";
  if (t.some(t => ["salát", "salad"].some(k => t.includes(k)))) return "Saláty";
  if (t.some(t => ["dezert", "sladké", "cake", "dort"].some(k => t.includes(k)))) return "Dezerty";
  if (t.some(t => ["rychlé", "rychlá"].some(k => t.includes(k)))) return "Rychlá jídla";
  if (t.some(t => ["mexické", "asijské", "indické", "japonské", "thajské", "řecké", "francouzské"].some(k => t.includes(k)))) return "Mezinárodní";
  return "Ostatní";
}

function TodaySuggestionWidget() {
  const pantryItems = usePantryStore((s) => s.items);
  const { recipes } = useRecipeStore();
  const recordCooked = useGamificationStore((s) => s.recordCooked);
  const addItems = useShoppingStore((s) => s.addItems);
  const appMode = useModeStore((s) => s.mode);
  const shoppingMode = appMode === "provoz" ? "provoz" : "domacnost";
  const [refreshKey, setRefreshKey] = useState(0);
  const [cookDone, setCookDone] = useState(false);

  const suggestion = useMemo(() => {
    if (recipes.length === 0 || pantryItems.length === 0) return null;

    const STOP = new Set(["konzervovaná","konzervovaný","konzervované","čerstvý","čerstvá","čerstvé",
      "sušený","sušená","sušené","mražený","mražená","mražené","celý","celá","celé",
      "strouhaný","strouhaná","nakrájený","nakrájená","mletý","mletá","mleté"]);
    const keywords = (str: string) =>
      str.toLowerCase().split(/[\s,()\/]+/)
        .map(w => w.replace(/[^a-záčďéěíňóřšťúůýž]/g, ""))
        .filter(w => w.length > 2 && !STOP.has(w));

    const scored = recipes.map((r) => {
      let matched = 0;
      r.ingredients.forEach((ing) => {
        const ingWords = keywords(ing.name);
        const found = pantryItems.some((p) => {
          const prodWords = keywords(p.product.product_name);
          return ingWords.some(iw => prodWords.some(pw => pw.includes(iw) || iw.includes(pw)));
        });
        if (found) matched++;
      });
      const total = r.ingredients.length || 1;
      return { recipe: r, score: matched / total, matched, total };
    });

    const best = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    if (best.length === 0) return null;

    // refreshKey slouží k přepínání návrhu
    const idx = refreshKey % Math.min(best.length, 5);
    return best[idx];
  }, [recipes, pantryItems, refreshKey]);

  if (!suggestion) return null;

  const { recipe, matched, total } = suggestion;
  const percent = Math.round((matched / total) * 100);
  const missing = recipe.ingredients.filter((ing) => {
    const STOP = new Set(["konzervovaná","konzervovaný","konzervované","čerstvý","čerstvá","čerstvé",
      "sušený","sušená","sušené","mražený","mražená","mražené"]);
    const keywords = (str: string) =>
      str.toLowerCase().split(/[\s,()\/]+/)
        .map(w => w.replace(/[^a-záčďéěíňóřšťúůýž]/g, ""))
        .filter(w => w.length > 2 && !STOP.has(w));
    const ingWords = keywords(ing.name);
    return !pantryItems.some((p) => {
      const prodWords = keywords(p.product.product_name);
      return ingWords.some(iw => prodWords.some(pw => pw.includes(iw) || iw.includes(pw)));
    });
  });

  const [showDetail, setShowDetail] = useState(false);
  const [cookStep, setCookStep] = useState(0);

  const handleCookNow = () => {
    recordCooked();
    setCookDone(true);
    setTimeout(() => setCookDone(false), 2000);
  };

  const handleAddMissing = () => {
    addItems(missing.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      recipe_id: recipe.id,
      recipe_name: recipe.name,
    })), shoppingMode);
  };

  return (
    <div
      className="rounded-3xl mb-4 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
        boxShadow: "0 6px 24px rgba(76,175,130,0.35)",
      }}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={13} color="rgba(255,255,255,0.8)" />
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Co uvařím dnes?
          </p>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold leading-tight" style={{ color: "white" }}>{recipe.name}</h3>
            {recipe.description && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2, lineHeight: 1.4 }}>{recipe.description}</p>
            )}
          </div>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)" }}
            title="Jiný návrh"
          >
            <RefreshCw size={14} color="white" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Suroviny v spižírně</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{matched}/{total} ({percent}%)</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.25)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${percent}%`, background: "rgba(255,255,255,0.9)", transition: "width 0.5s ease" }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex gap-3 mt-2.5">
          {(recipe.prep_time_min + recipe.cook_time_min) > 0 && (
            <div className="flex items-center gap-1">
              <Clock size={11} color="rgba(255,255,255,0.65)" />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{recipe.prep_time_min + recipe.cook_time_min} min</span>
            </div>
          )}
          {recipe.servings > 0 && (
            <div className="flex items-center gap-1">
              <Users size={11} color="rgba(255,255,255,0.65)" />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{recipe.servings} porce</span>
            </div>
          )}
          {recipe.calories_per_serving && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{recipe.calories_per_serving} kcal/porci</span>
          )}
        </div>
      </div>

      {/* Rozbalovací detail — ingredience + postup */}
      {showDetail && (
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden animate-fade-in" style={{ background: "rgba(0,0,0,0.18)" }}>
          {/* Ingredience */}
          {recipe.ingredients.length > 0 && (
            <div className="px-4 pt-3 pb-2">
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                Suroviny
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {recipe.ingredients.map((ing, i) => {
                  const STOP = new Set(["konzervovaná","konzervovaný","konzervované","čerstvý","čerstvá","čerstvé","sušený","sušená","mražený","mražená","mražené"]);
                  const kw = (str: string) => str.toLowerCase().split(/[\s,()\/]+/).map(w => w.replace(/[^a-záčďéěíňóřšťúůýž]/g, "")).filter(w => w.length > 2 && !STOP.has(w));
                  const ingWords = kw(ing.name);
                  const inPantry = pantryItems.some((p) => {
                    const pw = kw(p.product.product_name);
                    return ingWords.some(iw => pw.some(pw2 => pw2.includes(iw) || iw.includes(pw2)));
                  });
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, flexShrink: 0 }}>{inPantry ? "✓" : "○"}</span>
                      <span style={{ fontSize: 13, color: inPantry ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)", flex: 1 }}>{ing.name}</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", flexShrink: 0 }}>{ing.quantity > 0 ? `${ing.quantity} ${ing.unit}` : ing.unit}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Postup */}
          {recipe.instructions.length > 0 && (
            <div className="px-4 pt-2 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.12)", marginTop: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                Postup
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {recipe.instructions.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setCookStep(i)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left",
                      background: cookStep === i ? "rgba(255,255,255,0.18)" : "transparent",
                      borderRadius: 12, padding: "8px 10px",
                      border: `1px solid ${cookStep === i ? "rgba(255,255,255,0.3)" : "transparent"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: cookStep > i ? "rgba(255,255,255,0.7)" : cookStep === i ? "white" : "rgba(255,255,255,0.2)",
                      color: cookStep >= i ? "var(--green-dark)" : "rgba(255,255,255,0.7)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800,
                    }}>
                      {cookStep > i ? "✓" : i + 1}
                    </span>
                    <span style={{ fontSize: 13, color: cookStep === i ? "white" : "rgba(255,255,255,0.75)", lineHeight: 1.45 }}>{step}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="px-4 pb-4 space-y-2">
        {/* Zobrazit / skrýt recept */}
        <button
          onClick={() => setShowDetail(d => !d)}
          className="w-full py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5"
          style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}
        >
          {showDetail ? <><ChevronUp size={15} /> Skrýt recept</> : <><ChevronDown size={15} /> Zobrazit recept</>}
        </button>

        <div className="flex gap-2">
          {percent === 100 ? (
            <button
              onClick={handleCookNow}
              className="flex-1 py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5"
              style={{ background: cookDone ? "rgba(255,255,255,0.3)" : "white", color: cookDone ? "white" : "var(--green-dark)" }}
            >
              {cookDone ? "✓ Výborně!" : <><ChefHat size={15} /> Uvařím teď</>}
            </button>
          ) : (
            <>
              <button
                onClick={handleCookNow}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5"
                style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                <ChefHat size={15} /> Uvařím z toho co mám
              </button>
              {missing.length > 0 && (
                <button
                  onClick={handleAddMissing}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5"
                  style={{ background: "white", color: "var(--green-dark)" }}
                >
                  <ShoppingCart size={15} /> +{missing.length} na seznam
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function RecipesView() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Vše");
  const [showAdd, setShowAdd] = useState(false);
  const { recipes, deleteRecipe } = useRecipeStore();

  const filtered = recipes.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "Vše" || getCategory(r) === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="px-5 pt-2 pb-24">
        {/* Today suggestion */}
        <TodaySuggestionWidget />

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-tertiary)" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat recepty..."
            style={{ width: "100%", paddingLeft: 38, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 16, fontSize: 14, outline: "none", background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: activeCategory === cat ? 600 : 500,
                border: "none",
                background: activeCategory === cat ? "var(--green-primary)" : "white",
                color: activeCategory === cat ? "white" : "var(--text-secondary)",
                boxShadow: activeCategory === cat ? "0 2px 8px rgba(76,175,130,0.3)" : "0 1px 4px rgba(0,0,0,0.08)",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {recipes.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-5 py-16">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
              <BookOpen size={32} strokeWidth={1.5} style={{ color: "var(--green-primary)" }} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Žádné recepty</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Přidejte svůj první recept.</p>
            </div>
            <button className="btn-primary" style={{ width: "auto", paddingLeft: 24, paddingRight: 24 }} onClick={() => setShowAdd(true)}>
              <Plus size={18} /> Přidat recept
            </button>
          </div>
        )}

        {/* Recipe cards */}
        {filtered.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onDelete={() => deleteRecipe(recipe.id)} />
        ))}

        {recipes.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Žádný recept nenalezen</p>
          </div>
        )}

        {/* Add button */}
        {recipes.length > 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "white", color: "var(--green-primary)", border: "1.5px dashed var(--green-primary)" }}
          >
            <Plus size={16} /> Přidat recept
          </button>
        )}
      </div>

      {showAdd && <AddRecipeModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
