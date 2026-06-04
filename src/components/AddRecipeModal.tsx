"use client";

import { useState } from "react";
import { X, Plus, Trash2, Link, Link2Off, Search, Package } from "lucide-react";
import { useRecipeStore } from "@/store/recipeStore";
import { usePantryStore } from "@/store/pantryStore";
import { RecipeIngredient } from "@/types";

interface Props {
  onClose: () => void;
}

const UNITS = ["g", "kg", "ml", "l", "ks", "lžíce", "lžička", "hrnek", "stroužky", "větvičky"];
const TAGS_PRESET = ["rychlé", "zdravé", "vegetariánské", "veganské", "bezlepkové", "česká kuchyně", "asijské", "polévka", "snídaně", "oběd", "večeře"];

const EMPTY_ING: RecipeIngredient = { name: "", quantity: 0, unit: "g" };

// Picker — vybere produkt ze spižírny a propojí ho se surovinou
function PantryPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (productName: string, ean: string, unit: string) => void;
  onClose: () => void;
}) {
  const pantryItems = usePantryStore((s) => s.items);
  const [search, setSearch] = useState("");

  const filtered = pantryItems.filter((i) =>
    i.product.product_name.toLowerCase().includes(search.toLowerCase()) ||
    i.product.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 150 }}>
      <div className="sheet-overlay animate-fade-in" onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div
        className="relative animate-slide-up rounded-t-3xl overflow-hidden"
        style={{ background: "var(--bg-primary)", maxHeight: "92dvh", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="px-5 pt-2 pb-6 flex flex-col gap-3" style={{ height: "100%" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Vybrat ze spižírny</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
              <X size={15} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat produkt..."
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          <div className="overflow-y-auto flex-1">
            {pantryItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Spižírna je prázdná</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Přidejte produkty do spižírny nejdřív</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Nic nenalezeno</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                {filtered.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(
                        item.product.product_name,
                        item.product.ean_code,
                        item.product.unit
                      );
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
                    style={{
                      borderBottom: idx < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--green-light)" }}
                    >
                      <Package size={16} style={{ color: "var(--green-primary)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {item.product.product_name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {item.product.brand && `${item.product.brand} · `}
                        {item.quantity} {item.unit} doma
                        {item.product.calories_kcal ? ` · ${item.product.calories_kcal} kcal/100g` : ""}
                      </p>
                    </div>
                    <Link size={14} style={{ color: "var(--green-primary)", flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddRecipeModal({ onClose }: Props) {
  const addRecipe = useRecipeStore((s) => s.addRecipe);

  const [step, setStep] = useState<"basic" | "ingredients" | "instructions">("basic");

  // Basic
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  // Nutrition
  const [kcalPerServing, setKcalPerServing] = useState("");
  const [proteinPerServing, setProteinPerServing] = useState("");
  const [carbsPerServing, setCarbsPerServing] = useState("");
  const [fatPerServing, setFatPerServing] = useState("");

  // Ingredients
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([{ ...EMPTY_ING }]);

  // Instructions
  const [instructions, setInstructions] = useState<string[]>(["", ""]);

  // Pantry picker state
  const [pickerForIdx, setPickerForIdx] = useState<number | null>(null);

  const canProceedBasic = name.trim().length > 0;
  const canProceedIngredients = ingredients.some((i) => i.name.trim().length > 0);

  const addIngredient = () => setIngredients((prev) => [...prev, { ...EMPTY_ING }]);
  const removeIngredient = (idx: number) => setIngredients((prev) => prev.filter((_, i) => i !== idx));
  const updateIngredient = (idx: number, field: keyof RecipeIngredient, value: string | number) =>
    setIngredients((prev) => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));

  const linkToPantry = (idx: number, productName: string, ean: string, unit: string) => {
    setIngredients((prev) =>
      prev.map((ing, i) =>
        i === idx
          ? {
              ...ing,
              name: ing.name || productName, // pokud ještě nemá název, doplníme
              linked_product_name: productName,
              linked_ean: ean,
              unit: ing.unit || unit,
            }
          : ing
      )
    );
  };

  const unlinkFromPantry = (idx: number) => {
    setIngredients((prev) =>
      prev.map((ing, i) =>
        i === idx ? { ...ing, linked_product_name: undefined, linked_ean: undefined } : ing
      )
    );
  };

  const addInstruction = () => setInstructions((prev) => [...prev, ""]);
  const removeInstruction = (idx: number) => setInstructions((prev) => prev.filter((_, i) => i !== idx));
  const updateInstruction = (idx: number, value: string) =>
    setInstructions((prev) => prev.map((ins, i) => i === idx ? value : ins));

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleSave = () => {
    const cleanIngredients = ingredients.filter((i) => i.name.trim());
    const cleanInstructions = instructions.filter((i) => i.trim());
    if (!name.trim() || cleanIngredients.length === 0 || cleanInstructions.length === 0) return;

    addRecipe({
      name: name.trim(),
      description: description.trim(),
      servings,
      prep_time_min: parseInt(prepTime) || 0,
      cook_time_min: parseInt(cookTime) || 0,
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
      tags: selectedTags,
      image_url: "",
      calories_per_serving: kcalPerServing ? parseFloat(kcalPerServing) : undefined,
      protein_per_serving: proteinPerServing ? parseFloat(proteinPerServing) : undefined,
      carbs_per_serving: carbsPerServing ? parseFloat(carbsPerServing) : undefined,
      fat_per_serving: fatPerServing ? parseFloat(fatPerServing) : undefined,
    });
    onClose();
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 200 }}>
        <div className="sheet-overlay animate-fade-in" onClick={onClose} style={{ position: "absolute", inset: 0 }} />
        <div
          className="relative animate-slide-up rounded-t-3xl overflow-hidden"
          style={{ background: "var(--bg-primary)", maxHeight: "92dvh", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-2 pb-3">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Nový recept</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
              <X size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {/* Step tabs */}
          <div className="flex px-5 gap-2 mb-3">
            {(["basic", "ingredients", "instructions"] as const).map((s, i) => {
              const labels = ["Základní", "Suroviny", "Postup"];
              const active = step === s;
              const done = (s === "basic" && step !== "basic") || (s === "ingredients" && step === "instructions");
              return (
                <button
                  key={s}
                  onClick={() => {
                    if (s === "basic") setStep("basic");
                    if (s === "ingredients" && canProceedBasic) setStep("ingredients");
                    if (s === "instructions" && canProceedBasic && canProceedIngredients) setStep("instructions");
                  }}
                  className="flex-1 py-2 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: active ? "var(--green-primary)" : done ? "var(--green-light)" : "var(--border)",
                    color: active ? "white" : done ? "var(--green-dark)" : "var(--text-tertiary)",
                  }}
                >
                  {done ? "✓ " : `${i + 1}. `}{labels[i]}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-5 pb-10" style={{ maxHeight: "72vh" }}>

            {/* ===== BASIC ===== */}
            {step === "basic" && (
              <div className="space-y-3">
                <div className="card p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>NÁZEV RECEPTU *</p>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="např. Hovězí guláš"
                      autoFocus
                      className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                      style={{ background: "var(--bg-primary)", border: `1.5px solid ${name ? "var(--green-primary)" : "var(--border)"}`, color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>POPIS</p>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Krátký popis receptu..."
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                      style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)", fontFamily: "inherit" }}
                    />
                  </div>
                </div>

                <div className="card p-4">
                  <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>PORCE A ČAS</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Porcí", value: String(servings), set: (v: string) => setServings(parseInt(v) || 1), unit: "ks" },
                      { label: "Příprava", value: prepTime, set: setPrepTime, unit: "min" },
                      { label: "Vaření", value: cookTime, set: setCookTime, unit: "min" },
                    ].map(({ label, value, set, unit }) => (
                      <div key={label}>
                        <p className="text-xs text-center mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          className="w-full px-2 py-2.5 rounded-xl text-sm outline-none text-center font-semibold"
                          style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
                        />
                        <p className="text-xs text-center mt-0.5" style={{ color: "var(--text-tertiary)" }}>{unit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-4">
                  <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>VÝŽIVA NA PORCI (volitelné)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Kalorie (kcal)", val: kcalPerServing, set: setKcalPerServing, accent: true },
                      { label: "Bílkoviny (g)", val: proteinPerServing, set: setProteinPerServing },
                      { label: "Sacharidy (g)", val: carbsPerServing, set: setCarbsPerServing },
                      { label: "Tuky (g)", val: fatPerServing, set: setFatPerServing },
                    ].map(({ label, val, set, accent }) => (
                      <div key={label}>
                        <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: "var(--bg-primary)", border: `1.5px solid ${accent ? "var(--green-primary)" : "var(--border)"}`, color: "var(--text-primary)" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>ŠTÍTKY</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {TAGS_PRESET.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: selectedTags.includes(tag) ? "var(--green-primary)" : "var(--bg-primary)",
                          color: selectedTags.includes(tag) ? "white" : "var(--text-secondary)",
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && customTag.trim()) { toggleTag(customTag.trim()); setCustomTag(""); } }}
                      placeholder="Vlastní štítek..."
                      className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                      style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
                    />
                    <button
                      onClick={() => { if (customTag.trim()) { toggleTag(customTag.trim()); setCustomTag(""); } }}
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: "var(--green-primary)", color: "white" }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button onClick={() => setStep("ingredients")} className="btn-primary" disabled={!canProceedBasic}>
                  Dál — Suroviny
                </button>
              </div>
            )}

            {/* ===== INGREDIENTS ===== */}
            {step === "ingredients" && (
              <div className="space-y-3">
                <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
                  Propojte suroviny se spižírnou pro přesné sledování
                </p>

                {ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="card p-3"
                    style={{ border: ing.linked_product_name ? "1.5px solid var(--green-primary)" : "none" }}
                  >
                    {/* Propojení badge */}
                    {ing.linked_product_name && (
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-1.5">
                          <Link size={11} style={{ color: "var(--green-primary)" }} />
                          <span className="text-xs font-semibold" style={{ color: "var(--green-primary)" }}>
                            Propojeno: {ing.linked_product_name}
                          </span>
                        </div>
                        <button
                          onClick={() => unlinkFromPantry(idx)}
                          className="text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <Link2Off size={12} />
                        </button>
                      </div>
                    )}

                    {/* Název + číslo + smazat */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: ing.linked_product_name ? "var(--green-primary)" : "var(--green-light)", color: ing.linked_product_name ? "white" : "var(--green-dark)" }}
                      >
                        {idx + 1}
                      </span>
                      <input
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                        placeholder="Název suroviny..."
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                        style={{
                          background: "var(--bg-primary)",
                          border: `1.5px solid ${ing.name ? "var(--green-primary)" : "var(--border)"}`,
                          color: "var(--text-primary)",
                        }}
                      />
                      {ingredients.length > 1 && (
                        <button onClick={() => removeIngredient(idx)}>
                          <Trash2 size={14} style={{ color: "var(--text-tertiary)" }} />
                        </button>
                      )}
                    </div>

                    {/* Množství + jednotky */}
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        value={ing.quantity || ""}
                        onChange={(e) => updateIngredient(idx, "quantity", parseFloat(e.target.value) || 0)}
                        placeholder="Množství"
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none text-center"
                        style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
                      />
                      <select
                        value={ing.unit}
                        onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                        style={{
                          background: "var(--green-light)",
                          color: "var(--green-dark)",
                          border: "1.5px solid var(--green-primary)",
                          borderRadius: 12,
                          padding: "8px 12px",
                          fontSize: 14,
                          fontWeight: 600,
                          outline: "none",
                          minWidth: 90,
                        }}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>

                    {/* Propojit se spižírnou */}
                    {!ing.linked_product_name ? (
                      <button
                        onClick={() => setPickerForIdx(idx)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                        style={{ background: "var(--green-light)", color: "var(--green-dark)" }}
                      >
                        <Link size={12} /> Propojit se spižírnou
                      </button>
                    ) : (
                      <button
                        onClick={() => setPickerForIdx(idx)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                        style={{ background: "var(--border)", color: "var(--text-secondary)" }}
                      >
                        <Link size={12} /> Změnit propojení
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={addIngredient}
                  className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: "white", color: "var(--green-primary)", border: "1.5px dashed var(--green-primary)" }}
                >
                  <Plus size={16} /> Přidat surovinu
                </button>

                <button onClick={() => setStep("instructions")} className="btn-primary" disabled={!canProceedIngredients}>
                  Dál — Postup vaření
                </button>
                <button onClick={() => setStep("basic")} className="btn-secondary" style={{ marginTop: 8 }}>Zpět</button>
              </div>
            )}

            {/* ===== INSTRUCTIONS ===== */}
            {step === "instructions" && (
              <div className="space-y-3">
                <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>Popište kroky vaření</p>

                {instructions.map((ins, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-2"
                      style={{ background: ins.trim() ? "var(--green-primary)" : "var(--border)", color: ins.trim() ? "white" : "var(--text-tertiary)" }}
                    >
                      {idx + 1}
                    </span>
                    <textarea
                      value={ins}
                      onChange={(e) => updateInstruction(idx, e.target.value)}
                      placeholder={`Krok ${idx + 1}...`}
                      rows={2}
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                      style={{
                        background: "white",
                        border: `1.5px solid ${ins.trim() ? "var(--green-primary)" : "var(--border)"}`,
                        color: "var(--text-primary)",
                        fontFamily: "inherit",
                      }}
                    />
                    {instructions.length > 1 && (
                      <button onClick={() => removeInstruction(idx)} className="mt-3">
                        <Trash2 size={14} style={{ color: "var(--text-tertiary)" }} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={addInstruction}
                  className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: "white", color: "var(--green-primary)", border: "1.5px dashed var(--green-primary)" }}
                >
                  <Plus size={16} /> Přidat krok
                </button>

                <button
                  onClick={handleSave}
                  className="btn-primary"
                  disabled={!canProceedBasic || !canProceedIngredients || !instructions.some((i) => i.trim())}
                >
                  Uložit recept
                </button>
                <button onClick={() => setStep("ingredients")} className="btn-secondary" style={{ marginTop: 8 }}>Zpět</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pantry picker */}
      {pickerForIdx !== null && (
        <PantryPickerModal
          onSelect={(productName, ean, unit) => linkToPantry(pickerForIdx, productName, ean, unit)}
          onClose={() => setPickerForIdx(null)}
        />
      )}
    </>
  );
}
