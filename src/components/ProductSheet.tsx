"use client";

import { useState } from "react";
import { X, Plus, ShoppingCart, Utensils, Package, AlertCircle } from "lucide-react";
import { ProductInfo, StorageLocation } from "@/types";
import { usePantryStore } from "@/store/pantryStore";
import { usePriceStore } from "@/store/priceStore";

interface Props {
  product: ProductInfo;
  onClose: () => void;
}

const LOCATIONS: { id: StorageLocation; label: string; emoji: string }[] = [
  { id: "lednice", label: "Lednice", emoji: "🧊" },
  { id: "mrazak", label: "Mrazák", emoji: "❄️" },
  { id: "spiz", label: "Spíž", emoji: "🏠" },
  { id: "linka", label: "Linka", emoji: "🍳" },
];

const STORES = ["Lidl", "Albert", "Billa", "Kaufland", "Tesco", "Penny", "Rohlik", "Košík", "Jiný"];

export function ProductSheet({ product, onClose }: Props) {
  const addItem = usePantryStore((s) => s.addItem);
  const addRecord = usePriceStore((s) => s.addRecord);

  const [tab, setTab] = useState<"info" | "add">("info");
  const [qty, setQty] = useState(1);
  const [location, setLocation] = useState<StorageLocation>("lednice");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("Lidl");
  const [added, setAdded] = useState(false);

  const displayWeight = product.weight_g
    ? `${product.weight_g}g`
    : product.volume_ml
    ? `${product.volume_ml}ml`
    : product.pieces_count
    ? `${product.pieces_count} ks`
    : "";

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

  const kcal = product.calories_kcal;
  const macros = [
    { label: "Bílkoviny", value: product.protein_g, unit: "g", color: "#6B8F5E" },
    { label: "Sacharidy", value: product.carbs_g, unit: "g", color: "#E8B84B" },
    { label: "Tuky", value: product.fat_g, unit: "g", color: "#E8845A" },
    { label: "Vláknina", value: product.fiber_g, unit: "g", color: "#8FA8B8" },
  ];

  return (
    <div
      className="flex flex-col justify-end animate-fade-in"
      style={{ position: "fixed", inset: 0, zIndex: 200 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 sheet-overlay" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative animate-slide-up rounded-t-3xl flex flex-col"
        style={{
          background: "var(--bg-primary)",
          maxHeight: "92dvh",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-3 flex-shrink-0">
          <div className="flex-1 pr-4">
            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-tertiary)" }}>
              {product.brand} · EAN {product.ean_code}
            </p>
            <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
              {product.product_name}
            </h2>
            <div className="flex items-center gap-2 mt-1" style={{ flexWrap: "wrap" }}>
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
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--border)" }}
          >
            <X size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 gap-2 mb-3 flex-shrink-0">
          {(["info", "add"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: tab === t ? "var(--green-primary)" : "var(--border)",
                color: tab === t ? "white" : "var(--text-secondary)",
              }}
            >
              {t === "info" ? "Informace" : "Přidat do spižírny"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 pb-6" style={{ flex: "1 1 0", minHeight: 0 }}>
          {tab === "info" ? (
            <div className="space-y-4">
              {/* Calories big */}
              {kcal && (
                <div className="rounded-2xl p-4 text-center" style={{ background: "white" }}>
                  <p className="text-4xl font-bold" style={{ color: "var(--green-primary)" }}>{kcal}</p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>kcal / 100g</p>
                </div>
              )}

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

              {/* Add button */}
              <button
                onClick={handleAdd}
                className="btn-primary w-full"
                style={added ? { background: "#4A6B3F" } : {}}
              >
                {added ? (
                  <>✓ Přidáno do spižírny</>
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
