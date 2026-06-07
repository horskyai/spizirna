"use client";

import { useState, useMemo } from "react";
import { Plus, Bell, BellOff, Check, Trash2, RefreshCw, ShoppingCart, ChevronDown, ChevronUp, X } from "lucide-react";
import { useRecurringStore, RecurringItem } from "@/store/recurringStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { usePantryStore } from "@/store/pantryStore";

const UNITS = ["ks", "g", "kg", "ml", "l", "balení", "lžíce", "hrnek"];
const INTERVALS = [
  { label: "Každý týden", days: 7 },
  { label: "Každé 2 týdny", days: 14 },
  { label: "Každý měsíc", days: 30 },
  { label: "Každé 2 měsíce", days: 60 },
  { label: "Každé 3 měsíce", days: 90 },
];

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function AddRecurringModal({ onClose }: { onClose: () => void }) {
  const addItem = useRecurringStore((s) => s.addItem);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("ks");
  const [intervalDays, setIntervalDays] = useState(7);
  const [store, setStore] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    addItem({
      name: name.trim(),
      quantity: parseFloat(quantity) || 1,
      unit,
      interval_days: intervalDays,
      last_purchased: new Date().toISOString(),
      store: store.trim() || undefined,
    });
    onClose();
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
        <div className="overflow-y-auto px-5 pt-2 pb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Opakující se nákup</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
              <X size={15} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          <div className="card p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>PRODUKT</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="např. Mléko, Káva, Chleba..."
                autoFocus
                className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-primary)", border: `1.5px solid ${name ? "var(--green-primary)" : "var(--border)"}`, color: "var(--text-primary)" }}
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>MNOŽSTVÍ</p>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-center font-semibold"
                  style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>JEDNOTKA</p>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 14, fontWeight: 600, outline: "none", color: "var(--text-primary)" }}
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>FREKVENCE</p>
              <div className="grid grid-cols-1 gap-2">
                {INTERVALS.map((iv) => (
                  <button
                    key={iv.days}
                    onClick={() => setIntervalDays(iv.days)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: intervalDays === iv.days ? "var(--green-light)" : "white",
                      border: `1.5px solid ${intervalDays === iv.days ? "var(--green-primary)" : "var(--border)"}`,
                      color: intervalDays === iv.days ? "var(--green-dark)" : "var(--text-primary)",
                    }}
                  >
                    <span>{iv.label}</span>
                    {intervalDays === iv.days && <Check size={14} style={{ color: "var(--green-primary)" }} />}
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Nebo vlastní počet dní:</p>
                  <input
                    type="number"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(parseInt(e.target.value) || 7)}
                    className="w-16 px-2 py-1.5 rounded-lg text-sm outline-none text-center font-semibold"
                    style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>dní</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>OBCHOD (volitelně)</p>
              <input
                value={store}
                onChange={(e) => setStore(e.target.value)}
                placeholder="např. Lidl, Rohlik..."
                className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          <button onClick={handleAdd} className="btn-primary" disabled={!name.trim()}>
            <Plus size={18} /> Přidat připomínku
          </button>
        </div>
      </div>
    </div>
  );
}

function RecurringCard({ item }: { item: RecurringItem }) {
  const { updateItem, removeItem, markPurchased } = useRecurringStore();
  const addShoppingItem = useShoppingStore((s) => s.addItem);
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const days = daysUntil(item.next_reminder);
  const isOverdue = days <= 0;
  const isSoon = days > 0 && days <= 3;

  const statusColor = isOverdue ? "#C0392B" : isSoon ? "#B85C00" : "var(--green-dark)";
  const statusBg = isOverdue ? "#FDE8E8" : isSoon ? "#FEF3E2" : "var(--green-light)";
  const statusLabel = isOverdue
    ? `Mělo se koupit před ${Math.abs(days)} dny`
    : days === 0
    ? "Koupit dnes"
    : `Za ${days} ${days === 1 ? "den" : days < 5 ? "dny" : "dní"}`;

  const handleAddToShopping = () => {
    addShoppingItem({ name: item.name, quantity: item.quantity, unit: item.unit });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleMarkPurchased = () => {
    markPurchased(item.id);
    setAddedToCart(false);
  };

  const intervalLabel = INTERVALS.find((i) => i.days === item.interval_days)?.label || `Každých ${item.interval_days} dní`;

  return (
    <div className="card overflow-hidden mb-2">
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded((e) => !e)}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: statusBg }}>
          <RefreshCw size={18} style={{ color: statusColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{item.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {item.quantity} {item.unit} · {intervalLabel}
            {item.store && ` · ${item.store}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: statusBg, color: statusColor }}>
            {statusLabel}
          </span>
          {expanded ? <ChevronUp size={14} style={{ color: "var(--text-tertiary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-2 animate-fade-in" style={{ borderColor: "var(--border)" }}>
          <div className="flex gap-2">
            <button
              onClick={handleAddToShopping}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{ background: addedToCart ? "var(--green-light)" : "var(--bg-primary)", color: addedToCart ? "var(--green-dark)" : "var(--text-secondary)", border: "1.5px solid var(--border)" }}
            >
              {addedToCart ? <><Check size={14} /> Přidáno</> : <><ShoppingCart size={14} /> Do nákupu</>}
            </button>
            <button
              onClick={handleMarkPurchased}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{ background: "var(--green-primary)", color: "white" }}
            >
              <Check size={14} /> Koupeno
            </button>
          </div>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 rounded-2xl text-xs font-medium flex items-center justify-center gap-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Trash2 size={12} /> Odebrat připomínku
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => removeItem(item.id)} className="flex-1 py-2 rounded-2xl text-sm font-semibold" style={{ background: "#FDE8E8", color: "#C0392B" }}>Odebrat</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-2xl text-sm font-semibold" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>Zrušit</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Predikce ze spižírny
function PantryPredictions() {
  const pantryItems = usePantryStore((s) => s.items);
  const { predictDaysLeft, recordConsumption } = useRecurringStore();
  const addShoppingItem = useShoppingStore((s) => s.addItem);

  const predictions = useMemo(() => {
    return pantryItems
      .map((item) => {
        const days = predictDaysLeft(item.product.product_name, item.quantity);
        return { item, days };
      })
      .filter((p) => p.days !== null && p.days <= 7)
      .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));
  }, [pantryItems, predictDaysLeft]);

  if (predictions.length === 0) return null;

  return (
    <div className="card p-4 mb-4" style={{ border: "1.5px solid #FDE8A0" }}>
      <div className="flex items-center gap-2 mb-3">
        <Bell size={15} style={{ color: "#B85C00" }} />
        <p className="text-xs font-semibold uppercase" style={{ color: "#B85C00", letterSpacing: "0.05em" }}>Brzy dojde</p>
      </div>
      <div className="space-y-2">
        {predictions.map(({ item, days }) => (
          <div key={item.id} className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.product.product_name}</p>
              <p className="text-xs" style={{ color: "#B85C00" }}>
                {days === 0 ? "Dnes dojde" : days === 1 ? "Zbývá 1 den" : `Zbývá ~${days} dní`}
              </p>
            </div>
            <button
              onClick={() => addShoppingItem({ name: item.product.product_name, quantity: item.quantity, unit: item.unit })}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0"
              style={{ background: "#FEF3E2", color: "#B85C00" }}
            >
              + Do nákupu
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecurringView() {
  const { items, getDueItems, getSoonItems } = useRecurringStore();
  const [showAdd, setShowAdd] = useState(false);

  const due = getDueItems();
  const soon = getSoonItems(3);
  const upcoming = items.filter((i) => {
    const d = daysUntil(i.next_reminder);
    return d > 3;
  });

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="px-5 pt-2 pb-24 space-y-4">

        <PantryPredictions />

        {due.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "#C0392B", letterSpacing: "0.06em" }}>
              🔴 Je čas koupit ({due.length})
            </p>
            {due.map((item) => <RecurringCard key={item.id} item={item} />)}
          </div>
        )}

        {soon.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "#B85C00", letterSpacing: "0.06em" }}>
              🟡 Brzy koupit ({soon.length})
            </p>
            {soon.map((item) => <RecurringCard key={item.id} item={item} />)}
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>
              Naplánováno
            </p>
            {upcoming.map((item) => <RecurringCard key={item.id} item={item} />)}
          </div>
        )}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-5 py-16">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
              <RefreshCw size={32} strokeWidth={1.5} style={{ color: "var(--green-primary)" }} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Žádné připomínky</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Přidej produkty které pravidelně kupuješ.</p>
            </div>
            <button className="btn-primary" style={{ width: "auto", paddingLeft: 24, paddingRight: 24 }} onClick={() => setShowAdd(true)}>
              <Plus size={18} /> Přidat připomínku
            </button>
          </div>
        )}

        {items.length > 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "white", color: "var(--green-primary)", border: "1.5px dashed var(--green-primary)" }}
          >
            <Plus size={16} /> Přidat připomínku
          </button>
        )}
      </div>

      {showAdd && <AddRecurringModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
