"use client";

import { useState, useMemo } from "react";
import { X, Plus, AlertCircle, Pencil, ChevronLeft } from "lucide-react";
import { ProductInfo, StorageLocation } from "@/types";
import { usePantryStore } from "@/store/pantryStore";
import { usePriceStore } from "@/store/priceStore";

interface Props {
  product: ProductInfo;
  onClose: () => void;
  fromScanner?: boolean;
}

const LOCATIONS: { id: StorageLocation; label: string; emoji: string }[] = [
  { id: "lednice", label: "Lednice", emoji: "🧊" },
  { id: "mrazak", label: "Mrazák", emoji: "❄️" },
  { id: "spiz", label: "Spíž", emoji: "🏠" },
  { id: "linka", label: "Skříňka", emoji: "🗄️" },
];

const STORES = ["Lidl", "Albert", "Billa", "Kaufland", "Tesco", "Penny", "Rohlik", "Košík", "Jiný"];

export function ProductSheet({ product, onClose, fromScanner = false }: Props) {
  const addItem = usePantryStore((s) => s.addItem);
  const updateItem = usePantryStore((s) => s.updateItem);
  const pantryItems = usePantryStore((s) => s.items);
  const addRecord = usePriceStore((s) => s.addRecord);
  const allPriceRecords = usePriceStore((s) => s.records);
  const priceRecords = useMemo(
    () => allPriceRecords.filter((r) => r.ean_code === product.ean_code).sort((a, b) => b.date.localeCompare(a.date)),
    [allPriceRecords, product.ean_code]
  );

  // Najdi existující položky ve spižírně podle EAN
  const existingItems = pantryItems.filter((i) => i.product.ean_code === product.ean_code);

  const [tab, setTab] = useState<"info" | "add">("info");
  const [qty, setQty] = useState(1);
  const [location, setLocation] = useState<StorageLocation>(existingItems[0]?.location ?? "lednice");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("Lidl");
  const [added, setAdded] = useState(false);
  const [addedToExisting, setAddedToExisting] = useState(false);
  const [editingNutrition, setEditingNutrition] = useState(false);
  const [manualKcal, setManualKcal] = useState(product.calories_kcal?.toString() ?? "");
  const [manualProtein, setManualProtein] = useState(product.protein_g?.toString() ?? "");
  const [manualCarbs, setManualCarbs] = useState(product.carbs_g?.toString() ?? "");
  const [manualFat, setManualFat] = useState(product.fat_g?.toString() ?? "");

  const displayWeight = product.weight_g
    ? product.weight_g >= 1000 ? `${(product.weight_g / 1000).toFixed(product.weight_g % 1000 === 0 ? 0 : 1)}kg` : `${product.weight_g}g`
    : product.volume_ml
    ? product.volume_ml >= 1000 ? `${(product.volume_ml / 1000).toFixed(product.volume_ml % 1000 === 0 ? 0 : 1)}l` : `${product.volume_ml}ml`
    : product.pieces_count
    ? `${product.pieces_count} ks`
    : "";

  // Přidá qty k množství první existující položky
  const handleAddToExisting = () => {
    const first = existingItems[0];
    updateItem(first.id, { quantity: first.quantity + qty });
    setAddedToExisting(true);
    setTimeout(onClose, 1200);
  };

  const handleAdd = () => {
    addItem(product, qty, location, price ? parseFloat(price) : undefined, store);
    if (price) {
      addRecord({
        ean_code: product.ean_code,
        price: parseFloat(price),
        price_per_kg: product.weight_g ? (parseFloat(price) / product.weight_g) * 1000 : undefined,
        store,
        date: new Date().toISOString().split("T")[0],
      });
    }
    setAdded(true);
    setTimeout(onClose, 1200);
  };

  const kcal = parseFloat(manualKcal) || product.calories_kcal;
  const macros = [
    { label: "Bílkoviny", value: parseFloat(manualProtein) || product.protein_g, unit: "g", color: "#6B8F5E" },
    { label: "Sacharidy", value: parseFloat(manualCarbs) || product.carbs_g, unit: "g", color: "#E8B84B" },
    { label: "Tuky", value: parseFloat(manualFat) || product.fat_g, unit: "g", color: "#E8845A" },
    { label: "Vláknina", value: product.fiber_g, unit: "g", color: "#8FA8B8" },
  ];
  const hasNutrition = !!kcal || macros.some(m => m.value !== undefined);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
    >
      {/* Backdrop */}
      <div
        className="sheet-overlay animate-fade-in"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />

      {/* Sheet */}
      <div
        className="animate-slide-up flex flex-col"
        style={fromScanner ? {
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background: "var(--bg-primary)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        } : {
          position: "relative",
          zIndex: 1,
          background: "var(--bg-primary)",
          maxHeight: "85dvh",
          borderRadius: "28px 28px 0 0",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-2 pb-3 flex-shrink-0">
          {/* Product image */}
          {product.image_url ? (
            <div
              className="flex-shrink-0 rounded-2xl overflow-hidden"
              style={{ width: 72, height: 72, background: "white", border: "1px solid var(--border)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image_url}
                alt={product.product_name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          ) : (
            <div
              className="flex-shrink-0 rounded-2xl flex items-center justify-center"
              style={{ width: 72, height: 72, background: "var(--border)", fontSize: 28 }}
            >
              🛒
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-tertiary)" }}>
              {product.brand}{product.brand && " · "}EAN {product.ean_code}
            </p>
            <h2 className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
              {product.product_name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1" style={{ flexWrap: "wrap" }}>
              {displayWeight && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--green-light)", color: "var(--green-dark)" }}>
                  {displayWeight}
                </span>
              )}
              {product.category && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>
                  {product.category}
                </span>
              )}
            </div>
          </div>

          {fromScanner ? (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0"
              style={{ background: "var(--border)", color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={15} /> Kamera
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--border)" }}
            >
              <X size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex px-5 gap-2 mb-3 flex-shrink-0">
          <button
            onClick={() => setTab("info")}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: tab === "info" ? "var(--green-primary)" : "var(--border)",
              color: tab === "info" ? "white" : "var(--text-secondary)",
            }}
          >
            Informace
          </button>
          <button
            onClick={() => setTab("add")}
            className="flex-1 py-2.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: tab === "add" ? "var(--green-primary)" : "var(--green-light)",
              color: tab === "add" ? "white" : "var(--green-dark)",
              border: `2px solid ${tab === "add" ? "var(--green-primary)" : "var(--green-primary)"}`,
            }}
          >
            + Přidat do spižírny
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 pb-6" style={{ flex: "1 1 0", minHeight: 0 }}>
          {tab === "info" ? (
            <div className="space-y-4">
              {/* Chybí data — formulář pro ruční zadání */}
              {!hasNutrition || editingNutrition ? (
                <div className="rounded-2xl p-4 space-y-3" style={{ background: "white" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {editingNutrition ? "Upravit výživové hodnoty" : "Výrobce data neposkytl"}
                    </p>
                    {editingNutrition && (
                      <button onClick={() => setEditingNutrition(false)} style={{ color: "var(--text-tertiary)", fontSize: 13 }}>Zrušit</button>
                    )}
                  </div>
                  {!editingNutrition && (
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Zadej hodnoty ručně ze štítku produktu (na 100g/ml).</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Kalorie (kcal)", val: manualKcal, set: setManualKcal, accent: true },
                      { label: "Bílkoviny (g)", val: manualProtein, set: setManualProtein },
                      { label: "Sacharidy (g)", val: manualCarbs, set: setManualCarbs },
                      { label: "Tuky (g)", val: manualFat, set: setManualFat },
                    ].map(({ label, val, set, accent }) => (
                      <div key={label}>
                        <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl text-sm font-semibold outline-none text-center"
                          style={{
                            background: "var(--bg-primary)",
                            border: `1.5px solid ${accent ? "var(--green-primary)" : "var(--border)"}`,
                            color: "var(--text-primary)",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  {editingNutrition && (
                    <button onClick={() => setEditingNutrition(false)} className="btn-primary w-full" style={{ fontSize: 14 }}>
                      Uložit
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Calories big */}
                  <div className="rounded-2xl p-4 text-center" style={{ background: "white" }}>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-4xl font-bold" style={{ color: "var(--green-primary)" }}>{Math.round(kcal!)}</p>
                      <button onClick={() => setEditingNutrition(true)} style={{ color: "var(--text-tertiary)", marginTop: 4 }}>
                        <Pencil size={14} />
                      </button>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>kcal / 100g</p>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-2 gap-3">
                    {macros.filter(m => m.value !== undefined).map((m) => (
                      <div key={m.label} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: "white" }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: m.color + "20" }}>
                          <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.label}</p>
                          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                            {m.value?.toFixed(1)}{m.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Allergens */}
              {product.allergens.length > 0 && (
                <div className="rounded-2xl p-3" style={{ background: "#FEF3E2" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={14} style={{ color: "#B85C00" }} />
                    <p className="text-xs font-semibold" style={{ color: "#B85C00" }}>Alergeny</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.allergens.map((a) => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FCDCB0", color: "#B85C00" }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price history */}
              {priceRecords.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: "white" }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>HISTORIE CEN</p>
                  {/* Best price */}
                  {(() => {
                    const best = priceRecords.reduce((b, r) => r.price < b.price ? r : b);
                    return (
                      <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-2" style={{ background: "var(--green-light)" }}>
                        <div>
                          <p className="text-xs font-medium" style={{ color: "var(--green-dark)" }}>Nejlepší cena</p>
                          <p className="text-sm font-bold" style={{ color: "var(--green-dark)" }}>{best.store}</p>
                        </div>
                        <p className="text-xl font-bold" style={{ color: "var(--green-primary)" }}>{best.price} Kč</p>
                      </div>
                    );
                  })()}
                  {/* Last 3 records */}
                  <div className="space-y-1.5 mt-2">
                    {priceRecords.slice(0, 3).map((r, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.store}</span>
                          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{r.date}</span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.price} Kč</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source */}
              <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
                Zdroj: {product.source === "open_food_facts" ? "Open Food Facts" : product.source === "czech_db" ? "Česká databáze" : "Uživatelský vstup"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quantity */}
              <div className="rounded-2xl p-4" style={{ background: "white" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>MNOŽSTVÍ</p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-light"
                    style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  >−</button>
                  <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{qty}</span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-light"
                    style={{ background: "var(--green-primary)", color: "white" }}
                  >+</button>
                </div>
                <p className="text-xs text-center mt-2" style={{ color: "var(--text-tertiary)" }}>
                  {qty > 1 ? `${qty}x ${displayWeight}` : displayWeight}
                </p>
              </div>

              {/* Location */}
              <div className="rounded-2xl p-4" style={{ background: "white" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>UMÍSTĚNÍ</p>
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
                      <span>{loc.emoji}</span>
                      <span className="text-sm font-medium" style={{ color: location === loc.id ? "var(--green-dark)" : "var(--text-primary)" }}>
                        {loc.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="rounded-2xl p-4" style={{ background: "white" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>CENA (volitelné)</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm font-medium outline-none"
                    style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}
                  />
                  <span className="self-center text-sm font-medium" style={{ color: "var(--text-secondary)" }}>CZK</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {STORES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStore(s)}
                      className="px-2 py-1 rounded-full text-xs font-medium transition-all"
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

              {/* Existující položka ve spižírně */}
              {existingItems.length > 0 && !added && !addedToExisting && (
                <div className="rounded-2xl p-4" style={{ background: "var(--green-light)", border: "1.5px solid var(--green-primary)" }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--green-dark)" }}>
                    Už máš ve spižírně
                  </p>
                  <p className="text-xs mb-3" style={{ color: "var(--green-dark)" }}>
                    {existingItems.map((i) => `${i.quantity}× v ${LOCATIONS.find(l => l.id === i.location)?.label ?? i.location}`).join(", ")}
                  </p>
                  <button
                    onClick={handleAddToExisting}
                    className="btn-primary"
                    style={{ background: "var(--green-primary)", fontSize: 14, padding: "10px 16px" }}
                  >
                    <Plus size={16} /> Přičíst {qty}× k existujícímu
                  </button>
                </div>
              )}

              {/* Add button */}
              <button
                onClick={handleAdd}
                className="btn-primary w-full"
                style={added || addedToExisting ? { background: "#4A6B3F" } : existingItems.length > 0 ? { background: "var(--border)", color: "var(--text-secondary)" } : {}}
              >
                {added || addedToExisting ? (
                  <>✓ Hotovo</>
                ) : existingItems.length > 0 ? (
                  <><Plus size={18} /> Přidat jako nový záznam</>
                ) : (
                  <><Plus size={18} /> Přidat do spižírny</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
