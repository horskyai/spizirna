"use client";

import { useState, useRef } from "react";
import { X, Plus, Minus, Check, Trash2, Camera, Image, ChevronDown } from "lucide-react";
import { ParsedItem } from "@/components/VoiceInput";
import { guessVoiceCategory } from "@/lib/guessCategory";
import { useT, TranslationKey } from "@/lib/i18n";
import { daysUntil } from "@/lib/dateUtils";
import { LedniceSVG, MrazakSVG, SpizSVG, SkrinskaSVG } from "@/components/LocationIcons";
import type { StorageLocation } from "@/types";

const UNITS = ["ks", "g", "kg", "ml", "l", "dkg", "balení", "lžíce", "lžička", "hrnek"];
const LOCATIONS: { id: StorageLocation; labelKey: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: "lednice", labelKey: "addproduct.locLednice", Icon: LedniceSVG },
  { id: "mrazak", labelKey: "addproduct.locMrazak", Icon: MrazakSVG },
  { id: "spiz", labelKey: "addproduct.locSpiz", Icon: SpizSVG },
  { id: "linka", labelKey: "addproduct.locSkrinka", Icon: SkrinskaSVG },
];
const STORES = ["Lidl", "Albert", "Billa", "Kaufland", "Tesco", "Penny", "Rohlik", "Košík", "Jiný"];
const SUGGESTED_TAGS = ["Bio", "Bez lepku", "Laktóza free", "Vegán", "Oblíbené", "Doma", "Práce", "Akce"];
// Nutriční pole (na 100 g/ml) — klíč do ReviewItem + i18n label z addproduct.*
const NUTRI_FIELDS: { key: "kcal" | "protein" | "carbs" | "fat" | "fiber" | "salt"; labelKey: string; accent?: boolean }[] = [
  { key: "kcal", labelKey: "addproduct.calories", accent: true },
  { key: "protein", labelKey: "addproduct.proteinG" },
  { key: "carbs", labelKey: "addproduct.carbsG" },
  { key: "fat", labelKey: "addproduct.fatG" },
  { key: "fiber", labelKey: "addproduct.fiberG" },
  { key: "salt", labelKey: "addproduct.saltG" },
];

// Vrátí správný tvar slova "položka" podle počtu (1 / 2–4 / 5+).
// `acc` = akuzativ ("Přidat 3 položky"), jinak nominativ ("3 položky").
function plural(t: (k: TranslationKey) => string, n: number, acc = false): string {
  const base = acc ? "voice.countAcc" : "voice.count";
  if (n === 1) return t(`${base}.one`);
  if (n >= 2 && n <= 4) return t(`${base}.few`);
  return t(`${base}.many`);
}

const DEFAULT_CATEGORIES = [
  "Maso", "Ryby", "Mléčné výrobky", "Zelenina", "Ovoce",
  "Pekárenské výrobky", "Luštěniny", "Obiloviny", "Nápoje",
  "Oleje a tuky", "Omáčky a koření", "Sladkosti", "Mražené", "Konzervy", "Jiné",
];

interface ReviewItem extends ParsedItem {
  id: string;
  category: string;
  photoUrl?: string;
  // Detaily jako u ručního přidání (volitelné — hlas je rychlý, detaily jsou pod „Další detaily")
  location: StorageLocation;
  brand?: string;
  expiresAt?: string;   // YYYY-MM-DD
  price?: string;       // string kvůli inputu; do addItem se parsuje
  store?: string;
  tags?: string[];
  // Nutriční hodnoty (na 100 g/ml) — stringy kvůli inputu
  kcal?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
  fiber?: string;
  salt?: string;
}

interface Props {
  items: ParsedItem[];
  onConfirm: (items: ReviewItem[]) => void;
  onClose: () => void;
}

function ItemCard({ item, onChange, onRemove }: {
  item: ReviewItem;
  onChange: (changes: Partial<ReviewItem>) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ photoUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ background: "white", borderRadius: 16, padding: "14px 14px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1.5px solid var(--border)" }}>

      {/* Název + smazat */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input
          value={item.name}
          onChange={e => onChange({ name: e.target.value })}
          style={{
            flex: 1, fontSize: 15, fontWeight: 700, color: "var(--text-primary)",
            border: "none", outline: "none", background: "transparent",
            borderBottom: "1.5px solid var(--border)", paddingBottom: 4,
          }}
          placeholder={t("voice.review.namePlaceholder")}
        />
        <button onClick={onRemove} style={{ flexShrink: 0, padding: 4 }}>
          <Trash2 size={15} style={{ color: "var(--text-tertiary)" }} />
        </button>
      </div>

      {/* Fotka */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        {item.photoUrl ? (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src={item.photoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "1.5px solid var(--border)" }} />
            <button
              onClick={() => onChange({ photoUrl: undefined })}
              style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: "var(--red)", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={9} color="white" />
            </button>
          </div>
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 10, background: "var(--bg-primary)", border: "1.5px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Image size={20} style={{ color: "var(--text-tertiary)" }} />
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 10, background: "var(--bg-primary)", border: "1.5px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}
          >
            <Image size={13} style={{ color: "var(--green-primary)" }} /> {t("voice.review.gallery")}
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 10, background: "var(--bg-primary)", border: "1.5px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}
          >
            <Camera size={13} style={{ color: "var(--green-primary)" }} /> {t("voice.review.photo")}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoFile} style={{ display: "none" }} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoFile} style={{ display: "none" }} />
      </div>

      {/* Množství + jednotka */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-primary)", borderRadius: 12, padding: "6px 10px" }}>
          <button onClick={() => onChange({ quantity: Math.max(0.5, item.quantity - 1) })}>
            <Minus size={14} style={{ color: "var(--text-secondary)" }} />
          </button>
          <input
            type="number"
            value={item.quantity}
            onChange={e => onChange({ quantity: parseFloat(e.target.value) || 1 })}
            style={{ width: 40, textAlign: "center", fontSize: 14, fontWeight: 700, border: "none", outline: "none", background: "transparent", color: "var(--text-primary)" }}
          />
          <button onClick={() => onChange({ quantity: item.quantity + 1 })}>
            <Plus size={14} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
        <select
          value={item.unit}
          onChange={e => onChange({ unit: e.target.value })}
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
            onClick={() => onChange({ category: cat })}
            style={{
              padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
              background: item.category === cat ? "var(--green-primary)" : "var(--bg-primary)",
              color: item.category === cat ? "white" : "var(--text-secondary)",
              border: `1px solid ${item.category === cat ? "var(--green-primary)" : "var(--border)"}`,
            }}
          >
            {t(`voice.cat.${cat}`)}
          </button>
        ))}
      </div>

      {/* Rozbalovací „Další detaily" — umístění, značka, expirace, cena, obchod */}
      <button
        onClick={() => setShowDetails(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12, fontSize: 12, fontWeight: 600, color: "var(--green-primary)", background: "none", border: "none", padding: 0 }}
      >
        <ChevronDown size={14} style={{ transform: showDetails ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        {t("voice.review.moreDetails")}
      </button>

      {showDetails && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          {/* Umístění */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", margin: "0 0 6px" }}>{t("addproduct.location")}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {LOCATIONS.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => onChange({ location: loc.id })}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 10,
                    background: item.location === loc.id ? "var(--green-light)" : "var(--bg-primary)",
                    border: `1.5px solid ${item.location === loc.id ? "var(--green-primary)" : "var(--border)"}`,
                  }}
                >
                  <loc.Icon size={18} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: item.location === loc.id ? "var(--green-dark)" : "var(--text-primary)" }}>{t(loc.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Značka */}
          <input
            value={item.brand ?? ""}
            onChange={e => onChange({ brand: e.target.value })}
            placeholder={t("addproduct.brandPlaceholder")}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 13, border: "1.5px solid var(--border)", background: "var(--bg-primary)", outline: "none", color: "var(--text-primary)" }}
          />

          {/* Datum spotřeby */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", margin: "0 0 6px" }}>{t("addproduct.expiryOptional")}</p>
            <input
              type="date"
              value={item.expiresAt ?? ""}
              onChange={e => onChange({ expiresAt: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 13, border: "1.5px solid var(--border)", background: "var(--bg-primary)", outline: "none", color: item.expiresAt ? "var(--text-primary)" : "var(--text-tertiary)" }}
            />
            {item.expiresAt && (() => {
              const d = daysUntil(item.expiresAt);
              const cls = d < 0 ? "badge-danger" : d <= 1 ? "badge-warn" : "badge-ok";
              const txt = d < 0 ? t("addproduct.dateExpired") : d === 0 ? t("addproduct.consumeToday") : d === 1 ? t("addproduct.consumeTomorrow") : t("addproduct.lastsDays").replace("{n}", String(d));
              return <span className={`text-xs font-semibold ${cls}`} style={{ display: "inline-block", marginTop: 6, padding: "3px 9px", borderRadius: 9 }}>{txt}</span>;
            })()}
          </div>

          {/* Cena + obchod */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", margin: "0 0 6px" }}>{t("addproduct.priceOptional")}</p>
            <input
              type="number"
              value={item.price ?? ""}
              onChange={e => onChange({ price: e.target.value })}
              placeholder="0.00 CZK"
              style={{ width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 13, border: "1.5px solid var(--border)", background: "var(--bg-primary)", outline: "none", color: "var(--text-primary)", marginBottom: 8 }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {STORES.map(s => (
                <button
                  key={s}
                  onClick={() => onChange({ store: s })}
                  style={{
                    padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                    background: item.store === s ? "var(--green-primary)" : "var(--bg-primary)",
                    color: item.store === s ? "white" : "var(--text-secondary)",
                    border: `1px solid ${item.store === s ? "var(--green-primary)" : "var(--border)"}`,
                  }}
                >
                  {s === "Jiný" ? t("addproduct.store.Jiný") : s}
                </button>
              ))}
            </div>
          </div>

          {/* Štítky (tagy) */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", margin: "0 0 6px" }}>{t("addproduct.tagsLabel")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SUGGESTED_TAGS.map(tag => {
                const on = (item.tags ?? []).includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onChange({ tags: on ? (item.tags ?? []).filter(x => x !== tag) : [...(item.tags ?? []), tag] })}
                    style={{
                      padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: on ? "var(--green-primary)" : "var(--bg-primary)",
                      color: on ? "white" : "var(--text-secondary)",
                      border: `1px solid ${on ? "var(--green-primary)" : "var(--border)"}`,
                    }}
                  >
                    {on ? "✓ " : ""}{t(`addproduct.tag.${tag}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nutriční hodnoty (na 100 g/ml) */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", margin: "0 0 6px" }}>{t("addproduct.stepNutrition")}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {NUTRI_FIELDS.map(f => (
                <div key={f.key}>
                  <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: "0 0 3px" }}>{t(f.labelKey)}</p>
                  <input
                    type="number"
                    value={(item[f.key] as string) ?? ""}
                    onChange={e => onChange({ [f.key]: e.target.value } as Partial<ReviewItem>)}
                    placeholder="0"
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 10, fontSize: 13, border: `1.5px solid ${f.accent ? "var(--green-primary)" : "var(--border)"}`, background: "var(--bg-primary)", outline: "none", color: "var(--text-primary)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function VoiceReviewModal({ items: initialItems, onConfirm, onClose }: Props) {
  const t = useT();
  const [items, setItems] = useState<ReviewItem[]>(
    initialItems.map((item, i) => ({
      ...item,
      id: `voice-${i}-${Date.now()}`,
      category: guessVoiceCategory(item.name),
      location: "spiz" as StorageLocation,
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
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
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
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{t("voice.review.title")}</h2>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              {items.length} {plural(t, items.length)} — {t("voice.review.subtitle")}
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
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onChange={changes => update(item.id, changes)}
              onRemove={() => remove(item.id)}
            />
          ))}
          {items.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "32px 0", fontSize: 14 }}>
              {t("voice.review.allRemoved")}
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
            <Check size={17} /> {t("voice.review.addToPantry").replace("{label}", items.length > 0 ? `${items.length} ${plural(t, items.length, true)}` : "").replace(/\s+/g, " ").trim()}
          </button>
          <button onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
        </div>
      </div>
    </div>
  );
}

export type { ReviewItem };
