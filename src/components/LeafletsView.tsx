"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Plus, Tag } from "lucide-react";
import { useLeafletsStore, Leaflet } from "@/store/leafletsStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useT } from "@/lib/i18n";

// Rychlé přidání položky "co jsem viděl/a na letáku" — bez vazby na
// konkrétní produkt (obrázek stránky se nedá spolehlivě strojově rozpoznat,
// viz rozhodnutí v konverzaci: manuální přidání místo OCR).
function AddFromLeafletModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const t = useT();
  const addItem = useShoppingStore((s) => s.addItem);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("ks");
  const units = ["ks", "g", "kg", "ml", "l", "balení"];

  const handleAdd = () => {
    if (!name.trim()) return;
    addItem({ name: name.trim(), quantity: parseFloat(quantity) || 1, unit, category: "ostatni" }, "domacnost");
    onAdded();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 320, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div className="relative rounded-t-3xl px-5 pt-5 pb-8 animate-slide-up"
        style={{ background: "var(--bg-primary)", paddingBottom: "max(28px, env(safe-area-inset-bottom, 28px))" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("leaflets.addModal.title")}</h3>
          <button onClick={onClose}><X size={20} style={{ color: "var(--text-tertiary)" }} /></button>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("leaflets.addModal.namePlaceholder")}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 14, fontSize: 15, border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)", marginBottom: 10 }}
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="number" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)}
            style={{ width: 90, padding: "12px 14px", borderRadius: 14, fontSize: 15, border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)", textAlign: "center" }}
          />
          <div style={{ flex: 1, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {units.map((u) => (
              <button key={u} onClick={() => setUnit(u)}
                style={{ padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: unit === u ? "var(--green-primary)" : "white", color: unit === u ? "white" : "var(--text-secondary)", border: `1.5px solid ${unit === u ? "var(--green-primary)" : "var(--border)"}` }}>
                {u}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleAdd} disabled={!name.trim()} className="btn-primary" style={{ opacity: name.trim() ? 1 : 0.5 }}>
          <Plus size={16} /> {t("shopping.add.title")}
        </button>
      </div>
    </div>
  );
}

function LeafletPageViewer({ leaflet, onClose }: { leaflet: Leaflet; onClose: () => void }) {
  const t = useT();
  const [pageIdx, setPageIdx] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const page = leaflet.pages[pageIdx];

  const goPrev = () => setPageIdx((i) => Math.max(0, i - 1));
  const goNext = () => setPageIdx((i) => Math.min(leaflet.pages.length - 1, i + 1));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", background: "#111" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", paddingTop: "max(12px, env(safe-area-inset-top, 12px))" }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={18} color="white" />
        </button>
        <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>
          {t("leaflets.pageOf").replace("{n}", String(pageIdx + 1)).replace("{total}", String(leaflet.pages.length))}
        </span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
        <button onClick={goPrev} disabled={pageIdx === 0}
          style={{ position: "absolute", left: 4, zIndex: 2, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", opacity: pageIdx === 0 ? 0.3 : 1 }}>
          <ChevronLeft size={22} color="white" />
        </button>
        {page && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.image_url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        )}
        <button onClick={goNext} disabled={pageIdx === leaflet.pages.length - 1}
          style={{ position: "absolute", right: 4, zIndex: 2, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", opacity: pageIdx === leaflet.pages.length - 1 ? 0.3 : 1 }}>
          <ChevronRight size={22} color="white" />
        </button>
      </div>

      <div style={{ padding: "12px 16px", paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}>
        <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%" }}>
          <Plus size={17} /> {t("leaflets.addFromPage")}
        </button>
      </div>

      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 90, transform: "translateX(-50%)", background: "var(--green-primary)", color: "white", padding: "10px 18px", borderRadius: 99, fontSize: 13, fontWeight: 700, zIndex: 330 }}>
          {toast}
        </div>
      )}

      {showAdd && (
        <AddFromLeafletModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            setToast(t("leaflets.addModal.added"));
            setTimeout(() => setToast(null), 2000);
          }}
        />
      )}
    </div>
  );
}

export function LeafletsView({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { leaflets, loading, loaded, error, fetchLeaflets } = useLeafletsStore();
  const [openLeaflet, setOpenLeaflet] = useState<Leaflet | null>(null);

  useEffect(() => {
    if (!loaded) fetchLeaflets();
  }, [loaded, fetchLeaflets]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 290, display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{t("leaflets.title")}</h2>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={15} style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px" }}>
        {loading && !loaded && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--green-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {loaded && error && (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "40px 0" }}>{t("leaflets.error")}</p>
        )}

        {loaded && !error && leaflets.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Tag size={40} strokeWidth={1.5} style={{ color: "var(--text-tertiary)", marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{t("leaflets.empty.title")}</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("leaflets.empty.subtitle")}</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {leaflets.map((l) => (
            <button key={l.id} onClick={() => setOpenLeaflet(l)}
              style={{ borderRadius: 16, overflow: "hidden", background: "white", boxShadow: "var(--shadow)", textAlign: "left" }}>
              {l.pages[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.pages[0].image_url} alt="" style={{ width: "100%", aspectRatio: "0.7", objectFit: "cover" }} />
              )}
              <div style={{ padding: "8px 10px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--green-dark)", textTransform: "uppercase", margin: 0 }}>
                  {t(`leaflets.retailer.${l.retailer}`)}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {l.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {openLeaflet && <LeafletPageViewer leaflet={openLeaflet} onClose={() => setOpenLeaflet(null)} />}
    </div>
  );
}
