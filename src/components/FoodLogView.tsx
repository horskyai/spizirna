"use client";

import { useState } from "react";
import { Plus, X, Search, Package } from "lucide-react";
import { useFoodLogStore } from "@/store/foodLogStore";
import { usePantryStore } from "@/store/pantryStore";
import { FoodLogEntry, FoodLogItem } from "@/types";
import { todayISO } from "@/lib/dateUtils";

const MEALS = [
  { id: "snidane", label: "Snídaně", emoji: "🌅" },
  { id: "svacina", label: "Svačina", emoji: "🍎" },
  { id: "obed", label: "Oběd", emoji: "🍽️" },
  { id: "vecere", label: "Večeře", emoji: "🌙" },
  { id: "jine", label: "Jiné", emoji: "🥤" },
] as const;

type MealId = typeof MEALS[number]["id"];

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-14 text-right flex-shrink-0" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: "width 0.5s ease" }} />
      </div>
      <span className="text-xs w-16 flex-shrink-0 font-medium" style={{ color: "var(--text-primary)" }}>
        {Math.round(value)}/{goal}g
      </span>
    </div>
  );
}

function QuickLogModal({ onClose, onAdd }: { onClose: () => void; onAdd: (item: Omit<FoodLogEntry, "id">) => void }) {
  const pantryItems = usePantryStore((s) => s.items);
  const [meal, setMeal] = useState<MealId>("obed");
  const [mode, setMode] = useState<"pantry" | "manual">("pantry");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<typeof pantryItems[0] | null>(null);
  const [amountG, setAmountG] = useState("100");
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const filteredPantry = pantryItems.filter((i) =>
    i.product.product_name.toLowerCase().includes(search.toLowerCase()) ||
    i.product.brand.toLowerCase().includes(search.toLowerCase())
  );

  const calcFromProduct = (product: typeof pantryItems[0]["product"], grams: number) => {
    const ratio = grams / 100;
    return {
      kcal: (product.calories_kcal ?? 0) * ratio,
      protein: (product.protein_g ?? 0) * ratio,
      carbs: (product.carbs_g ?? 0) * ratio,
      fat: (product.fat_g ?? 0) * ratio,
    };
  };

  const handleSubmit = () => {
    let item: FoodLogItem;
    if (mode === "pantry" && selectedProduct) {
      const grams = parseFloat(amountG) || 100;
      const calc = calcFromProduct(selectedProduct.product, grams);
      item = {
        name: selectedProduct.product.product_name,
        product: selectedProduct.product,
        quantity_g: grams,
        calories_kcal: calc.kcal,
        protein_g: calc.protein,
        fat_g: calc.fat,
        carbs_g: calc.carbs,
      };
    } else {
      if (!name || !kcal) return;
      item = {
        name,
        quantity_g: 100,
        calories_kcal: parseFloat(kcal) || 0,
        protein_g: parseFloat(protein) || 0,
        fat_g: parseFloat(fat) || 0,
        carbs_g: parseFloat(carbs) || 0,
      };
    }

    onAdd({
      date: todayISO(),
      meal,
      items: [item],
      total_kcal: item.calories_kcal,
      total_protein_g: item.protein_g,
      total_fat_g: item.fat_g,
      total_carbs_g: item.carbs_g,
    });
    onClose();
  };

  const grams = parseFloat(amountG) || 0;
  const preview = selectedProduct ? calcFromProduct(selectedProduct.product, grams) : null;

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 100 }}>
      <div className="sheet-overlay animate-fade-in" onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div
        className="relative animate-slide-up rounded-t-3xl overflow-hidden"
        style={{ background: "var(--bg-primary)", maxHeight: "90dvh", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="overflow-y-auto px-5 pt-2 pb-8 space-y-4" style={{ maxHeight: "85vh" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Přidat jídlo</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
              <X size={15} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {/* Meal type */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {MEALS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMeal(m.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: meal === m.id ? "var(--green-primary)" : "white",
                  color: meal === m.id ? "white" : "var(--text-secondary)",
                }}
              >
                <span>{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-2xl overflow-hidden" style={{ background: "var(--border)" }}>
            <button
              onClick={() => setMode("pantry")}
              className="flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
              style={{
                background: mode === "pantry" ? "var(--green-primary)" : "transparent",
                color: mode === "pantry" ? "white" : "var(--text-secondary)",
                borderRadius: "14px",
                margin: mode === "pantry" ? 2 : 0,
              }}
            >
              <Package size={14} /> Ze spižírny
            </button>
            <button
              onClick={() => setMode("manual")}
              className="flex-1 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: mode === "manual" ? "var(--green-primary)" : "transparent",
                color: mode === "manual" ? "white" : "var(--text-secondary)",
                borderRadius: "14px",
                margin: mode === "manual" ? 2 : 0,
              }}
            >
              Ručně
            </button>
          </div>

          {/* FROM PANTRY */}
          {mode === "pantry" && (
            <>
              {!selectedProduct ? (
                <>
                  <div style={{ position: "relative" }}>
                    <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Hledat ve spižírně..."
                      autoFocus
                      style={{ width: "100%", paddingLeft: 38, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 16, fontSize: 14, outline: "none", background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
                    />
                  </div>

                  {pantryItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Spižírna je prázdná</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Přidejte produkty nebo použijte ruční zadání</p>
                    </div>
                  ) : filteredPantry.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Nic nenalezeno</p>
                    </div>
                  ) : (
                    <div className="card overflow-hidden">
                      {filteredPantry.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedProduct(item)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
                          style={{ borderBottom: idx < filteredPantry.length - 1 ? "1px solid var(--border)" : "none" }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--green-light)" }}>
                            <Package size={16} style={{ color: "var(--green-primary)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                              {item.product.product_name}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              {item.product.calories_kcal ? `${item.product.calories_kcal} kcal/100g · ` : ""}
                              {item.quantity} {item.unit} doma
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Selected product */}
                  <div className="card p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--green-light)" }}>
                        <Package size={18} style={{ color: "var(--green-primary)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                          {selectedProduct.product.product_name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {selectedProduct.product.calories_kcal} kcal / 100g
                        </p>
                      </div>
                      <button onClick={() => setSelectedProduct(null)} className="text-xs" style={{ color: "var(--green-primary)" }}>
                        Změnit
                      </button>
                    </div>

                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>KOLIK JSI SNĚDL(A)?</p>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        value={amountG}
                        onChange={(e) => setAmountG(e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold outline-none text-center"
                        style={{ background: "var(--bg-primary)", border: "1.5px solid var(--green-primary)", color: "var(--text-primary)" }}
                      />
                      <span className="self-center text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                        {selectedProduct.product.unit === "ml" ? "ml" : "g"}
                      </span>
                    </div>

                    {/* Quick amounts */}
                    <div className="flex gap-2 mb-4">
                      {["50", "100", "150", "200", "300"].map((v) => (
                        <button
                          key={v}
                          onClick={() => setAmountG(v)}
                          className="flex-1 py-1.5 rounded-full text-xs font-medium transition-all"
                          style={{
                            background: amountG === v ? "var(--green-primary)" : "var(--bg-primary)",
                            color: amountG === v ? "white" : "var(--text-secondary)",
                          }}
                        >
                          {v}g
                        </button>
                      ))}
                    </div>

                    {/* Preview */}
                    {preview && grams > 0 && (
                      <div className="rounded-xl p-3" style={{ background: "var(--green-light)" }}>
                        <div className="flex justify-around">
                          <div className="text-center">
                            <p className="text-lg font-bold" style={{ color: "var(--green-dark)" }}>{Math.round(preview.kcal)}</p>
                            <p className="text-xs" style={{ color: "var(--green-dark)" }}>kcal</p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-bold" style={{ color: "var(--green-dark)" }}>{preview.protein.toFixed(1)}g</p>
                            <p className="text-xs" style={{ color: "var(--green-dark)" }}>bílk.</p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-bold" style={{ color: "var(--green-dark)" }}>{preview.carbs.toFixed(1)}g</p>
                            <p className="text-xs" style={{ color: "var(--green-dark)" }}>sach.</p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-bold" style={{ color: "var(--green-dark)" }}>{preview.fat.toFixed(1)}g</p>
                            <p className="text-xs" style={{ color: "var(--green-dark)" }}>tuky</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={handleSubmit} className="btn-primary" disabled={!selectedProduct || !amountG}>
                    <Plus size={18} /> Zaznamenat jídlo
                  </button>
                </>
              )}
            </>
          )}

          {/* MANUAL */}
          {mode === "manual" && (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Název jídla..."
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
              />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "kcal", label: "Kalorie (kcal)", set: setKcal, val: kcal, accent: true },
                  { key: "protein", label: "Bílkoviny (g)", set: setProtein, val: protein },
                  { key: "carbs", label: "Sacharidy (g)", set: setCarbs, val: carbs },
                  { key: "fat", label: "Tuky (g)", set: setFat, val: fat },
                ].map(({ key, label, set, val, accent }) => (
                  <div key={key}>
                    <p className="text-xs font-medium mb-1 ml-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none"
                      style={{
                        background: "white",
                        border: `1.5px solid ${accent ? "var(--green-primary)" : "var(--border)"}`,
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleSubmit} className="btn-primary" disabled={!name || !kcal}>
                <Plus size={18} /> Zaznamenat jídlo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function FoodLogView() {
  const { getTodayEntries, getTodayTotals, addEntry, removeEntry, goal } = useFoodLogStore();
  const [showModal, setShowModal] = useState(false);

  const todayEntries = getTodayEntries();
  const totals = getTodayTotals();
  const kcalPct = Math.min(100, (totals.kcal / goal.calories_kcal) * 100);

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="px-5 pt-2 pb-24 space-y-4">
        {/* Calorie ring */}
        <div className="card p-5">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="38" fill="none" stroke="var(--green-light)" strokeWidth="8" />
                <circle
                  cx="44" cy="44" r="38" fill="none"
                  stroke="var(--green-primary)" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 38}`}
                  strokeDashoffset={`${2 * Math.PI * 38 * (1 - kcalPct / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 44 44)"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>{Math.round(totals.kcal)}</p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>kcal</p>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              <MacroBar label="Bílkoviny" value={totals.protein} goal={goal.protein_g} color="#6B8F5E" />
              <MacroBar label="Sacharidy" value={totals.carbs} goal={goal.carbs_g} color="#E8B84B" />
              <MacroBar label="Tuky" value={totals.fat} goal={goal.fat_g} color="#E8845A" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Cíl: {goal.calories_kcal} kcal</span>
            <span className="text-xs font-semibold" style={{ color: "var(--green-primary)" }}>
              Zbývá: {Math.max(0, goal.calories_kcal - Math.round(totals.kcal))} kcal
            </span>
          </div>
        </div>

        {/* Meals */}
        {MEALS.map(({ id, label, emoji }) => {
          const mealEntries = todayEntries.filter((e) => e.meal === id);
          const mealKcal = mealEntries.reduce((s, e) => s + e.total_kcal, 0);

          return (
            <div key={id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{emoji}</span>
                  <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</span>
                </div>
                {mealKcal > 0 && (
                  <span className="text-xs font-bold" style={{ color: "var(--green-primary)" }}>{Math.round(mealKcal)} kcal</span>
                )}
              </div>

              {mealEntries.length > 0 ? (
                <div className="space-y-1.5">
                  {mealEntries.map((entry) =>
                    entry.items.map((item, i) => (
                      <div key={`${entry.id}-${i}`} className="flex justify-between items-center">
                        <div>
                          <span className="text-sm" style={{ color: "var(--text-primary)" }}>{item.name}</span>
                          {item.quantity_g && (
                            <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>({item.quantity_g}g)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{Math.round(item.calories_kcal)} kcal</span>
                          <button onClick={() => removeEntry(entry.id)}>
                            <X size={12} style={{ color: "var(--text-tertiary)" }} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Žádné záznamy</p>
              )}
            </div>
          );
        })}

        <button className="btn-primary w-full" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Přidat jídlo
        </button>
      </div>

      {showModal && <QuickLogModal onClose={() => setShowModal(false)} onAdd={addEntry} />}
    </div>
  );
}
