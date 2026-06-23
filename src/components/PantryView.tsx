"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronRight, Pencil, X, RefrigeratorIcon, ScanLine, Minus, Search } from "lucide-react";
import { usePantryStore } from "@/store/pantryStore";
import { useUIStore } from "@/store/uiStore";
import { useModeStore } from "@/store/modeStore";
import { useGamificationStore } from "@/store/gamificationStore";
import { ProvozSkladView } from "@/components/ProvozSkladView";
import { PantryItem, StorageLocation } from "@/types";
import { daysUntil, formatDateShort } from "@/lib/dateUtils";
import { cn } from "@/lib/cn";
import { AddProductManual } from "@/components/AddProductManual";
import { TodaySummary } from "@/components/TodaySummary";
import { ProgressBadge } from "@/components/ProgressBadge";
import { LedniceSVG, MrazakSVG, SpizSVG, SkrinskaSVG, VseSVG } from "@/components/LocationIcons";
import { useT } from "@/lib/i18n";

const LOCATION_LABELS: Record<StorageLocation, { labelKey: string; Icon: React.FC<{ size?: number }> }> = {
  lednice: { labelKey: "pantry.location.lednice", Icon: LedniceSVG },
  mrazak: { labelKey: "pantry.location.mrazak", Icon: MrazakSVG },
  spiz: { labelKey: "pantry.location.spiz", Icon: SpizSVG },
  linka: { labelKey: "pantry.location.linka", Icon: SkrinskaSVG },
};

function ExpiryBadge({ expiresAt }: { expiresAt?: string }) {
  const t = useT();
  if (!expiresAt) return null;
  const days = daysUntil(expiresAt);
  const cls = days < 0 ? "badge-danger" : days <= 1 ? "badge-warn" : "badge-ok";
  const label = days < 0
    ? t("pantry.expiry.expired")
    : days === 0
      ? t("pantry.expiry.today")
      : days === 1
        ? t("pantry.expiry.tomorrow")
        : t("pantry.expiry.days").replace("{n}", String(days));
  return (
    <span className={`text-xs font-semibold ${cls}`} style={{ padding: "4px 10px", borderRadius: 10, whiteSpace: "nowrap" }}>{label}</span>
  );
}

function EditModal({ item, onClose }: { item: PantryItem; onClose: () => void }) {
  const t = useT();
  const { updateItem } = usePantryStore();
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState(item.unit);
  const [location, setLocation] = useState<StorageLocation>(item.location);
  const [expires, setExpires] = useState(item.expires_at ?? "");

  const save = () => {
    updateItem(item.id, {
      quantity: parseFloat(quantity) || item.quantity,
      unit,
      location,
      expires_at: expires || undefined,
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div className="relative rounded-t-3xl px-5 pt-5 pb-8 space-y-4 animate-slide-up" style={{ background: "var(--bg-primary)", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))" }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("pantry.edit.title")}</h3>
          <button onClick={onClose}><X size={20} style={{ color: "var(--text-tertiary)" }} /></button>
        </div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{item.product.product_name}</p>

        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("pantry.edit.quantity")}</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl text-sm"
              style={{ border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("pantry.edit.unit")}</label>
            <input
              type="text"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl text-sm"
              style={{ border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)" }}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("pantry.edit.location")}</label>
          <div className="flex gap-2 flex-wrap">
            {(["spiz", "lednice", "mrazak", "linka"] as StorageLocation[]).map(loc => (
              <button
                key={loc}
                onClick={() => setLocation(loc)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: location === loc ? "var(--green-primary)" : "white",
                  color: location === loc ? "white" : "var(--text-secondary)",
                  border: "1.5px solid",
                  borderColor: location === loc ? "var(--green-primary)" : "var(--border)",
                }}
              >
                {t(LOCATION_LABELS[loc].labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("pantry.edit.expiry")}</label>
          <input
            type="date"
            value={expires}
            onChange={e => setExpires(e.target.value)}
            className="w-full px-3 py-2.5 rounded-2xl text-sm"
            style={{ border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)" }}
          />
        </div>

        <button onClick={save} className="btn-primary">{t("common.saveChanges")}</button>
      </div>
    </div>
  );
}

function PantryItemCard({ item, onRemove }: { item: PantryItem; onRemove: () => void }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [justConsumed, setJustConsumed] = useState(false);
  const { consumeItem } = usePantryStore();
  const { recordSaved, recordActivity } = useGamificationStore();
  const loc = LOCATION_LABELS[item.location];

  const handleQuickConsume = (e: React.MouseEvent) => {
    e.stopPropagation();
    setJustConsumed(true);
    recordActivity();
    // Pokud brzy expiruje a spotřebujeme → zachránili jsme před vyhozením
    if (item.expires_at) {
      const days = daysUntil(item.expires_at);
      if (days <= 3) recordSaved();
    }
    setTimeout(() => {
      consumeItem(item.id, 1);
      setJustConsumed(false);
    }, 300);
  };

  return (
    <div className="card overflow-hidden mb-2">
      <button
        className="w-full flex items-center gap-3 p-3.5 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: "var(--green-light)" }}
        >
          {item.product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.product.image_url}
              alt={item.product.product_name}
              style={{ width: 44, height: 44, objectFit: "contain", padding: 4 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <loc.Icon size={22} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
            {item.product.product_name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {item.product.brand && `${item.product.brand} · `}
            {item.quantity} {item.unit} · {t(loc.labelKey)}
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <ExpiryBadge expiresAt={item.expires_at} />
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleQuickConsume}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{
                background: justConsumed ? "var(--green-primary)" : "var(--green-light)",
                transform: justConsumed ? "scale(0.85)" : "scale(1)",
                transition: "all 0.2s ease",
              }}
              title={t("pantry.item.consumeOne")}
            >
              <Minus size={12} style={{ color: justConsumed ? "white" : "var(--green-primary)" }} />
            </button>
            <ChevronRight size={14} className={cn("transition-transform", expanded && "rotate-90")} style={{ color: "var(--text-tertiary)" }} />
          </div>
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
              {t("pantry.item.price")}: <b>{item.price_paid} CZK</b> · {item.store}
            </p>
          )}
          {item.expires_at && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {t("pantry.item.expires")}: <b>{formatDateShort(item.expires_at)}</b>
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              style={{ background: "var(--green-light)", color: "var(--green-primary)" }}
            >
              <Pencil size={12} /> {t("common.edit")}
            </button>
            <button
              onClick={onRemove}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              style={{ background: "#FDE8E8", color: "#C0392B" }}
            >
              <Trash2 size={12} /> {t("common.remove")}
            </button>
          </div>
        </div>
      )}
      {showEdit && <EditModal item={item} onClose={() => setShowEdit(false)} />}
    </div>
  );
}

export function PantryView() {
  const t = useT();
  const { items, removeItem } = usePantryStore();
  const { setTab } = useUIStore();
  const mode = useModeStore((s) => s.mode);
  const [filter, setFilter] = useState<StorageLocation | "vse">("vse");
  const [search, setSearch] = useState("");
  const [showManual, setShowManual] = useState(false);

  // V režimu provozovna ukazuje tab Spižírna obsah skladu (propojeno s Provozem).
  if (mode === "provoz") {
    return <ProvozSkladView />;
  }

  const byLocation = filter === "vse" ? items : items.filter(i => i.location === filter);
  const filtered = search.trim()
    ? byLocation.filter(i => i.product.product_name.toLowerCase().includes(search.trim().toLowerCase()))
    : byLocation;

  const filters: { id: StorageLocation | "vse"; label: string; Icon: React.FC<{ size?: number }> }[] = [
    { id: "vse", label: t("pantry.filter.vse"), Icon: VseSVG },
    ...Object.entries(LOCATION_LABELS).map(([id, v]) => ({ id: id as StorageLocation, label: t(v.labelKey), Icon: v.Icon })),
  ];

  if (items.length === 0) {
    return (
      <div className="relative flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RefrigeratorIcon size={38} strokeWidth={1.4} style={{ color: "var(--green-primary)" }} />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{t("pantry.empty.title")}</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {t("pantry.empty.subtitle")}
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ width: "100%", maxWidth: 280, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          onClick={() => setTab("skenovat")}
        >
          <ScanLine size={18} /> {t("pantry.empty.scanFirst")}
        </button>
        <button
          className="btn-secondary"
          style={{ width: "100%", maxWidth: 280, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          onClick={() => setShowManual(true)}
        >
          <Plus size={18} /> {t("pantry.empty.addManual")}
        </button>
        <p style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", marginTop: 4 }}>
          {t("pantry.empty.tip")}
        </p>
        {showManual && <AddProductManual onClose={() => setShowManual(false)} />}
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="px-5 pt-0 pb-4">
        {/* Odznak pokroku — úroveň, série, zachráněné potraviny */}
        <ProgressBadge />

        {/* Dnešní přehled — expirace, docházející kusy, nákup, opakované */}
        <TodaySummary />

        {/* Search */}
        <div
          className="flex items-center gap-2.5 mb-4"
          style={{ background: "white", borderRadius: 16, padding: "12px 14px", boxShadow: "var(--shadow)" }}
        >
          <Search size={17} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("pantry.search.placeholder")}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: "100%", color: "var(--text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ flexShrink: 0, display: "flex" }}>
              <X size={15} style={{ color: "var(--text-tertiary)" }} />
            </button>
          )}
        </div>

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
                <f.Icon size={18} />
                <span>{f.label}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: filter === f.id ? "rgba(0,0,0,0.2)" : "var(--green-primary)",
                    color: "white",
                    minWidth: 20,
                    textAlign: "center",
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
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{t("pantry.list.empty")}</p>
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
