"use client";

import { useState, useCallback, useRef } from "react";
import {
  ClipboardList, Plus, X, ChevronRight,
  AlertTriangle, Check, Truck, Package, BarChart3, Trash2, ScanLine, Keyboard,
  FileText, Download, FileSpreadsheet, Pencil, Share2, Mic, MicOff, Loader, Search
} from "lucide-react";
import { parseSpokenText } from "@/components/VoiceInput";
import {
  useProvozStore,
  INVENTURA_KATEGORIE,
  InventuraKategorie,
  InventuraPolozka,
  Inventura,
} from "@/store/provozStore";
import { lookupProductByEAN } from "@/lib/productLookup";
import { Scanner } from "@/components/Scanner";

// ── Export funkce ─────────────────────────────────────────────────────────────

function exportCSV(inv: Inventura, polozky: InventuraPolozka[]) {
  const rows = [
    ["Název", "Kategorie", "Skutečný stav", "Jednotka", "Min. zásoba", "Cena/jedn.", "Hodnota", "Pod minimem", "Min. trvanlivost do"],
  ];
  inv.zaznamy.forEach(z => {
    const p = polozky.find(p => p.id === z.polozkaId);
    if (!p) return;
    const kat = INVENTURA_KATEGORIE.find(k => k.id === p.kategorie);
    const hodnota = p.cenaJednotka ? (z.skutecnyStav * p.cenaJednotka).toFixed(2) : "";
    const podMin = z.skutecnyStav <= p.minZasoba ? "ANO" : "NE";
    rows.push([
      p.nazev,
      kat?.label ?? p.kategorie,
      String(z.skutecnyStav),
      p.jednotka,
      String(p.minZasoba),
      p.cenaJednotka ? String(p.cenaJednotka) : "",
      hodnota,
      podMin,
      p.minTrvanlivost ?? "",
    ]);
  });
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventura-${inv.nazev.replace(/\s+/g, "-")}-${inv.datum}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(inv: Inventura, polozky: InventuraPolozka[]) {
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import("jspdf"),
    import("html2canvas").then(m => m.default),
  ]);

  // Spočítej celkovou hodnotu
  let celkovaHodnota = 0;
  inv.zaznamy.forEach(z => {
    const p = polozky.find(p => p.id === z.polozkaId);
    if (p?.cenaJednotka) celkovaHodnota += z.skutecnyStav * p.cenaJednotka;
  });

  // Sestav HTML v paměti — použije systémový font prohlížeče, diakritika OK
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:#fff;font-family:system-ui,sans-serif;padding:32px;box-sizing:border-box;";

  const rows = inv.zaznamy.map(z => {
    const p = polozky.find(p => p.id === z.polozkaId);
    const kat = INVENTURA_KATEGORIE.find(k => k.id === p?.kategorie);
    const podMin = p ? z.skutecnyStav <= p.minZasoba : false;
    const hodnota = p?.cenaJednotka ? (z.skutecnyStav * p.cenaJednotka).toLocaleString("cs-CZ") + " Kč" : "—";
    const trv = p?.minTrvanlivost ? new Date(p.minTrvanlivost).toLocaleDateString("cs-CZ") : "—";
    const trvExpired = p?.minTrvanlivost && new Date(p.minTrvanlivost) < new Date();
    const trvSoon = p?.minTrvanlivost && !trvExpired && (new Date(p.minTrvanlivost).getTime() - Date.now()) < 7 * 86400000;
    return `<tr style="background:${podMin ? "#FFF3E0" : ""}">
      <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:${podMin ? "600" : "400"}">${p?.nazev ?? z.polozkaId}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;color:#666">${kat?.label ?? ""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:${podMin ? "#E65100" : "#1a1a1a"}">${z.skutecnyStav} ${p?.jednotka ?? ""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;color:#666">${p?.minZasoba ?? ""} ${p?.jednotka ?? ""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${hodnota}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;color:${trvExpired ? "#C62828" : trvSoon ? "#E65100" : "#666"};font-weight:${trvExpired || trvSoon ? "700" : "400"}">${trv}${trvExpired ? " ⚠️" : ""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-weight:700;color:${podMin ? "#E65100" : "#4CAF82"}">${podMin ? "⚠️" : "✓"}</td>
    </tr>`;
  }).join("");

  container.innerHTML = `
    <div style="background:#4CAF82;color:#fff;padding:12px 16px;border-radius:10px 10px 0 0;display:flex;justify-content:space-between;align-items:center;margin-bottom:0">
      <span style="font-size:13px;font-weight:700;letter-spacing:.05em">INVENTURA</span>
      <span style="font-size:11px;opacity:.85">Spižírna — Provoz</span>
    </div>
    <div style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 10px 10px;padding:20px 20px 16px;margin-bottom:20px">
      <h1 style="margin:0 0 4px;font-size:22px;color:#1a1a1a">${inv.nazev}</h1>
      <p style="margin:0;font-size:12px;color:#888">Datum: ${inv.datum} &nbsp;·&nbsp; Počet položek: ${inv.zaznamy.length} &nbsp;·&nbsp; Vygenerováno: ${new Date().toLocaleDateString("cs-CZ")}</p>
      ${celkovaHodnota > 0 ? `<div style="margin-top:12px;background:#F1FAF5;border:1px solid #4CAF82;border-radius:8px;padding:10px 14px;display:inline-block"><span style="font-size:13px;font-weight:700;color:#2E7D32">Celková hodnota skladu: ${celkovaHodnota.toLocaleString("cs-CZ")} Kč</span></div>` : ""}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#2d2d2d;color:#fff">
          <th style="padding:8px;text-align:left;border-radius:6px 0 0 0">Název</th>
          <th style="padding:8px;text-align:left">Kategorie</th>
          <th style="padding:8px;text-align:right">Skutečný stav</th>
          <th style="padding:8px;text-align:right">Min. zásoba</th>
          <th style="padding:8px;text-align:right">Hodnota</th>
          <th style="padding:8px;text-align:center">Min. trvanlivost</th>
          <th style="padding:8px;text-align:center;border-radius:0 6px 0 0">OK?</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;font-size:10px;color:#bbb;text-align:right">Spižírna &mdash; Provoz &amp; Inventura</p>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#fff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const pageH = 297;
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    // Rozděl na stránky pokud je tabulka delší
    let posY = 0;
    while (posY < imgH) {
      if (posY > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -posY, imgW, imgH);
      posY += pageH;
    }

    pdf.save(`inventura-${inv.nazev.replace(/[\s/\\]/g, "-")}-${inv.datum}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trvanlivostStatus(datum?: string): { label: string; color: string; bg: string } | null {
  if (!datum) return null;
  const dnes = new Date();
  dnes.setHours(0, 0, 0, 0);
  const exp = new Date(datum);
  const diffDni = Math.round((exp.getTime() - dnes.getTime()) / 86400000);
  if (diffDni < 0) return { label: `Vypršelo před ${Math.abs(diffDni)} dny`, color: "#C62828", bg: "#FFEBEE" };
  if (diffDni === 0) return { label: "Vyprší dnes!", color: "#E65100", bg: "#FFF3E0" };
  if (diffDni <= 3) return { label: `Vyprší za ${diffDni} ${diffDni === 1 ? "den" : diffDni <= 4 ? "dny" : "dní"}`, color: "#E65100", bg: "#FFF3E0" };
  if (diffDni <= 7) return { label: `Vyprší za ${diffDni} dní`, color: "#F9A825", bg: "#FFFDE7" };
  const d = exp.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
  return { label: `Min. trvanlivost: ${d}`, color: "var(--text-secondary)", bg: "transparent" };
}

// ── Formulář nové položky skladu ──────────────────────────────────────────────
function AddPolozkaModal({ onClose }: { onClose: () => void }) {
  const { addPolozka } = useProvozStore();
  const [nazev, setNazev] = useState("");
  const [kategorie, setKategorie] = useState<InventuraKategorie>("potraviny");
  const [jednotka, setJednotka] = useState("ks");
  const [minZasoba, setMinZasoba] = useState("1");
  const [cena, setCena] = useState("");
  const [dodavatel, setDodavatel] = useState("");
  const [minTrvanlivost, setMinTrvanlivost] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [eanInput, setEanInput] = useState("");
  const [inputMode, setInputMode] = useState<"name" | "ean">("name");
  const JEDNOTKY = ["ks", "l", "dl", "ml", "kg", "g", "lahev", "balení", "porce"];

  const handleEanScanned = useCallback(async (ean: string) => {
    setShowScanner(false);
    setScanLoading(true);
    try {
      const product = await lookupProductByEAN(ean);
      if (product) {
        setNazev(product.product_name || ean);
        if (product.unit === "ml") {
          setJednotka("l");
        } else if (product.unit === "g") {
          setJednotka("kg");
        }
      } else {
        setNazev(ean);
      }
    } finally {
      setScanLoading(false);
    }
  }, []);

  const handleEanManual = async () => {
    if (!eanInput.trim()) return;
    setScanLoading(true);
    try {
      const product = await lookupProductByEAN(eanInput.trim());
      if (product) {
        setNazev(product.product_name || eanInput.trim());
        if (product.unit === "ml") {
          setJednotka("l");
        } else if (product.unit === "g") {
          setJednotka("kg");
        }
      } else {
        setNazev(eanInput.trim());
      }
      setInputMode("name");
      setEanInput("");
    } finally {
      setScanLoading(false);
    }
  };

  const save = () => {
    if (!nazev.trim()) return;
    addPolozka({
      nazev: nazev.trim(),
      kategorie,
      jednotka,
      minZasoba: parseFloat(minZasoba) || 1,
      cenaJednotka: cena ? parseFloat(cena) : undefined,
      dodavatel: dodavatel.trim() || undefined,
      minTrvanlivost: minTrvanlivost || undefined,
    });
    onClose();
  };

  // Full-screen embedded scanner
  if (showScanner) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column" }}>
        <Scanner onScanned={handleEanScanned} onClose={() => setShowScanner(false)} />
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div className="relative rounded-t-3xl px-5 pt-5 pb-8 space-y-4 animate-slide-up"
        style={{ background: "var(--bg-primary)", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))", maxHeight: "90dvh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Nová položka skladu</h3>
          <button onClick={onClose}><X size={20} style={{ color: "var(--text-tertiary)" }} /></button>
        </div>

        {/* Způsob zadání — EAN nebo ručně */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setInputMode("name")}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 0", borderRadius: 14, fontSize: 13, fontWeight: 600,
              background: inputMode === "name" ? "var(--green-primary)" : "white",
              color: inputMode === "name" ? "white" : "var(--text-secondary)",
              border: `1.5px solid ${inputMode === "name" ? "var(--green-primary)" : "var(--border)"}`,
            }}
          >
            <Keyboard size={14} /> Zadat ručně
          </button>
          <button
            onClick={() => setInputMode("ean")}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 0", borderRadius: 14, fontSize: 13, fontWeight: 600,
              background: inputMode === "ean" ? "var(--green-primary)" : "white",
              color: inputMode === "ean" ? "white" : "var(--text-secondary)",
              border: `1.5px solid ${inputMode === "ean" ? "var(--green-primary)" : "var(--border)"}`,
            }}
          >
            <ScanLine size={14} /> Skenovat EAN
          </button>
        </div>

        {inputMode === "ean" ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowScanner(true)}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 16, fontSize: 14, fontWeight: 700,
                background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
                color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 14px rgba(76,175,130,0.4)",
              }}
            >
              <ScanLine size={18} /> Otevřít fotoaparát
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>nebo zadat EAN číslo</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={eanInput}
                onChange={e => setEanInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEanManual()}
                placeholder="např. 8594013425054"
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 14, fontSize: 14, fontWeight: 600,
                  border: "1.5px solid var(--border)", background: "white", outline: "none",
                  color: "var(--text-primary)", letterSpacing: "0.1em",
                }}
              />
              <button
                onClick={handleEanManual}
                disabled={eanInput.length < 6 || scanLoading}
                style={{
                  padding: "10px 16px", borderRadius: 14, fontSize: 13, fontWeight: 700,
                  background: eanInput.length >= 6 ? "var(--green-primary)" : "var(--border)",
                  color: eanInput.length >= 6 ? "white" : "var(--text-tertiary)",
                }}
              >
                {scanLoading ? "..." : "Hledat"}
              </button>
            </div>
            {nazev && (
              <div style={{ padding: "10px 14px", borderRadius: 14, background: "var(--green-light)", border: "1px solid var(--green-primary)" }}>
                <p style={{ fontSize: 12, color: "var(--green-dark)", fontWeight: 600 }}>✓ Nalezeno: {nazev}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Název</label>
            <input
              autoFocus value={nazev} onChange={e => setNazev(e.target.value)}
              placeholder="např. Kuřecí prsa, Vodka Absolut..."
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }}
            />
          </div>
        )}

        {/* Zbytek formuláře — vždy viditelný pokud máme název */}
        {(nazev.trim() || inputMode === "name") && (
          <>
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-tertiary)" }}>Kategorie</label>
              <div className="grid grid-cols-2 gap-2">
                {INVENTURA_KATEGORIE.map((k) => (
                  <button key={k.id} onClick={() => setKategorie(k.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left"
                    style={{
                      background: kategorie === k.id ? "var(--green-light)" : "white",
                      border: `1.5px solid ${kategorie === k.id ? "var(--green-primary)" : "var(--border)"}`,
                      color: kategorie === k.id ? "var(--green-dark)" : "var(--text-primary)",
                    }}>
                    <span>{k.emoji}</span> {k.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Jednotka</label>
                <select value={jednotka} onChange={e => setJednotka(e.target.value)}
                  style={{ width: "100%", background: "white", border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 14, outline: "none", color: "var(--text-primary)" }}>
                  {JEDNOTKY.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Min. zásoba</label>
                <input type="number" value={minZasoba} onChange={e => setMinZasoba(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none text-center"
                  style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
              </div>
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Cena/jedn. (Kč)</label>
                <input type="number" value={cena} onChange={e => setCena(e.target.value)} placeholder="volitelné"
                  className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Dodavatel</label>
                <input value={dodavatel} onChange={e => setDodavatel(e.target.value)} placeholder="volitelné"
                  className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Min. trvanlivost do</label>
              <input type="date" value={minTrvanlivost} onChange={e => setMinTrvanlivost(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "white", color: minTrvanlivost ? "var(--text-primary)" : "var(--text-tertiary)" }} />
            </div>
          </>
        )}

        <button onClick={save} className="btn-primary" disabled={!nazev.trim()}>
          <Plus size={16} /> Přidat položku
        </button>
      </div>
    </div>
  );
}

// ── Aktivní inventura — zadávání stavů ────────────────────────────────────────
function AktivniInventura({ inventura }: { inventura: Inventura }) {
  const { polozky, zadatZaznam, zavritInventuru, getHodnotaSkladu } = useProvozStore();
  const [aktivniKat, setAktivniKat] = useState<InventuraKategorie | "vse">("vse");
  const [vstupy, setVstupy] = useState<Record<string, string>>({});
  const [ulozeno, setUlozeno] = useState<Set<string>>(new Set());
  const [showZavrit, setShowZavrit] = useState(false);

  const hodnotaSkladu = getHodnotaSkladu(inventura.id);

  const kategoriePouzite = INVENTURA_KATEGORIE.filter(k =>
    polozky.some(p => p.kategorie === k.id)
  );

  const filtrovane = polozky.filter(p =>
    aktivniKat === "vse" || p.kategorie === aktivniKat
  );

  const zaznamMap: Record<string, number> = {};
  inventura.zaznamy.forEach(z => { zaznamMap[z.polozkaId] = z.skutecnyStav; });

  const handleUlozit = (polozka: InventuraPolozka) => {
    const val = parseFloat(vstupy[polozka.id] ?? "");
    if (isNaN(val)) return;
    zadatZaznam(inventura.id, polozka.id, val);
    setUlozeno(prev => new Set(prev).add(polozka.id));
    setTimeout(() => setUlozeno(prev => { const s = new Set(prev); s.delete(polozka.id); return s; }), 1500);
  };

  const zadano = inventura.zaznamy.length;
  const celkem = polozky.length;
  const progress = celkem > 0 ? Math.round((zadano / celkem) * 100) : 0;

  return (
    <div>
      {/* Progress header */}
      <div className="hero-card mb-4" style={{ padding: "16px" }}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Probíhající inventura
            </p>
            <h3 className="font-bold text-lg" style={{ color: "white" }}>{inventura.nazev}</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{inventura.datum}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: "white", lineHeight: 1 }}>{zadano}/{celkem}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>položek</p>
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", borderRadius: 6, background: "white", width: `${progress}%`, transition: "width 0.4s ease" }} />
        </div>
        {hodnotaSkladu > 0 && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 10 }}>
            💰 Hodnota skladu: <b>{hodnotaSkladu.toLocaleString("cs-CZ")} Kč</b>
          </p>
        )}
        <button
          onClick={() => setShowZavrit(true)}
          style={{ width: "100%", padding: "9px 0", borderRadius: 14, fontSize: 13, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
        >
          Uzavřít inventuru
        </button>
      </div>

      {/* Potvrzení uzavření */}
      {showZavrit && (
        <div className="card p-4 mb-4 animate-fade-in" style={{ background: "#FFF3E0", border: "1px solid #FFE0B2" }}>
          <p className="text-sm font-bold mb-2" style={{ color: "#E65100" }}>Uzavřít inventuru?</p>
          <p className="text-xs mb-3" style={{ color: "#BF360C" }}>Po uzavření nelze editovat zadané stavy.</p>
          <div className="flex gap-2">
            <button onClick={() => zavritInventuru(inventura.id)} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: "#E65100", color: "white" }}>
              Ano, uzavřít
            </button>
            <button onClick={() => setShowZavrit(false)} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>
              Zpět
            </button>
          </div>
        </div>
      )}

      {/* Kategorie filter */}
      {kategoriePouzite.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", marginBottom: 12 }}>
          <button
            onClick={() => setAktivniKat("vse")}
            style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: aktivniKat === "vse" ? 700 : 500, background: aktivniKat === "vse" ? "var(--green-primary)" : "white", color: aktivniKat === "vse" ? "white" : "var(--text-secondary)", border: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            Vše ({celkem})
          </button>
          {kategoriePouzite.map(k => {
            const pocet = polozky.filter(p => p.kategorie === k.id).length;
            return (
              <button key={k.id} onClick={() => setAktivniKat(k.id)}
                style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: aktivniKat === k.id ? 700 : 500, background: aktivniKat === k.id ? "var(--green-primary)" : "white", color: aktivniKat === k.id ? "white" : "var(--text-secondary)", border: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", whiteSpace: "nowrap" }}>
                {k.emoji} {k.label} ({pocet})
              </button>
            );
          })}
        </div>
      )}

      {/* Položky */}
      {filtrovane.length === 0 ? (
        <div className="text-center py-8">
          <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>Žádné položky v této kategorii</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtrovane.map((polozka, idx) => {
            const zaznam = zaznamMap[polozka.id];
            const jePod = zaznam !== undefined && zaznam <= polozka.minZasoba;
            const jeUlozeno = ulozeno.has(polozka.id);
            const kat = INVENTURA_KATEGORIE.find(k => k.id === polozka.kategorie);
            return (
              <div key={polozka.id}
                style={{ borderBottom: idx < filtrovane.length - 1 ? "1px solid var(--border)" : "none", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15 }}>{kat?.emoji}</span>
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{polozka.nazev}</p>
                      {jePod && <AlertTriangle size={13} style={{ color: "#F57C00", flexShrink: 0 }} />}
                    </div>
                    {zaznam !== undefined && (
                      <p style={{ fontSize: 12, color: jePod ? "#F57C00" : "var(--text-secondary)", marginTop: 2 }}>
                        {zaznam} {polozka.jednotka}
                        {jePod ? " — pod minimem!" : " ✓"}
                        {polozka.cenaJednotka ? ` · ${(zaznam * polozka.cenaJednotka).toLocaleString("cs-CZ")} Kč` : ""}
                      </p>
                    )}
                    {(() => {
                      const s = trvanlivostStatus(polozka.minTrvanlivost);
                      if (!s) return null;
                      return (
                        <p style={{ fontSize: 11, color: s.color, marginTop: 2 }}>🗓 {s.label}</p>
                      );
                    })()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <input
                      type="number"
                      value={vstupy[polozka.id] ?? (zaznam !== undefined ? String(zaznam) : "")}
                      onChange={e => setVstupy(prev => ({ ...prev, [polozka.id]: e.target.value }))}
                      placeholder="0"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          handleUlozit(polozka);
                          const inputs = document.querySelectorAll<HTMLInputElement>('input[type="number"][placeholder="0"]');
                          const arr = Array.from(inputs);
                          const idx = arr.indexOf(e.target as HTMLInputElement);
                          if (idx >= 0 && idx < arr.length - 1) arr[idx + 1].focus();
                        }
                      }}
                      style={{ width: 70, textAlign: "center", padding: "8px 6px", borderRadius: 12, fontSize: 15, fontWeight: 700, border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)" }}
                    />
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)", minWidth: 28 }}>{polozka.jednotka}</span>
                    <button
                      onClick={() => handleUlozit(polozka)}
                      style={{
                        width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: jeUlozeno ? "var(--green-primary)" : "var(--green-light)",
                        transition: "all 0.2s",
                      }}
                    >
                      <Check size={16} style={{ color: jeUlozeno ? "white" : "var(--green-primary)" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Přehled minulých inventur ─────────────────────────────────────────────────
function HistorieInventur() {
  const { inventury, polozky, removeInventura, getHodnotaSkladu } = useProvozStore();
  const [otevreneId, setOtevreneId] = useState<string | null>(null);
  const zavrene = inventury.filter(i => i.zavrena);

  if (zavrene.length === 0) return (
    <div className="text-center py-8">
      <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>Zatím žádná uzavřená inventura</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {zavrene.map(inv => {
        const hodnota = getHodnotaSkladu(inv.id);
        const zaznamy = inv.zaznamy.map(z => {
          const p = polozky.find(p => p.id === z.polozkaId);
          const kat = INVENTURA_KATEGORIE.find(k => k.id === p?.kategorie);
          const podMin = p ? z.skutecnyStav <= p.minZasoba : false;
          return { ...z, polozka: p, kat, podMin };
        });
        const podMin = zaznamy.filter(z => z.podMin).length;
        const otevreno = otevreneId === inv.id;

        return (
          <div key={inv.id} className="card overflow-hidden">
            {/* Hlavička — kliknutím rozklikne */}
            <button
              onClick={() => setOtevreneId(otevreno ? null : inv.id)}
              style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{inv.nazev}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{inv.datum} · {inv.zaznamy.length} položek</p>
                <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                  {hodnota > 0 && <span style={{ fontSize: 11, color: "var(--green-primary)", fontWeight: 600 }}>💰 {hodnota.toLocaleString("cs-CZ")} Kč</span>}
                  {podMin > 0 && <span style={{ fontSize: 11, color: "#F57C00", fontWeight: 600 }}>⚠️ {podMin} pod minimem</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <ChevronRight size={16} style={{ color: "var(--text-tertiary)", transform: otevreno ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                <button
                  onClick={e => { e.stopPropagation(); exportCSV(inv, polozky); }}
                  style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#E8F5E9" }}
                  title="Stáhnout CSV (Excel)"
                >
                  <FileSpreadsheet size={14} style={{ color: "#2E7D32" }} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); exportPDF(inv, polozky); }}
                  style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#FDE8E8" }}
                  title="Stáhnout PDF"
                >
                  <FileText size={14} style={{ color: "#C0392B" }} />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const text = `📋 Inventura: ${inv.nazev}\n📅 ${inv.datum}\n📦 ${inv.zaznamy.length} položek${hodnota > 0 ? `\n💰 Hodnota: ${hodnota.toLocaleString("cs-CZ")} Kč` : ""}\n${zaznamy.filter(z => z.podMin).length > 0 ? `⚠️ ${zaznamy.filter(z => z.podMin).length} pod minimem` : ""}`;
                    if (navigator.share) navigator.share({ title: inv.nazev, text });
                    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#E8F4FD" }}
                  title="Sdílet"
                >
                  <Share2 size={14} style={{ color: "#1565C0" }} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); removeInventura(inv.id); }}
                  style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--border)" }}
                >
                  <Trash2 size={14} style={{ color: "var(--text-tertiary)" }} />
                </button>
              </div>
            </button>

            {/* Detail položek */}
            {otevreno && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {zaznamy.length === 0 ? (
                  <p style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-tertiary)" }}>Žádné záznamy</p>
                ) : (
                  zaznamy.map((z, idx) => (
                    <div
                      key={z.polozkaId}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 16px",
                        borderBottom: idx < zaznamy.length - 1 ? "1px solid var(--border)" : "none",
                        background: z.podMin ? "#FFF8F0" : "white",
                      }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{z.kat?.emoji ?? "📦"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                          {z.polozka?.nazev ?? z.polozkaId}
                        </p>
                        {z.polozka && (
                          <p style={{ fontSize: 11, color: z.podMin ? "#F57C00" : "var(--text-secondary)", margin: 0 }}>
                            Min. {z.polozka.minZasoba} {z.polozka.jednotka}
                            {z.podMin ? " — pod minimem!" : ""}
                          </p>
                        )}
                        {(() => {
                          const s = trvanlivostStatus(z.polozka?.minTrvanlivost);
                          if (!s) return null;
                          return <p style={{ fontSize: 11, color: s.color, margin: 0 }}>🗓 {s.label}</p>;
                        })()}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: z.podMin ? "#E65100" : "var(--text-primary)", margin: 0 }}>
                          {z.skutecnyStav} {z.polozka?.jednotka ?? ""}
                        </p>
                        {z.polozka?.cenaJednotka && (
                          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>
                            {(z.skutecnyStav * z.polozka.cenaJednotka).toLocaleString("cs-CZ")} Kč
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Editace položky skladu ────────────────────────────────────────────────────
function EditPolozkaModal({ polozka, onClose }: { polozka: InventuraPolozka; onClose: () => void }) {
  const { updatePolozka } = useProvozStore();
  const [nazev, setNazev] = useState(polozka.nazev);
  const [jednotka, setJednotka] = useState(polozka.jednotka);
  const [minZasoba, setMinZasoba] = useState(String(polozka.minZasoba));
  const [cena, setCena] = useState(polozka.cenaJednotka ? String(polozka.cenaJednotka) : "");
  const [dodavatel, setDodavatel] = useState(polozka.dodavatel ?? "");
  const [minTrvanlivost, setMinTrvanlivost] = useState(polozka.minTrvanlivost ?? "");
  const JEDNOTKY = ["ks", "l", "dl", "ml", "kg", "g", "lahev", "balení", "porce"];

  const save = () => {
    updatePolozka(polozka.id, {
      nazev: nazev.trim(),
      jednotka,
      minZasoba: parseFloat(minZasoba) || 1,
      cenaJednotka: cena ? parseFloat(cena) : undefined,
      dodavatel: dodavatel.trim() || undefined,
      minTrvanlivost: minTrvanlivost || undefined,
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div className="relative rounded-t-3xl px-5 pt-5 pb-8 space-y-4 animate-slide-up"
        style={{ background: "var(--bg-primary)", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))", maxHeight: "90dvh", overflowY: "auto" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Upravit položku</h3>
          <button onClick={onClose}><X size={20} style={{ color: "var(--text-tertiary)" }} /></button>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Název</label>
          <input value={nazev} onChange={e => setNazev(e.target.value)} autoFocus
            className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
            style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
        </div>
        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Jednotka</label>
            <select value={jednotka} onChange={e => setJednotka(e.target.value)}
              style={{ width: "100%", background: "white", border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 14, outline: "none", color: "var(--text-primary)" }}>
              {JEDNOTKY.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Min. zásoba</label>
            <input type="number" value={minZasoba} onChange={e => setMinZasoba(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none text-center"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
        </div>
        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Cena/jedn. (Kč)</label>
            <input type="number" value={cena} onChange={e => setCena(e.target.value)} placeholder="volitelné"
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Dodavatel</label>
            <input value={dodavatel} onChange={e => setDodavatel(e.target.value)} placeholder="volitelné"
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Min. trvanlivost do</label>
          <input type="date" value={minTrvanlivost} onChange={e => setMinTrvanlivost(e.target.value)}
            className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
            style={{ border: "1.5px solid var(--border)", background: "white", color: minTrvanlivost ? "var(--text-primary)" : "var(--text-tertiary)" }} />
        </div>
        <button onClick={save} className="btn-primary" disabled={!nazev.trim()}>
          <Check size={16} /> Uložit změny
        </button>
      </div>
    </div>
  );
}

// Odhad skladové kategorie podle názvu (vlastní pro Provoz — jiný výčet než Nákup)
function guessSkladKategorie(name: string): InventuraKategorie {
  const n = name.toLowerCase();
  const has = (...kw: string[]) => kw.some((k) => n.includes(k));
  if (has("víno", "vino", "pivo", "rum", "vodka", "whisky", "becher", "fernet", "likér", "liker", "tequila", "gin", "alkohol", "sekt", "šampaň", "sampan")) return "alkohol";
  if (has("kuř", "kur", "hověz", "hovez", "vepřov", "veprov", "maso", "šunk", "sunk", "salám", "salam", "klobás", "klobas", "ryb", "losos", "filet", "mlet")) return "maso-ryby";
  if (has("mlék", "mlek", "másl", "masl", "sýr", "syr", "jogurt", "tvaroh", "smetan", "vejc", "vajíčk", "vajick")) return "mlecne";
  if (has("brambor", "cibul", "česnek", "cesnek", "rajč", "rajc", "paprik", "okurk", "mrkev", "mrkv", "jablk", "banán", "banan", "salát", "salat", "zelenin", "ovoce")) return "ovoce-zelenina";
  if (has("mouk", "cukr", "rýže", "ryze", "těstovin", "testovin", "luštěn", "lusten", "olej", "ocet", "koření", "koreni", "konzerv", "rýži", "ryzi")) return "suche-zbozi";
  if (has("voda", "vody", "džus", "dzus", "limonád", "limonad", "kofol", "cola", "kola", "sirup", "minerálk", "mineralk")) return "napoje-nealkohol";
  if (has("chléb", "chleb", "pečiv", "peciv", "rohlík", "rohlik", "housk")) return "potraviny";
  return "ostatni";
}

// Samostatný hlasový mikrofon pro sklad Provozu (oddělený od Nákupu).
// Naparsované položky zakládá rovnou do skladu Provozu.
function SkladVoiceFab({ onItems }: { onItems: (items: { name: string; quantity: number; unit: string }[]) => void }) {
  const [state, setState] = useState<"idle" | "listening" | "processing">("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const start = () => {
    setError(null);
    setTranscript("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Prohlížeč nepodporuje hlasové zadávání. Zkuste Chrome nebo Safari.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "cs-CZ";
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
          if (items.length > 0) onItems(items);
          else setError("Nerozuměl jsem. Zkuste to znovu.");
          setState("idle");
          setTranscript("");
        }, 300);
      }
    };
    recognition.onerror = (event: any) => {
      setError(event.error === "not-allowed" ? "Přístup k mikrofonu byl odmítnut." : "Nic jsem neslyšel. Zkuste znovu.");
      setState("idle");
    };
    recognition.onend = () => setState((s) => (s === "listening" ? "idle" : s));
    recognition.start();
  };

  const stop = () => { recognitionRef.current?.stop(); setState("idle"); };
  const listening = state === "listening";

  return (
    <>
      {(listening || error) && (
        <div
          onClick={() => setError(null)}
          style={{
            position: "fixed", right: 20,
            bottom: "calc(158px + env(safe-area-inset-bottom, 0px))",
            maxWidth: 280, background: "rgba(0,0,0,0.78)", color: "white",
            borderRadius: 14, padding: "10px 14px", fontSize: 13, lineHeight: 1.45, zIndex: 60,
          }}
        >
          {error ? error : transcript ? `„${transcript}"` : "Poslouchám… např. „dvanáct lahví vína, pět kilo mouky\""}
        </div>
      )}
      <button
        onClick={listening ? stop : start}
        aria-label="Přidat položku hlasem"
        style={{
          position: "fixed", right: 20,
          bottom: "calc(92px + env(safe-area-inset-bottom, 0px))",
          width: 56, height: 56, borderRadius: "50%",
          background: listening
            ? "linear-gradient(135deg, #F08A8A 0%, #D95757 100%)"
            : "linear-gradient(135deg, #F7B267 0%, #E8862E 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: listening ? "0 8px 20px rgba(217,87,87,0.5)" : "0 8px 20px rgba(232,134,46,0.45)",
          zIndex: 50, transition: "background 0.2s ease",
        }}
      >
        {state === "processing" ? <Loader size={22} color="white" className="animate-spin" />
          : listening ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
      </button>
    </>
  );
}

// ── Správa skladu (seznam položek) ────────────────────────────────────────────
function SpravaSkladu() {
  const { polozky, inventury, removePolozka, getPolozkyCritical, addPolozka } = useProvozStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const critical = getPolozkyCritical();

  // Hlasem nadiktované položky se rovnou založí do skladu Provozu
  const handleVoiceAdd = (items: { name: string; quantity: number; unit: string }[]) => {
    items.forEach((it) => {
      addPolozka({
        nazev: it.name,
        kategorie: guessSkladKategorie(it.name),
        jednotka: it.unit,
        minZasoba: 0,
      });
    });
    setToast(items.length === 1 ? `${items[0].name} přidáno do skladu` : `${items.length} položky přidány do skladu`);
    setTimeout(() => setToast(null), 3000);
  };

  // Vypočítej poslední stav každé položky
  const posledniStav: Record<string, number> = {};
  [...inventury].sort((a, b) => b.datum.localeCompare(a.datum)).forEach(inv => {
    inv.zaznamy.forEach(z => {
      if (posledniStav[z.polozkaId] === undefined) {
        posledniStav[z.polozkaId] = z.skutecnyStav;
      }
    });
  });

  const q = search.trim().toLowerCase();
  const filtrovane = q ? polozky.filter(p => p.nazev.toLowerCase().includes(q)) : polozky;
  const byKategorie = INVENTURA_KATEGORIE.map(k => ({
    ...k,
    polozky: filtrovane.filter(p => p.kategorie === k.id),
  })).filter(k => k.polozky.length > 0);

  return (
    <div>
      {critical.length > 0 && (
        <div className="rounded-2xl p-3.5 mb-4 flex items-start gap-3" style={{ background: "#FFF3E0", border: "1px solid #FFE0B2" }}>
          <AlertTriangle size={16} style={{ color: "#F57C00", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#E65100" }}>
              {critical.length} položek pod minimální zásobou!
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#BF360C" }}>
              {critical.slice(0, 3).map(p => p.nazev).join(", ")}{critical.length > 3 ? ` a ${critical.length - 3} další` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Hledání ve skladu — jen pokud nějaké položky jsou */}
      {polozky.length > 0 && (
        <div
          className="flex items-center gap-2.5 mb-4"
          style={{ background: "white", borderRadius: 16, padding: "12px 14px", boxShadow: "var(--shadow)" }}
        >
          <Search size={17} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat ve skladu..."
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: "100%", color: "var(--text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ flexShrink: 0, display: "flex" }}>
              <X size={15} style={{ color: "var(--text-tertiary)" }} />
            </button>
          )}
        </div>
      )}

      {byKategorie.length === 0 ? (
        q ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Nic nenalezeno pro „{search}“</p>
          </div>
        ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
            <Package size={28} style={{ color: "var(--green-primary)" }} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>Sklad je prázdný</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Přidejte položky které chcete inventarizovat.</p>
          </div>
          <button className="btn-primary" style={{ width: "auto", paddingLeft: 24, paddingRight: 24 }} onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Přidat položku
          </button>
        </div>
        )
      ) : (
        <div className="space-y-4">
          {byKategorie.map(k => (
            <div key={k.id}>
              <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>
                {k.emoji} {k.label}
              </p>
              <div className="card overflow-hidden">
                {k.polozky.map((p, idx) => {
                  const isCritical = critical.some(c => c.id === p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: idx < k.polozky.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.nazev}</p>
                        <p className="text-xs" style={{ color: isCritical ? "#F57C00" : "var(--text-secondary)" }}>
                          Min. {p.minZasoba} {p.jednotka}
                          {p.dodavatel ? ` · ${p.dodavatel}` : ""}
                          {isCritical ? " ⚠️" : ""}
                        </p>
                        {(() => {
                          const s = trvanlivostStatus(p.minTrvanlivost);
                          if (!s) return null;
                          return (
                            <p className="text-xs font-semibold mt-0.5" style={{ color: s.color }}>
                              🗓 {s.label}
                            </p>
                          );
                        })()}
                      </div>
                      {p.cenaJednotka && (
                        <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                          {p.cenaJednotka} Kč/{p.jednotka}
                        </span>
                      )}
                      {posledniStav[p.id] !== undefined && (
                        <span className="text-xs font-bold" style={{ color: posledniStav[p.id] <= p.minZasoba ? "#E65100" : "var(--green-primary)" }}>
                          {posledniStav[p.id]} {p.jednotka}
                        </span>
                      )}
                      <button onClick={() => setEditId(p.id)} style={{ marginRight: 4 }}>
                        <Pencil size={14} style={{ color: "var(--text-tertiary)" }} />
                      </button>
                      <button onClick={() => removePolozka(p.id)}>
                        <X size={15} style={{ color: "var(--text-tertiary)" }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "white", color: "var(--green-primary)", border: "1.5px dashed var(--green-primary)" }}
          >
            <Plus size={16} /> Přidat položku
          </button>
        </div>
      )}

      {showAdd && <AddPolozkaModal onClose={() => setShowAdd(false)} />}
      {editId && <EditPolozkaModal polozka={polozky.find(p => p.id === editId)!} onClose={() => setEditId(null)} />}

      <SkladVoiceFab onItems={handleVoiceAdd} />

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
            left: "50%", transform: "translateX(-50%)",
            background: "var(--green-primary)", color: "white",
            borderRadius: 16, padding: "10px 18px",
            fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
            zIndex: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", whiteSpace: "nowrap",
          }}
        >
          <Check size={15} strokeWidth={3} /> {toast}
        </div>
      )}
    </div>
  );
}

// ── Dodavatelé ────────────────────────────────────────────────────────────────
function DodavateleView() {
  const { dodavatele, addDodavatel, removeDodavatel } = useProvozStore();
  const [showAdd, setShowAdd] = useState(false);
  const [nazev, setNazev] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [poznamka, setPoznamka] = useState("");

  const save = () => {
    if (!nazev.trim()) return;
    addDodavatel({ nazev: nazev.trim(), telefon: telefon.trim() || undefined, email: email.trim() || undefined, poznamka: poznamka.trim() || undefined });
    setNazev(""); setTelefon(""); setEmail(""); setPoznamka("");
    setShowAdd(false);
  };

  return (
    <div>
      {dodavatele.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
            <Truck size={28} style={{ color: "var(--green-primary)" }} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>Žádní dodavatelé</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Přidejte dodavatele pro rychlý přístup ke kontaktům.</p>
          </div>
          <button className="btn-primary" style={{ width: "auto", paddingLeft: 24, paddingRight: 24 }} onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Přidat dodavatele
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {dodavatele.map(d => (
            <div key={d.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{d.nazev}</p>
                  {d.telefon && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>📞 {d.telefon}</p>}
                  {d.email && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>✉️ {d.email}</p>}
                  {d.poznamka && <p className="text-xs mt-0.5 italic" style={{ color: "var(--text-tertiary)" }}>{d.poznamka}</p>}
                </div>
                <div className="flex gap-2">
                  {d.telefon && (
                    <a href={`tel:${d.telefon}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "var(--green-light)" }}>
                      <span style={{ fontSize: 14 }}>📞</span>
                    </a>
                  )}
                  {d.email && (
                    <a href={`mailto:${d.email}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "#FDEBD7" }}>
                      <span style={{ fontSize: 14 }}>✉️</span>
                    </a>
                  )}
                  <button onClick={() => removeDodavatel(d.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "#FDE8E8" }}>
                    <Trash2 size={13} style={{ color: "#C0392B" }} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {showAdd ? (
            <div className="card p-4 space-y-3 animate-fade-in">
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Nový dodavatel</p>
              {[
                { label: "Název *", value: nazev, set: setNazev, placeholder: "Makro, Albert, řezník..." },
                { label: "Telefon", value: telefon, set: setTelefon, placeholder: "+420 xxx xxx xxx" },
                { label: "Email", value: email, set: setEmail, placeholder: "objednavky@..." },
                { label: "Poznámka", value: poznamka, set: setPoznamka, placeholder: "Pondělí–Pátek do 10h..." },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-2xl text-sm font-bold" style={{ background: "var(--green-primary)", color: "white" }}>
                  Uložit
                </button>
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-2xl text-sm font-bold" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>
                  Zrušit
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)}
              className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "white", color: "var(--green-primary)", border: "1.5px dashed var(--green-primary)" }}>
              <Plus size={16} /> Přidat dodavatele
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Co dokoupit (kritické zásoby) ─────────────────────────────────────────────
function CoDokoupit() {
  const { polozky, getPolozkyCritical } = useProvozStore();
  const critical = getPolozkyCritical();
  if (critical.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#E65100", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
        🛒 Co dokoupit ({critical.length})
      </p>
      <div style={{ background: "#FFF3E0", border: "1px solid #FFE0B2", borderRadius: 16, overflow: "hidden" }}>
        {critical.map((p, idx) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: idx < critical.length - 1 ? "1px solid #FFE0B2" : "none" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#BF360C", margin: 0 }}>{p.nazev}</p>
              <p style={{ fontSize: 11, color: "#E65100", margin: 0 }}>Min. zásoba: {p.minZasoba} {p.jednotka}</p>
            </div>
            <AlertTriangle size={16} style={{ color: "#F57C00" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hlavní view ───────────────────────────────────────────────────────────────
type ProvozTab = "inventura" | "sklad" | "historie" | "dodavatele";

export function ProvozView() {
  const { polozky, inventury, vytvorInventuru, aktivniInventuraId, setAktivniInventura } = useProvozStore();
  const [tab, setTab] = useState<ProvozTab>("inventura");
  const [showNazevModal, setShowNazevModal] = useState(false);
  const [novyNazev, setNovyNazev] = useState("");

  const aktivniInventura = inventury.find(i => i.id === aktivniInventuraId && !i.zavrena);
  const rozpracovane = inventury.filter(i => !i.zavrena && i.id !== aktivniInventuraId);

  const handleVytvorit = () => {
    if (!novyNazev.trim()) return;
    vytvorInventuru(novyNazev.trim());
    setNovyNazev("");
    setShowNazevModal(false);
    setTab("inventura");
  };

  const TABS: { id: ProvozTab; label: string; icon: React.ReactNode }[] = [
    { id: "inventura", label: "Inventura", icon: <ClipboardList size={15} /> },
    { id: "sklad", label: "Sklad", icon: <Package size={15} /> },
    { id: "historie", label: "Historie", icon: <BarChart3 size={15} /> },
    { id: "dodavatele", label: "Dodavatelé", icon: <Truck size={15} /> },
  ];

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="px-5 pt-2 pb-24">

        {/* Interní navigace */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                background: tab === t.id ? "var(--green-primary)" : "white",
                color: tab === t.id ? "white" : "var(--text-secondary)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "none",
                whiteSpace: "nowrap",
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* INVENTURA TAB */}
        {tab === "inventura" && (
          <div>
            <CoDokoupit />
            {aktivniInventura ? (
              <AktivniInventura inventura={aktivniInventura} />
            ) : (
              <div>
                {/* Rozpracované */}
                {rozpracovane.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>
                      Rozpracované
                    </p>
                    {rozpracovane.map(inv => (
                      <button key={inv.id} onClick={() => setAktivniInventura(inv.id)}
                        className="card w-full p-4 mb-2 flex items-center justify-between text-left">
                        <div>
                          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{inv.nazev}</p>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{inv.datum} · {inv.zaznamy.length}/{polozky.length} položek</p>
                        </div>
                        <ChevronRight size={16} style={{ color: "var(--text-tertiary)" }} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Start nové */}
                {polozky.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Jak začít s Provozem?</p>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>3 jednoduché kroky k první inventuře</p>
                    </div>
                    {[
                      { step: 1, icon: <Package size={20} style={{ color: "var(--green-primary)" }} />, title: "Nastavte sklad", desc: "Přidejte položky, které chcete sledovat — suroviny, nápoje, zásoby.", action: () => setTab("sklad"), btn: "Přejít na Sklad →" },
                      { step: 2, icon: <ClipboardList size={20} style={{ color: "#E8862E" }} />, title: "Spusťte inventuru", desc: "Projděte sklad a zadejte skutečné množství každé položky.", action: null, btn: null },
                      { step: 3, icon: <FileText size={20} style={{ color: "#E87D35" }} />, title: "Exportujte výsledky", desc: "Stáhněte PDF nebo Excel report pro evidenci nebo účetnictví.", action: null, btn: null },
                    ].map(({ step, icon, title, desc, action, btn }) => (
                      <div key={step} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1.5px solid var(--border)", opacity: step === 1 ? 1 : 0.55 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: step === 1 ? "var(--green-light)" : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)" }}>KROK {step}</span>
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{title}</p>
                          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{desc}</p>
                          {action && btn && (
                            <button onClick={action} style={{ marginTop: 8, padding: "6px 14px", borderRadius: 10, background: "var(--green-primary)", color: "white", fontSize: 12, fontWeight: 700 }}>
                              {btn}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
                      <ClipboardList size={32} style={{ color: "var(--green-primary)" }} strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>Spustit inventuru</p>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        Projdete {polozky.length} položek a zadáte skutečné stavy.
                      </p>
                    </div>
                    <button className="btn-primary" style={{ width: "auto", paddingLeft: 28, paddingRight: 28 }} onClick={() => setShowNazevModal(true)}>
                      <ClipboardList size={16} /> Začít inventuru
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "sklad" && <SpravaSkladu />}
        {tab === "historie" && <HistorieInventur />}
        {tab === "dodavatele" && <DodavateleView />}
      </div>

      {/* Modal pro název inventury */}
      {showNazevModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setShowNazevModal(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div className="relative rounded-t-3xl px-5 pt-5 pb-10 space-y-4 animate-slide-up"
            style={{ background: "var(--bg-primary)", paddingBottom: "max(40px, env(safe-area-inset-bottom, 40px))" }}>
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Název inventury</h3>
            <input
              autoFocus value={novyNazev} onChange={e => setNovyNazev(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVytvorit()}
              placeholder="např. Týdenní inventura, Inventura alkoholu..."
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
              style={{ background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
            />
            <button onClick={handleVytvorit} className="btn-primary" disabled={!novyNazev.trim()}>
              <ClipboardList size={16} /> Spustit inventuru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
