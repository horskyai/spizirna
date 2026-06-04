"use client";

import { useState, useMemo } from "react";
import { Plus, Check, ShoppingCart, X, LayoutList, Tag, Share2 } from "lucide-react";
import { useShoppingStore } from "@/store/shoppingStore";

const CATEGORIES = [
  { id: "ovoce-zelenina", label: "Ovoce a zelenina", emoji: "🥦" },
  { id: "maso-ryby", label: "Maso a ryby", emoji: "🥩" },
  { id: "mlecne", label: "Mléčné výrobky", emoji: "🧀" },
  { id: "pecivo", label: "Pečivo", emoji: "🍞" },
  { id: "suche", label: "Suché potraviny", emoji: "🌾" },
  { id: "napoje", label: "Nápoje", emoji: "🥤" },
  { id: "mrazene", label: "Mražené", emoji: "❄️" },
  { id: "ostatni", label: "Ostatní", emoji: "🛒" },
];

function AddItemModal({ onClose }: { onClose: () => void }) {
  const addItem = useShoppingStore((s) => s.addItem);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("ks");
  const [category, setCategory] = useState("ostatni");

  const units = ["ks", "g", "kg", "ml", "l", "balení"];

  const handleAdd = () => {
    if (!name.trim()) return;
    addItem({ name: name.trim(), quantity: parseFloat(quantity) || 1, unit, category });
    setName("");
    setQuantity("1");
  };

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
        <div className="overflow-y-auto px-5 pt-2 pb-8 space-y-3">
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
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{ flex: 1, background: "white", border: "1.5px solid var(--border)", borderRadius: 12, padding: "8px 12px", fontSize: 14, fontWeight: 600, outline: "none", color: "var(--text-primary)" }}
            >
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Kategorie */}
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>KATEGORIE</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  background: category === cat.id ? "var(--green-light)" : "white",
                  border: `1.5px solid ${category === cat.id ? "var(--green-primary)" : "var(--border)"}`,
                  color: category === cat.id ? "var(--green-dark)" : "var(--text-primary)",
                }}
              >
                <span>{cat.emoji}</span> {cat.label}
              </button>
            ))}
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
  const [groupBy, setGroupBy] = useState<"recipe" | "category">("category");

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const byRecipe = useMemo(() => unchecked.reduce<Record<string, typeof unchecked>>((acc, item) => {
    const key = item.recipe_name || "Ostatní";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {}), [unchecked]);

  const byCategory = useMemo(() => {
    const order = CATEGORIES.map((c) => c.id);
    const grouped = unchecked.reduce<Record<string, typeof unchecked>>((acc, item) => {
      const key = item.category || "ostatni";
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
    // Sort by category order
    return Object.fromEntries(
      order.filter((k) => grouped[k]).map((k) => [k, grouped[k]])
    );
  }, [unchecked]);

  const shareList = () => {
    const lines: string[] = ["🛒 Nákupní seznam ze Spižírny\n"];
    const grouped = groupBy === "category" ? byCategory : byRecipe;
    Object.entries(grouped).forEach(([key, groupItems]) => {
      const cat = CATEGORIES.find((c) => c.id === key);
      const label = groupBy === "category" ? (cat ? `${cat.emoji} ${cat.label}` : key) : `📖 ${key}`;
      lines.push(label);
      groupItems.forEach((i) => lines.push(`  • ${i.name} — ${i.quantity} ${i.unit}`));
      lines.push("");
    });
    const text = lines.join("\n");
    if (navigator.share) {
      navigator.share({ title: "Nákupní seznam", text });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

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
        {/* Summary + grouping toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            {unchecked.length} položek zbývá
          </p>
          <div className="flex rounded-xl overflow-hidden" style={{ background: "var(--border)" }}>
            <button
              onClick={() => setGroupBy("category")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-all"
              style={{ background: groupBy === "category" ? "var(--green-primary)" : "transparent", color: groupBy === "category" ? "white" : "var(--text-secondary)", borderRadius: 10, margin: groupBy === "category" ? 2 : 0 }}
            >
              <Tag size={12} /> Kategorie
            </button>
            <button
              onClick={() => setGroupBy("recipe")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-all"
              style={{ background: groupBy === "recipe" ? "var(--green-primary)" : "transparent", color: groupBy === "recipe" ? "white" : "var(--text-secondary)", borderRadius: 10, margin: groupBy === "recipe" ? 2 : 0 }}
            >
              <LayoutList size={12} /> Recept
            </button>
          </div>
        </div>

        {checked.length > 0 && (
          <button onClick={removeChecked} className="text-xs font-semibold px-3 py-1.5 rounded-full self-start" style={{ background: "#FDE8E8", color: "#C0392B" }}>
            Odebrat hotové ({checked.length})
          </button>
        )}

        {/* Grouped items */}
        {Object.entries(groupBy === "category" ? byCategory : byRecipe).map(([key, groupItems]) => {
          const cat = CATEGORIES.find((c) => c.id === key);
          const label = groupBy === "category" ? (cat ? `${cat.emoji} ${cat.label}` : key) : key;
          return (
            <div key={key}>
              <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>
                {label}
              </p>
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
          );
        })}

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

        {/* Add more + share */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "white", color: "var(--text-secondary)", border: "1.5px dashed var(--border)" }}
          >
            <Plus size={16} /> Přidat položku
          </button>
          {unchecked.length > 0 && (
            <button
              onClick={shareList}
              className="py-3 px-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--green-light)", color: "var(--green-dark)", border: "1.5px solid var(--green-primary)" }}
            >
              <Share2 size={16} /> Sdílet
            </button>
          )}
        </div>

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
