"use client";

import { useState } from "react";
import { Clock, Users, ChevronDown, ChevronUp, CheckCircle, XCircle, ShoppingCart, ChefHat, AlertCircle, Plus, Trash2, BookOpen } from "lucide-react";
import { Recipe } from "@/types";
import { usePantryStore } from "@/store/pantryStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useUIStore } from "@/store/uiStore";
import { useRecipeStore } from "@/store/recipeStore";
import { AddRecipeModal } from "@/components/AddRecipeModal";

function RecipeCard({ recipe, onDelete }: { recipe: Recipe; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState(0);
  const [showCookModal, setShowCookModal] = useState(false);
  const [cookPortions, setCookPortions] = useState(recipe.servings);
  const pantryItems = usePantryStore((s) => s.items);
  const addItems = useShoppingStore((s) => s.addItems);
  const setTab = useUIStore((s) => s.setTab);
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
    // 2. Fuzzy fallback pokud není propojení
    return pantryItems.find((p) =>
      p.product.product_name.toLowerCase().includes(ing.name.toLowerCase()) ||
      ing.name.toLowerCase().includes(p.product.product_name.toLowerCase().split(" ")[0])
    ) ?? null;
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
    })));
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
              <p className="text-xs font-semibold uppercase mb-3" style={{ color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>Suroviny</p>
              <div className="space-y-2">
                {ingredientsWithStatus.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    {ing.available
                      ? <CheckCircle size={15} style={{ color: "var(--green-primary)", flexShrink: 0 }} />
                      : ing.partial
                      ? <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E8B84B" }}>
                          <span style={{ fontSize: 9, color: "white", fontWeight: 700 }}>!</span>
                        </div>
                      : <XCircle size={15} style={{ color: "#D95757", flexShrink: 0 }} />
                    }
                    <div className="flex-1 min-w-0">
                      <span className="text-sm" style={{ color: ing.available ? "var(--text-primary)" : ing.partial ? "#B85C00" : "#D95757" }}>
                        {ing.name}
                      </span>
                      {ing.isLinked && ing.linked_product_name && ing.linked_product_name !== ing.name && (
                        <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>
                          → {ing.linked_product_name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                      {ing.quantity} {ing.unit}
                      {ing.partial && <span style={{ color: "#E8B84B" }}> (chybí {ing.missing})</span>}
                    </span>
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
                  : <><ShoppingCart size={16} /> Přidat {missing.length} chybějících na seznam</>
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
  const [done, setDone] = useState(false);
  const [addedMissing, setAddedMissing] = useState(false);
  const ratio = portions / recipe.servings;
  const scaledKcal = recipe.calories_per_serving ? Math.round(recipe.calories_per_serving * ratio) : null;

  const missingIngs = ingredientsWithStatus.filter((i) => !i.available && i.pantryQty === 0);

  const handleCook = () => {
    recipe.ingredients.forEach((ing) => {
      const m = pantryItems.find((p) =>
        p.product.product_name.toLowerCase().includes(ing.name.toLowerCase()) ||
        ing.name.toLowerCase().includes(p.product.product_name.toLowerCase().split(" ")[0])
      );
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
    })));
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

export function RecipesView() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const { recipes, deleteRecipe } = useRecipeStore();

  const filtered = recipes.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="px-5 pt-2 pb-24">
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-tertiary)" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat recepty..."
            style={{ width: "100%", paddingLeft: 38, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 16, fontSize: 14, outline: "none", background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
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
