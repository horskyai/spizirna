"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, ChevronRight, Bell, RefrigeratorIcon, ScanLine } from "lucide-react";
import { usePantryStore } from "@/store/pantryStore";
import { useUIStore } from "@/store/uiStore";
import { PantryItem, StorageLocation } from "@/types";
import { daysUntil, formatDateShort } from "@/lib/dateUtils";
import { cn } from "@/lib/cn";
import { AddProductManual } from "@/components/AddProductManual";

const LOCATION_LABELS: Record<StorageLocation, { label: string; emoji: string }> = {
  lednice: { label: "Lednice", emoji: "🧊" },
  mrazak: { label: "Mrazák", emoji: "❄️" },
  spiz: { label: "Spíž", emoji: "🏠" },
  linka: { label: "Skříňka", emoji: "🗄️" },
};

function ExpiryBadge({ expiresAt }: { expiresAt?: string }) {
  if (!expiresAt) return null;
  const days = daysUntil(expiresAt);
  const cls = days <= 1 ? "badge-danger" : days <= 3 ? "badge-warn" : "badge-ok";
  const label = days < 0 ? "Prošlé!" : days === 0 ? "Dnes" : days === 1 ? "Zítra" : `Za ${days} dní`;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>
  );
}

function PantryItemCard({ item, onRemove }: { item: PantryItem; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const loc = LOCATION_LABELS[item.location];

  return (
    <div className="card overflow-hidden mb-2">
      <button
        className="w-full flex items-center gap-3 p-3.5 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: "var(--green-light)" }}
        >
          {loc.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
            {item.product.product_name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {item.product.brand && `${item.product.brand} · `}
            {item.quantity} {item.unit} · {loc.label}
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <ExpiryBadge expiresAt={item.expires_at} />
          <ChevronRight size={14} className={cn("transition-transform", expanded && "rotate-90")} style={{ color: "var(--text-tertiary)" }} />
        </div>
      </button>

      {expanded && (
        <div className="border-t px-3.5 pb-3.5 pt-3 space-y-2 animate-fade-in" style={{ borderColor: "var(--border)" }}>
          {/* Macros */}
          {item.product.calories_kcal && (
            <div className="flex gap-3 text-xs">
              <span style={{ color: "var(--text-secondary)" }}>
                <span className="font-bold" style={{ color: "var(--green-primary)" }}>{item.product.calories_kcal}</span> kcal/100g
              </span>
              {item.product.protein_g && <span style={{ color: "var(--text-secondary)" }}>B: <b>{item.product.protein_g}g</b></span>}
              {item.product.carbs_g && <span style={{ color: "var(--text-secondary)" }}>S: <b>{item.product.carbs_g}g</b></span>}
              {item.product.fat_g && <span style={{ color: "var(--text-secondary)" }}>T: <b>{item.product.fat_g}g</b></span>}
            </div>
          )}
          {item.price_paid && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Cena: <b>{item.price_paid} CZK</b> · {item.store}
            </p>
          )}
          {item.expires_at && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Expiruje: <b>{formatDateShort(item.expires_at)}</b>
            </p>
          )}
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
            style={{ background: "#FDE8E8", color: "#C0392B" }}
          >
            <Trash2 size={12} /> Odebrat ze spižírny
          </button>
        </div>
      )}
    </div>
  );
}

export function PantryView() {
  const { items, removeItem } = usePantryStore();
  const { setTab } = useUIStore();
  const [filter, setFilter] = useState<StorageLocation | "vse">("vse");
  const [showManual, setShowManual] = useState(false);

  const expiring = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 3);
    return items.filter((i) => i.expires_at && new Date(i.expires_at) <= cutoff);
  }, [items]);
  const filtered = filter === "vse" ? items : items.filter(i => i.location === filter);

  const filters: { id: StorageLocation | "vse"; label: string; emoji: string }[] = [
    { id: "vse", label: "Vše", emoji: "📦" },
    ...Object.entries(LOCATION_LABELS).map(([id, v]) => ({ id: id as StorageLocation, label: v.label, emoji: v.emoji })),
  ];

  if (items.length === 0) {
    return (
      <div className="relative flex-1 flex flex-col items-center justify-center gap-5 p-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
          <RefrigeratorIcon size={32} strokeWidth={1.5} style={{ color: "var(--green-primary)" }} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Spižírna je prázdná</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Naskenujte EAN kód nebo přidejte produkty ručně.</p>
        </div>
        <button className="btn-primary" onClick={() => setTab("skenovat")}>
          <span style={{ fontSize: 16 }}>⊡</span> Naskenovat produkt
        </button>
        <button className="btn-secondary" onClick={() => setShowManual(true)}>
          <Plus size={16} /> Přidat ručně
        </button>
        {showManual && <AddProductManual onClose={() => setShowManual(false)} />}
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="px-5 pt-0 pb-4">
        {/* Hero card */}
        <div className="hero-card px-5 py-5 mb-5" style={{ textAlign: "center" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Celkem v spižírně
          </p>
          <p style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, color: "white", letterSpacing: "-2px" }}>
            {items.length}
          </p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
            {expiring.length > 0 ? `${expiring.length} brzy vyprší` : "Vše v pořádku ✓"}
          </p>
          {/* Quick actions row */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setTab("skenovat")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <ScanLine size={14} /> Skenovat
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <Plus size={14} /> Přidat ručně
            </button>
          </div>
        </div>

        {/* Expiry alerts */}
        {expiring.length > 0 && (
          <div className="rounded-2xl p-3.5 mb-4 flex items-start gap-3" style={{ background: "#FFF8EC", border: "1px solid #FFE0B2" }}>
            <Bell size={16} style={{ color: "#F57C00", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#E65100" }}>
                {expiring.length} {expiring.length === 1 ? "produkt vyprší" : "produkty vyprší"} brzy!
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#BF360C" }}>
                {expiring.map(i => i.product.product_name).slice(0, 2).join(", ")}
                {expiring.length > 2 ? ` a ${expiring.length - 2} další` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 mb-4" style={{ scrollbarWidth: "none" }}>
          {filters.map((f) => {
            const count = f.id === "vse" ? items.length : items.filter(i => i.location === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: filter === f.id ? "var(--green-primary)" : "white",
                  color: filter === f.id ? "white" : "var(--text-secondary)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <span>{f.emoji}</span>
                <span>{f.label}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: filter === f.id ? "rgba(255,255,255,0.25)" : "var(--green-light)",
                    color: filter === f.id ? "white" : "var(--green-dark)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Žádné produkty v této kategorii</p>
          </div>
        ) : (
          filtered.map((item) => (
            <PantryItemCard key={item.id} item={item} onRemove={() => removeItem(item.id)} />
          ))
        )}

      </div>

      {showManual && <AddProductManual onClose={() => setShowManual(false)} />}
    </div>
  );
}
