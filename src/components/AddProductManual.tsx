"use client";

import { useState } from "react";
import { X, Plus, ChevronDown } from "lucide-react";
import { ProductInfo, StorageLocation } from "@/types";
import { usePantryStore } from "@/store/pantryStore";
import { LedniceSVG, MrazakSVG, SpizSVG, SkrinskaSVG } from "@/components/LocationIcons";

interface Props {
  onClose: () => void;
}

const LOCATIONS: { id: StorageLocation; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: "lednice", label: "Lednice", Icon: LedniceSVG },
  { id: "mrazak", label: "Mrazák", Icon: MrazakSVG },
  { id: "spiz", label: "Spíž", Icon: SpizSVG },
  { id: "linka", label: "Skříňka", Icon: SkrinskaSVG },
];

const CATEGORIES = [
  "Maso", "Ryby", "Mléčné výrobky", "Zelenina", "Ovoce",
  "Pekárenské výrobky", "Luštěniny", "Obiloviny", "Nápoje",
  "Omáčky a koření", "Sladkosti", "Mražené", "Konzervy", "Jiné",
];

const STORES = ["Lidl", "Albert", "Billa", "Kaufland", "Tesco", "Penny", "Rohlik", "Košík", "Jiný"];

export function AddProductManual({ onClose }: Props) {
  const addItem = usePantryStore((s) => s.addItem);

  const [step, setStep] = useState<"basic" | "nutrition" | "pantry">("basic");
  const [added, setAdded] = useState(false);

  // Basic info
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("Jiné");
  const [weightG, setWeightG] = useState("");
  const [volumeMl, setVolumeMl] = useState("");
  const [pieces, setPieces] = useState("");
  const [unit, setUnit] = useState<"g" | "ml" | "ks">("g");

  // Nutrition
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [salt, setSalt] = useState("");

  // Pantry
  const [qty, setQty] = useState(1);
  const [location, setLocation] = useState<StorageLocation>("spiz");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("Lidl");
  const [expiryDays, setExpiryDays] = useState("");

  const canProceedBasic = name.trim().length > 0;

  const handleAdd = () => {
    const product: ProductInfo = {
      ean_code: `manual-${Date.now()}`,
      product_name: name.trim(),
      brand: brand.trim(),
      category,
      subcategory: "",
      image_url: "",
      weight_g: weightG ? parseFloat(weightG) : undefined,
      volume_ml: volumeMl ? parseFloat(volumeMl) : undefined,
      pieces_count: pieces ? parseFloat(pieces) : undefined,
      unit,
      calories_kcal: kcal ? parseFloat(kcal) : undefined,
      protein_g: protein ? parseFloat(protein) : undefined,
      carbs_g: carbs ? parseFloat(carbs) : undefined,
      fat_g: fat ? parseFloat(fat) : undefined,
      fiber_g: fiber ? parseFloat(fiber) : undefined,
      salt_g: salt ? parseFloat(salt) : undefined,
      allergens: [],
      typical_expiry_days: expiryDays ? parseInt(expiryDays) : undefined,
      source: "user_added",
      verified: false,
    };
    addItem(product, qty, location, price ? parseFloat(price) : undefined, store);
    setAdded(true);
    setTimeout(onClose, 1000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 100 }}>
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
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Přidat produkt ručně</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--border)" }}
          >
            <X size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex px-5 gap-2 mb-4">
          {(["basic", "nutrition", "pantry"] as const).map((s, i) => {
            const labels = ["Základní info", "Výživa", "Do spižírny"];
            const active = step === s;
            const done =
              (s === "basic" && (step === "nutrition" || step === "pantry")) ||
              (s === "nutrition" && step === "pantry");
            return (
              <button
                key={s}
                onClick={() => {
                  if (s === "basic") setStep("basic");
                  if (s === "nutrition" && canProceedBasic) setStep("nutrition");
                  if (s === "pantry" && canProceedBasic) setStep("pantry");
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
        <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: "65vh" }}>

          {/* ===== STEP: BASIC ===== */}
          {step === "basic" && (
            <div className="space-y-3">
              <div className="card p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>NÁZEV PRODUKTU *</p>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="např. Hovězí přední bez kosti"
                    className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-primary)", border: `1.5px solid ${name ? "var(--green-primary)" : "var(--border)"}`, color: "var(--text-primary)" }}
                    autoFocus
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>ZNAČKA</p>
                  <input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="např. Váhala"
                    className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="card p-4">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>KATEGORIE</p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: category === cat ? "var(--green-primary)" : "var(--bg-primary)",
                        color: category === cat ? "white" : "var(--text-secondary)",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity/unit */}
              <div className="card p-4">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>BALENÍ</p>
                <div className="flex gap-2 mb-2">
                  {(["g", "ml", "ks"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className="flex-1 py-2 rounded-full text-sm font-semibold transition-all"
                      style={{
                        background: unit === u ? "var(--green-primary)" : "var(--bg-primary)",
                        color: unit === u ? "white" : "var(--text-secondary)",
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={unit === "g" ? weightG : unit === "ml" ? volumeMl : pieces}
                  onChange={(e) => {
                    if (unit === "g") setWeightG(e.target.value);
                    else if (unit === "ml") setVolumeMl(e.target.value);
                    else setPieces(e.target.value);
                  }}
                  placeholder={unit === "g" ? "např. 350" : unit === "ml" ? "např. 500" : "např. 6"}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              <button
                onClick={() => setStep("nutrition")}
                className="btn-primary"
                disabled={!canProceedBasic}
              >
                Dál — Výživa
              </button>
              <button
                onClick={() => setStep("pantry")}
                className="btn-secondary"
                style={{ marginTop: 8 }}
                disabled={!canProceedBasic}
              >
                Přeskočit na spižírnu
              </button>
            </div>
          )}

          {/* ===== STEP: NUTRITION ===== */}
          {step === "nutrition" && (
            <div className="space-y-3">
              <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>Hodnoty na 100g / 100ml (volitelné)</p>
              <div className="card p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Kalorie (kcal)", val: kcal, set: setKcal, accent: true },
                    { label: "Bílkoviny (g)", val: protein, set: setProtein },
                    { label: "Sacharidy (g)", val: carbs, set: setCarbs },
                    { label: "Tuky (g)", val: fat, set: setFat },
                    { label: "Vláknina (g)", val: fiber, set: setFiber },
                    { label: "Sůl (g)", val: salt, set: setSalt },
                  ].map(({ label, val, set, accent }) => (
                    <div key={label}>
                      <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{
                          background: "var(--bg-primary)",
                          border: `1.5px solid ${accent ? "var(--green-primary)" : "var(--border)"}`,
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep("pantry")} className="btn-primary">
                Dál — Do spižírny
              </button>
              <button onClick={() => setStep("basic")} className="btn-secondary" style={{ marginTop: 8 }}>
                Zpět
              </button>
            </div>
          )}

          {/* ===== STEP: PANTRY ===== */}
          {step === "pantry" && (
            <div className="space-y-3">
              {/* Quantity */}
              <div className="card p-4">
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>MNOŽSTVÍ</p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-light"
                    style={{ background: "var(--bg-primary)" }}
                  >−</button>
                  <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ background: "var(--green-primary)", color: "white" }}
                  >+</button>
                </div>
              </div>

              {/* Location */}
              <div className="card p-4">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>UMÍSTĚNÍ</p>
                <div className="grid grid-cols-2 gap-2">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setLocation(loc.id)}
                      className="flex items-center gap-2 p-2.5 rounded-xl transition-all"
                      style={{
                        background: location === loc.id ? "var(--green-light)" : "var(--bg-primary)",
                        border: `1.5px solid ${location === loc.id ? "var(--green-primary)" : "transparent"}`,
                      }}
                    >
                      <loc.Icon size={22} />
                      <span className="text-sm font-medium" style={{ color: location === loc.id ? "var(--green-dark)" : "var(--text-primary)" }}>
                        {loc.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry */}
              <div className="card p-4">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>EXPIRUJE ZA (DNÍ)</p>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  placeholder="např. 7"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              {/* Price */}
              <div className="card p-4">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>CENA (volitelné)</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00 CZK"
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STORES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStore(s)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: store === s ? "var(--green-primary)" : "var(--bg-primary)",
                        color: store === s ? "white" : "var(--text-secondary)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                className="btn-primary"
                style={added ? { background: "#4A6B3F" } : {}}
              >
                {added ? "✓ Přidáno!" : <><Plus size={18} /> Přidat do spižírny</>}
              </button>
              <button onClick={() => setStep("nutrition")} className="btn-secondary" style={{ marginTop: 8 }}>
                Zpět
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
