"use client";

import { useState } from "react";
import { Plus, Trash2, Check, ShoppingCart, X } from "lucide-react";
import { useShoppingStore } from "@/store/shoppingStore";

function AddItemModal({ onClose }: { onClose: () => void }) {
  const addItem = useShoppingStore((s) => s.addItem);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("ks");

  const units = ["ks", "g", "kg", "ml", "l", "balení"];

  const handleAdd = () => {
    if (!name.trim()) return;
    addItem({ name: name.trim(), quantity: parseFloat(quantity) || 1, unit });
    setName("");
    setQuantity("1");
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-end" style={{ zIndex: 60 }}>
      <div className="absolute inset-0 sheet-overlay" onClick={onClose} />
      <div
        className="relative animate-slide-up rounded-t-3xl overflow-hidden"
        style={{ background: "var(--bg-primary)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="px-5 pt-2 pb-8 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Přidat položku</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
              <X size={15} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { handleAdd(); } }}
            placeholder="Název produktu..."
            autoFocus
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />

          <div className="flex gap-2">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20 px-3 py-2.5 rounded-xl text-sm outline-none text-center font-semibold"
              style={{ background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
            />
            <div className="flex gap-1.5 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {units.map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className="flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: unit === u ? "var(--green-primary)" : "white",
                    color: unit === u ? "white" : "var(--text-secondary)",
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { handleAdd(); onClose(); }}
            className="btn-primary"
            disabled={!name.trim()}
          >
            <Plus size={18} /> Přidat
          </button>
        </div>
      </div>
    </div>
  );
}

export function ShoppingView() {
  const { items, toggleItem, removeItem, removeChecked, clearAll } = useShoppingStore();
  const [showAdd, setShowAdd] = useState(false);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  // Group unchecked by recipe
  const byRecipe = unchecked.reduce<Record<string, typeof unchecked>>((acc, item) => {
    const key = item.recipe_name || "Bez receptu";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  if (items.length === 0) {
    return (
      <div className="relative flex-1 flex flex-col items-center justify-center gap-5 p-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
          <ShoppingCart size={32} strokeWidth={1.5} style={{ color: "var(--green-primary)" }} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Seznam je prázdný</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Přidejte položky ručně nebo je přidejte z receptů.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={18} /> Přidat položku
        </button>
        {showAdd && <AddItemModal onClose={() => setShowAdd(false)} />}
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="px-5 pt-2 pb-24 space-y-4">
        {/* Summary bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            {unchecked.length} položek zbývá
          </p>
          {checked.length > 0 && (
            <button
              onClick={removeChecked}
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "#FDE8E8", color: "#C0392B" }}
            >
              Odebrat hotové ({checked.length})
            </button>
          )}
        </div>

        {/* Unchecked grouped by recipe */}
        {Object.entries(byRecipe).map(([recipeName, groupItems]) => (
          <div key={recipeName}>
            {recipeName !== "Bez receptu" && (
              <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>
                {recipeName}
              </p>
            )}
            <div className="card overflow-hidden">
              {groupItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3.5 transition-all"
                  style={{ borderBottom: idx < groupItems.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ borderColor: "var(--green-primary)", background: "transparent" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.quantity} {item.unit}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)}>
                    <X size={14} style={{ color: "var(--text-tertiary)" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Checked items */}
        {checked.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>
              Hotovo ({checked.length})
            </p>
            <div className="card overflow-hidden">
              {checked.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3.5 transition-all"
                  style={{ borderBottom: idx < checked.length - 1 ? "1px solid var(--border)" : "none", opacity: 0.5 }}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: "var(--green-primary)", border: "2px solid var(--green-primary)" }}
                  >
                    <Check size={12} color="white" strokeWidth={3} />
                  </button>
                  <p className="text-sm flex-1" style={{ color: "var(--text-secondary)", textDecoration: "line-through" }}>{item.name}</p>
                  <button onClick={() => removeItem(item.id)}>
                    <X size={14} style={{ color: "var(--text-tertiary)" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add more */}
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "white", color: "var(--text-secondary)", border: "1.5px dashed var(--border)" }}
        >
          <Plus size={16} /> Přidat položku
        </button>

        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="w-full py-2.5 rounded-2xl text-xs font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            Vymazat celý seznam
          </button>
        )}
      </div>

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
