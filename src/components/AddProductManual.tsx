"use client";

import { useState, useRef } from "react";
import { X, Plus, ChevronDown, Camera, Image, Tag } from "lucide-react";
import { ProductInfo, StorageLocation } from "@/types";
import { usePantryStore } from "@/store/pantryStore";
import { useProductCatalogStore } from "@/store/productCatalogStore";
import { daysUntil } from "@/lib/dateUtils";
import { LedniceSVG, MrazakSVG, SpizSVG, SkrinskaSVG } from "@/components/LocationIcons";
import { VoiceInput, ParsedItem } from "@/components/VoiceInput";
import { VoiceReviewModal, ReviewItem } from "@/components/VoiceReviewModal";

interface Props {
  onClose: () => void;
  prefillEAN?: string;
}

const LOCATIONS: { id: StorageLocation; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: "lednice", label: "Lednice", Icon: LedniceSVG },
  { id: "mrazak", label: "Mrazák", Icon: MrazakSVG },
  { id: "spiz", label: "Spíž", Icon: SpizSVG },
  { id: "linka", label: "Skříňka", Icon: SkrinskaSVG },
];

const DEFAULT_CATEGORIES = [
  "Maso", "Ryby", "Mléčné výrobky", "Zelenina", "Ovoce",
  "Pekárenské výrobky", "Luštěniny", "Obiloviny", "Nápoje",
  "Omáčky a koření", "Sladkosti", "Mražené", "Konzervy", "Jiné",
];

const STORES = ["Lidl", "Albert", "Billa", "Kaufland", "Tesco", "Penny", "Rohlik", "Košík", "Jiný"];

const SUGGESTED_TAGS = ["Bio", "Bez lepku", "Laktóza free", "Vegán", "Oblíbené", "Doma", "Práce", "Akce"];

export function AddProductManual({ onClose, prefillEAN }: Props) {
  const { addItem, customCategories, addCustomCategory } = usePantryStore();

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

  // Foto
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Vlastní kategorie
  const [newCatInput, setNewCatInput] = useState("");
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const handleAddCategory = () => {
    const cat = newCatInput.trim();
    if (!cat || allCategories.includes(cat)) return;
    addCustomCategory(cat);
    setCategory(cat);
    setNewCatInput("");
  };

  // Tagy
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const addTagFromInput = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    setTags(prev => [...prev, t]);
    setTagInput("");
  };

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
  const [expires, setExpires] = useState("");

  const canProceedBasic = name.trim().length > 0;

  const [voiceReviewItems, setVoiceReviewItems] = useState<ParsedItem[] | null>(null);

  const handleVoicePantry = (items: ParsedItem[]) => {
    if (items.length > 0) setVoiceReviewItems(items);
  };

  const handleVoiceConfirm = (items: ReviewItem[]) => {
    items.forEach((item) => {
      const product: ProductInfo = {
        ean_code: `manual-${Date.now()}-${Math.random()}`,
        product_name: item.name,
        brand: "",
        category: item.category,
        subcategory: "",
        image_url: item.photoUrl ?? "",
        unit: (["g", "ml", "ks"].includes(item.unit) ? item.unit : "ks") as "g" | "ml" | "ks",
        allergens: [],
        source: "user_added",
        verified: false,
      };
      addItem(product, item.quantity, location, undefined, undefined, undefined, item.photoUrl ?? undefined);
    });
    setVoiceReviewItems(null);
    setAdded(true);
    setTimeout(onClose, 800);
  };

  const handleAdd = () => {
    const product: ProductInfo = {
      ean_code: prefillEAN ?? `manual-${Date.now()}`,
      product_name: name.trim(),
      brand: brand.trim(),
      category,
      subcategory: "",
      image_url: photoUrl ?? "",
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
      source: "user_added",
      verified: false,
    };
    // Zapamatuj si produkt podle EAN — příští sken stejného kódu ho najde okamžitě
    useProductCatalogStore.getState().saveProduct(product);
    addItem(product, qty, location, price ? parseFloat(price) : undefined, store, tags, photoUrl ?? undefined, expires || undefined);
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

        {/* Voice quick-add */}
        <div className="px-5 mb-3">
          <VoiceInput onResult={handleVoicePantry} label="Nadiktovat více produktů najednou" />
        </div>

        <div className="px-5 mb-2">
          <p className="text-xs font-semibold text-center" style={{ color: "var(--text-tertiary)" }}>— nebo přidat ručně —</p>
        </div>

        {/* Step tabs */}
        <div className="flex px-5 gap-2 mb-4">
          {([
            { id: "basic", label: "Základní info" },
            { id: "pantry", label: "Do spižírny" },
          ] as const).map((s, i) => {
            const active = step === s.id || (s.id === "pantry" && step === "nutrition");
            const done = s.id === "basic" && (step === "nutrition" || step === "pantry");
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (s.id === "basic") setStep("basic");
                  if (s.id === "pantry" && canProceedBasic) setStep("pantry");
                }}
                className="flex-1 py-2 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: active ? "var(--green-primary)" : done ? "var(--green-light)" : "var(--border)",
                  color: active ? "white" : done ? "var(--green-dark)" : "var(--text-tertiary)",
                }}
              >
                {done ? "✓ " : `${i + 1}. `}{s.label}
              </button>
            );
          })}
          {step === "nutrition" && (
            <button
              onClick={() => setStep("nutrition")}
              className="flex-1 py-2 rounded-full text-xs font-semibold"
              style={{ background: "var(--green-primary)", color: "white" }}
            >
              Výživa
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: "65vh" }}>

          {/* ===== STEP: BASIC ===== */}
          {step === "basic" && (
            <div className="space-y-3">

              {/* Foto */}
              <div className="card p-4">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>FOTKA PRODUKTU</p>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {photoUrl ? (
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img src={photoUrl} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", border: "1.5px solid var(--border)" }} />
                      <button
                        onClick={() => setPhotoUrl(null)}
                        style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--red)", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <X size={10} color="white" />
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: 12, background: "var(--bg-primary)", border: "1.5px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Image size={24} style={{ color: "var(--text-tertiary)" }} />
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 12, background: "var(--bg-primary)", border: "1.5px solid var(--border)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}
                    >
                      <Image size={15} style={{ color: "var(--green-primary)" }} /> Z galerie
                    </button>
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 12, background: "var(--bg-primary)", border: "1.5px solid var(--border)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}
                    >
                      <Camera size={15} style={{ color: "var(--green-primary)" }} /> Vyfotit
                    </button>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoFile} style={{ display: "none" }} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoFile} style={{ display: "none" }} />
              </div>

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
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allCategories.map((cat) => (
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
                {/* Přidat vlastní kategorii */}
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input
                    value={newCatInput}
                    onChange={e => setNewCatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                    placeholder="+ Vlastní kategorie..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: "var(--bg-primary)", border: "1.5px dashed var(--border)", color: "var(--text-primary)" }}
                  />
                  {newCatInput.trim() && (
                    <button
                      onClick={handleAddCategory}
                      style={{ padding: "6px 12px", borderRadius: 10, background: "var(--green-primary)", color: "white", fontSize: 12, fontWeight: 700 }}
                    >
                      Přidat
                    </button>
                  )}
                </div>
              </div>

              {/* Tagy */}
              <div className="card p-4">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>ŠTÍTKY (TAGY)</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SUGGESTED_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: "5px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: tags.includes(tag) ? "var(--green-primary)" : "var(--bg-primary)",
                        color: tags.includes(tag) ? "white" : "var(--text-secondary)",
                        border: `1px solid ${tags.includes(tag) ? "var(--green-primary)" : "var(--border)"}`,
                      }}
                    >
                      {tags.includes(tag) ? "✓ " : ""}{tag}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTagFromInput()}
                    placeholder="+ Vlastní štítek..."
                    style={{ flex: 1, padding: "6px 12px", borderRadius: 10, fontSize: 12, border: "1.5px dashed var(--border)", background: "var(--bg-primary)", outline: "none", color: "var(--text-primary)" }}
                  />
                  {tagInput.trim() && (
                    <button
                      onClick={addTagFromInput}
                      style={{ padding: "6px 12px", borderRadius: 10, background: "var(--green-primary)", color: "white", fontSize: 12, fontWeight: 700 }}
                    >
                      Přidat
                    </button>
                  )}
                </div>
                {tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {tags.map(t => (
                      <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 99, background: "var(--green-light)", fontSize: 11, fontWeight: 600, color: "var(--green-dark)" }}>
                        <Tag size={9} /> {t}
                        <button onClick={() => setTags(prev => prev.filter(x => x !== t))} style={{ marginLeft: 2 }}>
                          <X size={9} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
                onClick={() => setStep("pantry")}
                className="btn-primary"
                disabled={!canProceedBasic}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Plus size={17} /> Přidat do spižírny
              </button>
              <button
                onClick={() => setStep("nutrition")}
                className="btn-secondary"
                style={{ marginTop: 8 }}
                disabled={!canProceedBasic}
              >
                Přidat také výživové hodnoty →
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
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>SPOTŘEBUJTE DO (volitelné)</p>
                <input
                  type="date"
                  value={expires}
                  onChange={(e) => setExpires(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: expires ? "var(--text-primary)" : "var(--text-tertiary)" }}
                />
                {expires && (() => {
                  const d = daysUntil(expires);
                  const cls = d < 0 ? "badge-danger" : d <= 1 ? "badge-warn" : "badge-ok";
                  const txt = d < 0 ? "Toto datum už prošlo" : d === 0 ? "Spotřebujte dnes" : d === 1 ? "Spotřebujte zítra" : `Vydrží ještě ${d} dní`;
                  return (
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold ${cls}`} style={{ padding: "4px 10px", borderRadius: 10 }}>{txt}</span>
                      {d >= 0 && d <= 3 && (
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          Tip: v Receptech najdeš, co z toho uvařit
                        </span>
                      )}
                    </div>
                  );
                })()}
                {!expires && (
                  <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                    Zadejte datum z obalu — připomeneme vám, než potravina projde.
                  </p>
                )}
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

      {voiceReviewItems && (
        <VoiceReviewModal
          items={voiceReviewItems}
          onConfirm={handleVoiceConfirm}
          onClose={() => setVoiceReviewItems(null)}
        />
      )}
    </div>
  );
}
