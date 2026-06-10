"use client";

import { useState } from "react";
import { X, Plus, Minus, Check, Trash2 } from "lucide-react";
import { ParsedItem } from "@/components/VoiceInput";

const UNITS = ["ks", "g", "kg", "ml", "l", "dkg", "balení", "lžíce", "lžička", "hrnek"];

const DEFAULT_CATEGORIES = [
  "Maso", "Ryby", "Mléčné výrobky", "Zelenina", "Ovoce",
  "Pekárenské výrobky", "Luštěniny", "Obiloviny", "Nápoje",
  "Omáčky a koření", "Sladkosti", "Mražené", "Konzervy", "Jiné",
];

interface ReviewItem extends ParsedItem {
  id: string;
  category: string;
}

interface Props {
  items: ParsedItem[];
  onConfirm: (items: ReviewItem[]) => void;
  onClose: () => void;
}

export function VoiceReviewModal({ items: initialItems, onConfirm, onClose }: Props) {
  const [items, setItems] = useState<ReviewItem[]>(
    initialItems.map((item, i) => ({
      ...item,
      id: `voice-${i}-${Date.now()}`,
      category: "Jiné",
    }))
  );

  const update = (id: string, changes: Partial<ReviewItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...changes } : item));
  };

  const remove = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleConfirm = () => {
    const valid = items.filter(i => i.name.trim().length > 0);
    if (valid.length > 0) onConfirm(valid);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }}
      />
      <div
        style={{
          position: "relative",
          background: "var(--bg-primary)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "88dvh",
          display: "flex",
          flexDirection: "column",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Zkontroluj položky
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              {items.length} {items.length === 1 ? "položka" : items.length < 5 ? "položky" : "položek"} — uprav a potvrď
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={15} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Položky */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{ background: "white", borderRadius: 16, padding: "14px 14px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1.5px solid var(--border)" }}
            >
              {/* Název */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <input
                  value={item.name}
                  onChange={e => update(item.id, { name: e.target.value })}
                  style={{
                    flex: 1, fontSize: 15, fontWeight: 700, color: "var(--text-primary)",
                    border: "none", outline: "none", background: "transparent",
                    borderBottom: "1.5px solid var(--border)", paddingBottom: 4,
                  }}
                  placeholder="Název produktu"
                />
                <button onClick={() => remove(item.id)} style={{ flexShrink: 0, padding: 4 }}>
                  <Trash2 size={15} style={{ color: "var(--text-tertiary)" }} />
                </button>
              </div>

              {/* Množství + jednotka */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-primary)", borderRadius: 12, padding: "6px 10px" }}>
                  <button onClick={() => update(item.id, { quantity: Math.max(0.5, item.quantity - 1) })}>
                    <Minus size={14} style={{ color: "var(--text-secondary)" }} />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e => update(item.id, { quantity: parseFloat(e.target.value) || 1 })}
                    style={{ width: 40, textAlign: "center", fontSize: 14, fontWeight: 700, border: "none", outline: "none", background: "transparent", color: "var(--text-primary)" }}
                  />
                  <button onClick={() => update(item.id, { quantity: item.quantity + 1 })}>
                    <Plus size={14} style={{ color: "var(--text-secondary)" }} />
                  </button>
                </div>
                <select
                  value={item.unit}
                  onChange={e => update(item.id, { unit: e.target.value })}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 12, background: "var(--bg-primary)", border: "1.5px solid var(--border)", fontSize: 13, color: "var(--text-primary)", outline: "none" }}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              {/* Kategorie */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DEFAULT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => update(item.id, { category: cat })}
                    style={{
                      padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: item.category === cat ? "var(--green-primary)" : "var(--bg-primary)",
                      color: item.category === cat ? "white" : "var(--text-secondary)",
                      border: `1px solid ${item.category === cat ? "var(--green-primary)" : "var(--border)"}`,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "32px 0", fontSize: 14 }}>
              Všechny položky byly odebrány
            </p>
          )}
        </div>

        {/* Potvrdit */}
        <div style={{ padding: "14px 16px 4px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={handleConfirm}
            disabled={items.length === 0}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: items.length === 0 ? 0.4 : 1 }}
          >
            <Check size={17} /> Přidat {items.length > 0 ? `${items.length} ${items.length === 1 ? "položku" : items.length < 5 ? "položky" : "položek"}` : ""} do spižírny
          </button>
          <button onClick={onClose} className="btn-secondary">
            Zrušit
          </button>
        </div>
      </div>
    </div>
  );
}

export type { ReviewItem };
