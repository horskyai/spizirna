"use client";

import { useState, useMemo, useRef } from "react";
import { Plus, Check, ShoppingCart, X, Share2, Lightbulb, ChevronDown, ChevronUp, Mic, MicOff, Loader, Search } from "lucide-react";
import { useShoppingStore, ShoppingMode } from "@/store/shoppingStore";
import { usePantryStore } from "@/store/pantryStore";
import { useRecurringStore } from "@/store/recurringStore";
import { useRecipeStore } from "@/store/recipeStore";
import { useModeStore } from "@/store/modeStore";
import { ShoppingItem } from "@/store/shoppingStore";
import { ProductInfo } from "@/types";
import { VoiceInput, parseSpokenText, ParsedItem } from "@/components/VoiceInput";
import { guessCategory } from "@/lib/guessCategory";
import { useT, useLocale } from "@/lib/i18n";

const CATEGORIES = [
  { id: "ovoce-zelenina", labelKey: "shopping.cat.ovoce-zelenina", emoji: "🥦" },
  { id: "maso-ryby", labelKey: "shopping.cat.maso-ryby", emoji: "🥩" },
  { id: "mlecne", labelKey: "shopping.cat.mlecne", emoji: "🧀" },
  { id: "pecivo", labelKey: "shopping.cat.pecivo", emoji: "🍞" },
  { id: "suche", labelKey: "shopping.cat.suche", emoji: "🌾" },
  { id: "oleje-tuky", labelKey: "shopping.cat.oleje-tuky", emoji: "🫒" },
  { id: "napoje", labelKey: "shopping.cat.napoje", emoji: "🥤" },
  { id: "mrazene", labelKey: "shopping.cat.mrazene", emoji: "❄️" },
  { id: "ostatni", labelKey: "shopping.cat.ostatni", emoji: "🛒" },
];

// Stabilní interní klíč pro skupinu „ručně přidaných" položek (nezávislý na
// jazyku — překlad se aplikuje až při zobrazení).
const MANUAL_GROUP = "__manual__";

function AddItemModal({ onClose, mode }: { onClose: () => void; mode: ShoppingMode }) {
  const t = useT();
  const addItem = useShoppingStore((s) => s.addItem);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("ks");
  const [category, setCategory] = useState("ostatni");

  const units = ["ks", "g", "kg", "ml", "l", "balení"];

  const handleAdd = () => {
    if (!name.trim()) return;
    addItem({ name: name.trim(), quantity: parseFloat(quantity) || 1, unit, category }, mode);
    setName("");
    setQuantity("1");
  };

  const handleVoice = (items: { name: string; quantity: number; unit: string }[]) => {
    items.forEach((item) => addItem({ name: item.name, quantity: item.quantity, unit: item.unit, category: guessCategory(item.name) }, mode));
    if (items.length > 0) onClose();
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
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("shopping.add.title")}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
              <X size={15} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { handleAdd(); } }}
            placeholder={t("shopping.namePlaceholder")}
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

          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{t("shopping.category")}</p>
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
                <span>{cat.emoji}</span> {t(cat.labelKey)}
              </button>
            ))}
          </div>

          <button
            onClick={() => { handleAdd(); onClose(); }}
            className="btn-primary"
            disabled={!name.trim()}
          >
            <Plus size={18} /> {t("common.add")}
          </button>

          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />

          <VoiceInput onResult={handleVoice} label={t("shopping.voiceLabel")} />
        </div>
      </div>
    </div>
  );
}

function VoiceFab({ onItems }: { onItems: (items: ParsedItem[]) => void }) {
  const t = useT();
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "listening" | "processing">("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const start = () => {
    setError(null);
    setTranscript("");
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(t("shopping.voice.unsupported"));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = locale === "sk" ? "sk-SK" : "cs-CZ";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setState("listening");
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      if (result.isFinal) {
        setState("processing");
        const items = parseSpokenText(text);
        setTimeout(() => {
          if (items.length > 0) {
            onItems(items);
          } else {
            setError(t("shopping.voice.notUnderstood"));
          }
          setState("idle");
          setTranscript("");
        }, 300);
      }
    };
    recognition.onerror = (event: any) => {
      setError(
        event.error === "not-allowed"
          ? t("shopping.voice.notAllowed")
          : t("shopping.voice.nothingHeard")
      );
      setState("idle");
    };
    recognition.onend = () => setState((s) => (s === "listening" ? "idle" : s));
    recognition.start();
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setState("idle");
  };

  const listening = state === "listening";

  return (
    <>
      {(listening || error) && (
        <div
          onClick={() => setError(null)}
          style={{
            position: "fixed", right: 20,
            bottom: "calc(158px + env(safe-area-inset-bottom, 0px))",
            maxWidth: 280,
            background: "rgba(0,0,0,0.78)", color: "white",
            borderRadius: 14, padding: "10px 14px",
            fontSize: 13, lineHeight: 1.45, zIndex: 60,
          }}
        >
          {error
            ? error
            : transcript
            ? `„${transcript}"`
            : t("shopping.voice.listening")}
        </div>
      )}
      <button
        onClick={listening ? stop : start}
        aria-label={t("shopping.voice.aria")}
        style={{
          position: "fixed",
          right: 20,
          bottom: "calc(92px + env(safe-area-inset-bottom, 0px))",
          width: 56, height: 56, borderRadius: "50%",
          background: listening
            ? "linear-gradient(135deg, #F08A8A 0%, #D95757 100%)"
            : "linear-gradient(135deg, #F7B267 0%, #E8862E 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: listening
            ? "0 8px 20px rgba(217,87,87,0.5)"
            : "0 8px 20px rgba(232,134,46,0.45)",
          zIndex: 50,
          transition: "background 0.2s ease",
        }}
      >
        {state === "processing"
          ? <Loader size={22} color="white" className="animate-spin" />
          : listening
          ? <MicOff size={24} color="white" />
          : <Mic size={24} color="white" />}
      </button>
    </>
  );
}

// Hezké zobrazení množství: zbaví plovoucí nepřesnosti (3.4000000000000004 → 3.4)
function fmtQty(n: number): string {
  return String(Math.round(n * 100) / 100);
}

// Úprava položky v seznamu (název, množství, jednotka, kategorie) —
// když se něco nadiktuje špatně, uživatel to tady opraví.
function EditItemModal({ item, mode, onClose }: { item: ShoppingItem; mode: ShoppingMode; onClose: () => void }) {
  const t = useT();
  const updateItem = useShoppingStore((s) => s.updateItem);
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState(item.unit);
  const [category, setCategory] = useState(item.category || "ostatni");

  const units = ["ks", "g", "kg", "ml", "l", "balení"];

  const save = () => {
    if (!name.trim()) return;
    updateItem(item.id, {
      name: name.trim(),
      quantity: parseFloat(quantity.replace(",", ".")) || item.quantity,
      unit,
      category,
    }, mode);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 200 }}>
      <div className="sheet-overlay animate-fade-in" onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div
        className="relative animate-slide-up rounded-t-3xl overflow-hidden"
        style={{ background: "var(--bg-primary)", paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="px-5 pt-2 pb-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("shopping.edit.title")}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
              <X size={15} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("shopping.namePlaceholder")}
            autoFocus
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />

          <div className="flex gap-2">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24 px-3 py-2.5 rounded-xl text-sm outline-none text-center font-semibold"
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

          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{t("shopping.category")}</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  background: category === c.id ? "var(--green-light)" : "white",
                  border: `1.5px solid ${category === c.id ? "var(--green-primary)" : "var(--border)"}`,
                  color: category === c.id ? "var(--green-dark)" : "var(--text-primary)",
                }}
              >
                <span>{c.emoji}</span> {t(c.labelKey)}
              </button>
            ))}
          </div>

          <button onClick={save} className="btn-primary" disabled={!name.trim()}>
            <Check size={18} /> {t("shopping.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

function shoppingItemToProduct(item: ShoppingItem): ProductInfo {
  return {
    ean_code: item.ean_code || "",
    product_name: item.name,
    brand: "",
    category: item.category || "ostatni",
    subcategory: "",
    image_url: "",
    unit: (["g", "ml", "ks"].includes(item.unit) ? item.unit : "ks") as "g" | "ml" | "ks",
    allergens: [],
    source: "user_added",
    verified: false,
  };
}

function SmartSuggestionsWidget({ mode }: { mode: ShoppingMode }) {
  const t = useT();
  const recurringItems = useRecurringStore((s) => s.items);
  const pantryItems = usePantryStore((s) => s.items);
  const { recipes } = useRecipeStore();
  const addItems = useShoppingStore((s) => s.addItems);
  const [collapsed, setCollapsed] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const suggestions = useMemo(() => {
    const results: { id: string; name: string; reason: string; quantity: number; unit: string; category: string }[] = [];

    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 3);
    recurringItems.forEach((item) => {
      const nextDate = new Date(item.next_reminder);
      if (nextDate <= soon) {
        results.push({
          id: `recurring-${item.id}`,
          name: item.name,
          reason: nextDate <= now ? t("shopping.suggest.outOfStock") : t("shopping.suggest.soon"),
          quantity: item.quantity,
          unit: item.unit,
          category: item.category || "ostatni",
        });
      }
    });

    pantryItems.forEach((item) => {
      if (item.quantity <= 1) {
        const alreadySuggested = results.some(r => r.name.toLowerCase().includes(item.product.product_name.toLowerCase().slice(0, 5)));
        if (!alreadySuggested) {
          results.push({
            id: `pantry-low-${item.id}`,
            name: item.product.product_name,
            reason: t("shopping.suggest.remaining").replace("{q}", String(item.quantity)).replace("{u}", item.unit),
            quantity: 1,
            unit: item.unit === "ks" ? "ks" : item.unit,
            category: "ostatni",
          });
        }
      }
    });

    const COMMON_INGREDIENTS = [
      { name: "Vejce", unit: "ks", quantity: 6, category: "mlecne", keywords: ["vejce"] },
      { name: "Mléko", unit: "l", quantity: 1, category: "mlecne", keywords: ["mléko"] },
      { name: "Máslo", unit: "g", quantity: 250, category: "mlecne", keywords: ["máslo"] },
      { name: "Cibule", unit: "ks", quantity: 3, category: "ovoce-zelenina", keywords: ["cibule"] },
      { name: "Česnek", unit: "ks", quantity: 1, category: "ovoce-zelenina", keywords: ["česnek"] },
      { name: "Rajčata", unit: "ks", quantity: 4, category: "ovoce-zelenina", keywords: ["rajče", "rajčata"] },
    ];

    COMMON_INGREDIENTS.forEach((ing) => {
      const inPantry = pantryItems.some((p) =>
        ing.keywords.some(kw => p.product.product_name.toLowerCase().includes(kw))
      );
      if (!inPantry) {
        const usedInRecipes = recipes.some((r) =>
          r.ingredients.some((ri) =>
            ing.keywords.some(kw => ri.name.toLowerCase().includes(kw))
          )
        );
        if (usedInRecipes) {
          results.push({
            id: `common-${ing.name}`,
            name: ing.name,
            reason: t("shopping.suggest.missingForRecipes"),
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category,
          });
        }
      }
    });

    return results.slice(0, 6);
  }, [recurringItems, pantryItems, recipes]);

  if (suggestions.length === 0) return null;

  const handleAdd = (id: string, name: string, quantity: number, unit: string, category: string) => {
    addItems([{ name, quantity, unit, category }], mode);
    setAddedIds((prev) => new Set(prev).add(id));
  };

  const handleAddAll = () => {
    const toAdd = suggestions
      .filter((s) => !addedIds.has(s.id))
      .map((s) => ({ name: s.name, quantity: s.quantity, unit: s.unit, category: s.category }));
    addItems(toAdd, mode);
    setAddedIds(new Set(suggestions.map((s) => s.id)));
  };

  return (
    <div className="card mb-4 overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={15} style={{ color: "#F57C00" }} />
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {t("shopping.suggest.title").replace("{n}", String(suggestions.length))}
          </p>
        </div>
        {collapsed ? <ChevronDown size={15} style={{ color: "var(--text-tertiary)" }} /> : <ChevronUp size={15} style={{ color: "var(--text-tertiary)" }} />}
      </button>

      {!collapsed && (
        <div className="border-t animate-fade-in" style={{ borderColor: "var(--border)" }}>
          {suggestions.map((s, idx) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: idx < suggestions.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                <p className="text-xs" style={{ color: addedIds.has(s.id) ? "var(--green-primary)" : "#F57C00", fontWeight: 600 }}>
                  {addedIds.has(s.id) ? t("shopping.suggest.added") : s.reason}
                </p>
              </div>
              <button
                onClick={() => handleAdd(s.id, s.name, s.quantity, s.unit, s.category)}
                disabled={addedIds.has(s.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: addedIds.has(s.id) ? "var(--green-primary)" : "var(--green-light)" }}
              >
                {addedIds.has(s.id)
                  ? <Check size={12} color="white" strokeWidth={3} />
                  : <Plus size={13} style={{ color: "var(--green-primary)" }} />
                }
              </button>
            </div>
          ))}
          {suggestions.filter(s => !addedIds.has(s.id)).length > 1 && (
            <div className="px-4 py-3">
              <button
                onClick={handleAddAll}
                className="w-full py-2.5 rounded-2xl text-sm font-semibold"
                style={{ background: "var(--green-light)", color: "var(--green-dark)", border: "1px solid var(--green-primary)" }}
              >
                {t("shopping.suggest.addAll").replace("{n}", String(suggestions.filter(s => !addedIds.has(s.id)).length))}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ShoppingView() {
  const t = useT();
  const appMode = useModeStore((s) => s.mode);
  const mode: ShoppingMode = appMode === "provoz" ? "provoz" : "domacnost";

  const { toggleItem, removeItem, removeChecked, clearAll, getItems } = useShoppingStore();
  const addItems = useShoppingStore((s) => s.addItems);
  const items = getItems(mode);
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null);

  const addToPantry = usePantryStore((s) => s.addItem);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<"vse" | "kategorie">("vse");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [justChecked, setJustChecked] = useState<Set<string>>(new Set());

  const handleCheck = (item: ShoppingItem) => {
    const wasChecked = item.checked;
    toggleItem(item.id, mode);
    if (!wasChecked) {
      setJustChecked((prev) => new Set(prev).add(item.id));
      setTimeout(() => setJustChecked((prev) => { const s = new Set(prev); s.delete(item.id); return s; }), 400);
      addToPantry(shoppingItemToProduct(item), item.quantity, "spiz");
      setToast(t("shopping.toast.toPantry").replace("{name}", item.name));
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleVoiceAdd = (voiceItems: ParsedItem[]) => {
    addItems(voiceItems.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit, category: guessCategory(i.name) })), mode);
    setToast(voiceItems.length === 1
      ? t("shopping.toast.oneToList").replace("{name}", voiceItems[0].name)
      : t("shopping.toast.manyToList").replace("{n}", String(voiceItems.length)));
    setTimeout(() => setToast(null), 3000);
  };

  const q = search.trim().toLowerCase();
  const visible = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  const unchecked = useMemo(() => visible.filter((i) => !i.checked), [visible]);
  const checked = useMemo(() => visible.filter((i) => i.checked), [visible]);

  const groups = useMemo(() => {
    if (view === "kategorie") {
      return CATEGORIES
        .map((cat) => ({
          name: t(cat.labelKey),
          items: unchecked.filter((i) => (i.category || "ostatni") === cat.id),
          isManual: false,
        }))
        .filter((g) => g.items.length > 0);
    }
    const byRecipe = unchecked.reduce<Record<string, typeof unchecked>>((acc, item) => {
      const key = item.recipe_name || MANUAL_GROUP;
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
    const keys = Object.keys(byRecipe).sort((a, b) =>
      a === MANUAL_GROUP ? 1 : b === MANUAL_GROUP ? -1 : 0
    );
    return keys.map((k) => ({
      name: k === MANUAL_GROUP ? t("shopping.addedManually") : k,
      items: byRecipe[k],
      isManual: k === MANUAL_GROUP,
    }));
  }, [unchecked, view, t]);

  const shareList = () => {
    const manualLabel = t("shopping.addedManually");
    const lines: string[] = [`${t("shopping.shareHeader")}\n`];
    groups.forEach(({ name, isManual, items: groupItems }) => {
      lines.push(isManual ? `🛒 ${manualLabel}` : `📖 ${name}`);
      groupItems.forEach((i) => {
        const cat = CATEGORIES.find((c) => c.id === i.category);
        lines.push(`  • ${i.name} — ${i.quantity} ${i.unit}${cat ? ` (${t(cat.labelKey)})` : ""}`);
      });
      lines.push("");
    });
    const text = lines.join("\n");
    if (navigator.share) {
      navigator.share({ title: t("shopping.shareTitle"), text });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  if (items.length === 0) {
    return (
      <div className="relative flex-1 overflow-y-auto">
        <div className="px-5 pt-2 pb-24">
          <SmartSuggestionsWidget mode={mode} />
          <div className="flex flex-col items-center justify-center gap-5 py-12">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
              <ShoppingCart size={32} strokeWidth={1.5} style={{ color: "var(--green-primary)" }} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>{t("shopping.empty.title")}</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {t("shopping.empty.subtitle")}
              </p>
            </div>
            <button className="btn-primary" onClick={() => setShowAdd(true)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", maxWidth: 280 }}>
              <Plus size={18} /> {t("shopping.add.title")}
            </button>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center" }}>
              {t("shopping.empty.tip")}
            </p>
          </div>
        </div>

        <VoiceFab onItems={handleVoiceAdd} />

        {showAdd && <AddItemModal onClose={() => setShowAdd(false)} mode={mode} />}
      {editItem && <EditItemModal item={editItem} mode={mode} onClose={() => setEditItem(null)} />}
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="px-5 pt-2 pb-24 space-y-4">
        <SmartSuggestionsWidget mode={mode} />

        {/* Hledání */}
        <div
          className="flex items-center gap-2.5"
          style={{ background: "white", borderRadius: 16, padding: "12px 14px", boxShadow: "var(--shadow)" }}
        >
          <Search size={17} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("shopping.searchPlaceholder")}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: "100%", color: "var(--text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ flexShrink: 0, display: "flex" }}>
              <X size={15} style={{ color: "var(--text-tertiary)" }} />
            </button>
          )}
        </div>

        {/* Segmentový přepínač Vše | Kategorie */}
        <div style={{ display: "flex", background: "#E7E4DC", borderRadius: 14, padding: 4 }}>
          {(["vse", "kategorie"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 11, fontSize: 13, fontWeight: 700,
                background: view === v ? "white" : "transparent",
                color: view === v ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: view === v ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {v === "vse" ? t("shopping.view.all") : t("shopping.view.category")}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            {t("shopping.remaining").replace("{n}", String(unchecked.length))}
          </p>
          {checked.length > 0 && (
            <button onClick={() => removeChecked(mode)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#FDE8E8", color: "#C0392B" }}>
              {t("shopping.removeChecked").replace("{n}", String(checked.length))}
            </button>
          )}
        </div>

        {groups.map(({ name, items: groupItems, isManual }) => (
          <div key={name}>
            {view === "kategorie" ? (
              <p className="text-base font-bold mb-2 px-1" style={{ color: "var(--text-primary)" }}>{name}</p>
            ) : (
              <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>
                {isManual ? `🛒 ${t("shopping.addedManually")}` : `📖 ${name}`}
              </p>
            )}
            <div className="card overflow-hidden">
              {groupItems.map((item, idx) => {
                const cat = CATEGORIES.find((c) => c.id === item.category);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3.5 transition-all"
                    style={{ borderBottom: idx < groupItems.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <button
                      onClick={() => handleCheck(item)}
                      className={`flex-shrink-0 ${justChecked.has(item.id) ? "animate-check-bounce" : ""}`}
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        border: "2.5px solid var(--green-primary)",
                        background: justChecked.has(item.id) ? "var(--green-primary)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.15s",
                      }}
                    >
                      {justChecked.has(item.id) && <Check size={13} color="white" strokeWidth={3} />}
                    </button>
                    <button onClick={() => setEditItem(item)} className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {fmtQty(item.quantity)} {item.unit}
                        {cat && <span style={{ color: "var(--text-tertiary)" }}> · {cat.emoji} {t(cat.labelKey)}</span>}
                        <span style={{ color: "var(--text-tertiary)" }}> · {t("shopping.editHint")}</span>
                      </p>
                    </button>
                    <button onClick={() => removeItem(item.id, mode)}>
                      <X size={14} style={{ color: "var(--text-tertiary)" }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {checked.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>
              {t("shopping.done").replace("{n}", String(checked.length))}
            </p>
            <div className="card overflow-hidden">
              {checked.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3.5 transition-all"
                  style={{ borderBottom: idx < checked.length - 1 ? "1px solid var(--border)" : "none", opacity: 0.5 }}
                >
                  <button
                    onClick={() => handleCheck(item)}
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: "var(--green-primary)", border: "2px solid var(--green-primary)" }}
                  >
                    <Check size={12} color="white" strokeWidth={3} />
                  </button>
                  <p className="text-sm flex-1" style={{ color: "var(--text-secondary)", textDecoration: "line-through" }}>{item.name}</p>
                  <button onClick={() => removeItem(item.id, mode)}>
                    <X size={14} style={{ color: "var(--text-tertiary)" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "white", color: "var(--text-secondary)", border: "1.5px dashed var(--border)" }}
          >
            <Plus size={16} /> {t("shopping.add.title")}
          </button>
          {unchecked.length > 0 && (
            <button
              onClick={shareList}
              className="py-3 px-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--green-light)", color: "var(--green-dark)", border: "1.5px solid var(--green-primary)" }}
            >
              <Share2 size={16} /> {t("shopping.share")}
            </button>
          )}
        </div>

        {items.length > 0 && (
          <button
            onClick={() => clearAll(mode)}
            className="w-full py-2.5 rounded-2xl text-xs font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t("shopping.clearAll")}
          </button>
        )}
      </div>

      <VoiceFab onItems={handleVoiceAdd} />

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} mode={mode} />}
      {editItem && <EditItemModal item={editItem} mode={mode} onClose={() => setEditItem(null)} />}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--green-primary)",
            color: "white",
            borderRadius: 16,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 200,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
          }}
        >
          <Check size={15} strokeWidth={3} /> {toast}
        </div>
      )}
    </div>
  );
}
