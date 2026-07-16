"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ClipboardList, Plus, X, ChevronRight,
  AlertTriangle, Check, Truck, Package, BarChart3, Trash2, ScanLine, Keyboard,
  FileText, Download, FileSpreadsheet, Pencil, Share2, Mic, MicOff, Loader, Search,
  Camera, Image as ImageIcon, TrendingDown, ChefHat, Receipt, RotateCcw, Printer, Mail, Beer, Clock
} from "lucide-react";
import { parseSpokenText } from "@/components/VoiceInput";
import {
  useProvozStore,
  INVENTURA_KATEGORIE,
  InventuraKategorie,
  InventuraPolozka,
  Inventura,
  Odpis,
  OdpisDuvod,
} from "@/store/provozStore";
import { lookupProductByEAN } from "@/lib/productLookup";
import { useKasaStore, Prodejka, formatCisloUctenky } from "@/store/kasaStore";
import { tiskUctenky, TiskarnaTyp } from "@/lib/tiskUctenky";
import { Capacitor } from "@capacitor/core";
import { Scanner } from "@/components/Scanner";
import { KasaView } from "@/components/KasaView";
import { UcetnictviView } from "@/components/UcetnictviView";
import { RecipesView } from "@/components/RecipesView";
import { useShoppingStore } from "@/store/shoppingStore";
import { useGamificationStore } from "@/store/gamificationStore";
import { useUIStore, type ProvozSubTab } from "@/store/uiStore";
import { useTicketStore, type Pracoviste } from "@/store/ticketStore";
import { useBusinessStore } from "@/store/businessStore";
import { useJeZamestnanec } from "@/store/employeeStore";
import { useT, useLocale } from "@/lib/i18n";
import type { Locale } from "@/store/localeStore";

type TFn = (key: string) => string;

// Přeloží label kategorie podle jejího id (id se nepřekládá).
function katLabel(t: TFn, id: string): string {
  return t(`provoz.kat.${id}`);
}

// ── Export funkce ─────────────────────────────────────────────────────────────

function exportCSV(inv: Inventura, polozky: InventuraPolozka[], t: TFn) {
  const rows = [
    [t("provoz.export.nazev"), t("provoz.export.kategorie"), t("provoz.export.skutecnyStav"), t("provoz.export.jednotka"), t("provoz.export.minZasoba"), t("provoz.export.cenaJedn"), t("provoz.export.hodnota"), t("provoz.export.podMinimem"), t("provoz.export.minTrvanlivostDo")],
  ];
  inv.zaznamy.forEach(z => {
    const p = polozky.find(p => p.id === z.polozkaId);
    if (!p) return;
    const hodnota = p.cenaJednotka ? (z.skutecnyStav * p.cenaJednotka).toFixed(2) : "";
    const podMin = z.skutecnyStav <= p.minZasoba ? t("provoz.export.ano") : t("provoz.export.ne");
    rows.push([
      p.nazev,
      katLabel(t, p.kategorie),
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

async function exportPDF(inv: Inventura, polozky: InventuraPolozka[], t: TFn, locale: Locale) {
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
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
    const katLbl = p ? katLabel(t, p.kategorie) : "";
    const podMin = p ? z.skutecnyStav <= p.minZasoba : false;
    const hodnota = p?.cenaJednotka ? (z.skutecnyStav * p.cenaJednotka).toLocaleString(dateLocale) + " Kč" : "—";
    const trv = p?.minTrvanlivost ? new Date(p.minTrvanlivost).toLocaleDateString(dateLocale) : "—";
    const trvExpired = p?.minTrvanlivost && new Date(p.minTrvanlivost) < new Date();
    const trvSoon = p?.minTrvanlivost && !trvExpired && (new Date(p.minTrvanlivost).getTime() - Date.now()) < 7 * 86400000;
    return `<tr style="background:${podMin ? "#FFF3E0" : ""}">
      <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:${podMin ? "600" : "400"}">${p?.nazev ?? z.polozkaId}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;color:#666">${katLbl}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:${podMin ? "#E65100" : "#1a1a1a"}">${z.skutecnyStav} ${p?.jednotka ?? ""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;color:#666">${p?.minZasoba ?? ""} ${p?.jednotka ?? ""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${hodnota}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;color:${trvExpired ? "#C62828" : trvSoon ? "#E65100" : "#666"};font-weight:${trvExpired || trvSoon ? "700" : "400"}">${trv}${trvExpired ? " ⚠️" : ""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-weight:700;color:${podMin ? "#E65100" : "#4CAF82"}">${podMin ? "⚠️" : "✓"}</td>
    </tr>`;
  }).join("");

  container.innerHTML = `
    <div style="background:#4CAF82;color:#fff;padding:12px 16px;border-radius:10px 10px 0 0;display:flex;justify-content:space-between;align-items:center;margin-bottom:0">
      <span style="font-size:13px;font-weight:700;letter-spacing:.05em">${t("provoz.export.headerInventura")}</span>
      <span style="font-size:11px;opacity:.85">${t("provoz.export.headerSpizirna")}</span>
    </div>
    <div style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 10px 10px;padding:20px 20px 16px;margin-bottom:20px">
      <h1 style="margin:0 0 4px;font-size:22px;color:#1a1a1a">${inv.nazev}</h1>
      <p style="margin:0;font-size:12px;color:#888">${t("provoz.export.datum")}: ${inv.datum} &nbsp;·&nbsp; ${t("provoz.export.pocetPolozek")}: ${inv.zaznamy.length} &nbsp;·&nbsp; ${t("provoz.export.vygenerovano")}: ${new Date().toLocaleDateString(dateLocale)}</p>
      ${celkovaHodnota > 0 ? `<div style="margin-top:12px;background:#F1FAF5;border:1px solid #4CAF82;border-radius:8px;padding:10px 14px;display:inline-block"><span style="font-size:13px;font-weight:700;color:#2E7D32">${t("provoz.export.celkovaHodnota")}: ${celkovaHodnota.toLocaleString(dateLocale)} Kč</span></div>` : ""}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#2d2d2d;color:#fff">
          <th style="padding:8px;text-align:left;border-radius:6px 0 0 0">${t("provoz.export.nazev")}</th>
          <th style="padding:8px;text-align:left">${t("provoz.export.kategorie")}</th>
          <th style="padding:8px;text-align:right">${t("provoz.export.skutecnyStav")}</th>
          <th style="padding:8px;text-align:right">${t("provoz.export.minZasoba")}</th>
          <th style="padding:8px;text-align:right">${t("provoz.export.hodnota")}</th>
          <th style="padding:8px;text-align:center">${t("provoz.export.minTrvanlivost")}</th>
          <th style="padding:8px;text-align:center;border-radius:0 6px 0 0">${t("provoz.export.ok")}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${(() => {
      // Rozdílová sestava — spočítej z očekávaných stavů přímo v záznamech.
      let manka = 0, prebytky = 0, pocet = 0;
      inv.zaznamy.forEach(z => {
        if (z.ocekavanyStav === undefined || z.skutecnyStav === z.ocekavanyStav) return;
        pocet++;
        const cena = polozky.find(p => p.id === z.polozkaId)?.cenaJednotka ?? 0;
        const kc = (z.skutecnyStav - z.ocekavanyStav) * cena;
        if (kc < 0) manka += Math.abs(kc); else prebytky += kc;
      });
      if (pocet === 0) return "";
      const bilance = prebytky - manka;
      return `<div style="margin-top:18px;padding:14px 16px;background:#FFFBF5;border:1px solid #f0e0c8;border-radius:8px">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#888">${t("provoz.sestava.titulek")}</p>
        <p style="margin:0;font-size:13px;color:#333">${t("provoz.sestava.manka")}: <b style="color:#C0392B">−${manka.toLocaleString(dateLocale)} Kč</b> &nbsp;·&nbsp; ${t("provoz.sestava.prebytky")}: <b style="color:#2E7D32">+${prebytky.toLocaleString(dateLocale)} Kč</b> &nbsp;·&nbsp; ${t("provoz.sestava.bilance")}: <b style="color:${bilance < 0 ? "#C0392B" : "#2E7D32"}">${bilance >= 0 ? "+" : "−"}${Math.abs(bilance).toLocaleString(dateLocale)} Kč</b></p>
      </div>`;
    })()}
    <div style="margin-top:32px;display:flex;justify-content:space-between;gap:40px">
      <div style="flex:1"><div style="border-top:1px solid #999;padding-top:6px;font-size:11px;color:#888">${t("provoz.export.podpisSestavil")}</div></div>
      <div style="flex:1"><div style="border-top:1px solid #999;padding-top:6px;font-size:11px;color:#888">${t("provoz.export.podpisSchvalil")}</div></div>
    </div>
    <p style="margin-top:16px;font-size:10px;color:#bbb;text-align:right">${t("provoz.export.footer")}</p>
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

// Odpisový protokol (waste report) do PDF — daňový doklad o znehodnoceném zboží.
async function exportOdpisyPDF(odpisy: Odpis[], t: TFn, locale: Locale) {
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import("jspdf"),
    import("html2canvas").then(m => m.default),
  ]);

  const celkem = odpisy.reduce((sum, o) => sum + (o.cenaJednotka ? o.mnozstvi * o.cenaJednotka : 0), 0);
  const duvodLabel = (d: OdpisDuvod) => t(`provoz.odpis.duvod.${d}`);

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:#fff;font-family:-apple-system,sans-serif;padding:32px";

  const rows = odpisy.map(o => {
    const hodnota = o.cenaJednotka ? `${(o.mnozstvi * o.cenaJednotka).toLocaleString(dateLocale)} Kč` : "—";
    return `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${o.datum}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:600">${o.nazev}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${o.mnozstvi} ${o.jednotka}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${duvodLabel(o.duvod)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:#C0392B">${hodnota}</td>
    </tr>`;
  }).join("");

  container.innerHTML = `
    <div style="background:#C0392B;color:#fff;padding:14px 18px;border-radius:10px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:13px;font-weight:700;letter-spacing:.05em">${t("provoz.odpis.protokol")}</span>
      <span style="font-size:11px;opacity:.85">${t("provoz.export.headerSpizirna")}</span>
    </div>
    <div style="padding:16px 4px">
      <p style="margin:0;font-size:12px;color:#888">${t("provoz.export.vygenerovano")}: ${new Date().toLocaleDateString(dateLocale)} &nbsp;·&nbsp; ${t("provoz.export.pocetPolozek")}: ${odpisy.length}</p>
      <div style="margin-top:12px;background:#FDF1F1;border:1px solid #C0392B;border-radius:8px;padding:10px 14px;display:inline-block">
        <span style="font-size:13px;font-weight:700;color:#C0392B">${t("provoz.odpis.celkovaZtrata")}: ${celkem.toLocaleString(dateLocale)} Kč</span>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#f4f4f4;color:#333">
          <th style="padding:8px;text-align:left;border-radius:6px 0 0 0">${t("provoz.export.datum")}</th>
          <th style="padding:8px;text-align:left">${t("provoz.export.nazev")}</th>
          <th style="padding:8px;text-align:right">${t("provoz.odpis.mnozstvi")}</th>
          <th style="padding:8px;text-align:left">${t("provoz.odpis.duvodCol")}</th>
          <th style="padding:8px;text-align:right;border-radius:0 6px 0 0">${t("provoz.export.hodnota")}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;font-size:10px;color:#bbb;text-align:right">${t("provoz.export.footer")}</p>`;

  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imgW = 210, imgH = (canvas.height * imgW) / canvas.width;
    let posY = 0;
    while (posY < imgH) {
      if (posY > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -posY, imgW, imgH);
      posY += 297;
    }
    pdf.save(`odpisy-${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trvanlivostStatus(datum: string | undefined, t: TFn, locale: Locale): { label: string; color: string; bg: string } | null {
  if (!datum) return null;
  const dnes = new Date();
  dnes.setHours(0, 0, 0, 0);
  const exp = new Date(datum);
  const diffDni = Math.round((exp.getTime() - dnes.getTime()) / 86400000);
  if (diffDni < 0) return { label: t("provoz.trv.vyprselo").replace("{n}", String(Math.abs(diffDni))), color: "#C62828", bg: "#FFEBEE" };
  if (diffDni === 0) return { label: t("provoz.trv.vyprsiDnes"), color: "#E65100", bg: "#FFF3E0" };
  if (diffDni <= 3) {
    const label = diffDni === 1
      ? t("provoz.trv.vyprsiZa1")
      : t("provoz.trv.vyprsiZaDny").replace("{n}", String(diffDni));
    return { label, color: "#E65100", bg: "#FFF3E0" };
  }
  if (diffDni <= 7) return { label: t("provoz.trv.vyprsiZaDni").replace("{n}", String(diffDni)), color: "#F9A825", bg: "#FFFDE7" };
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const d = exp.toLocaleDateString(dateLocale, { day: "numeric", month: "numeric", year: "numeric" });
  return { label: t("provoz.trv.minTrvanlivost").replace("{d}", d), color: "var(--text-secondary)", bg: "transparent" };
}

// ── Výběr sazby DPH (21 / 12 / 0 %) ───────────────────────────────────────────
function DphSelect({ value, onChange, t }: { value: number; onChange: (v: number) => void; t: TFn }) {
  const SAZBY = [21, 12, 0];
  return (
    <div>
      <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.dphSazba")}</label>
      <div style={{ display: "flex", gap: 8 }}>
        {SAZBY.map((s) => (
          <button key={s} onClick={() => onChange(s)}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 12, fontSize: 13, fontWeight: 700,
              background: value === s ? "var(--green-primary)" : "white",
              color: value === s ? "white" : "var(--text-secondary)",
              border: `1.5px solid ${value === s ? "var(--green-primary)" : "var(--border)"}`,
            }}>
            {s} %
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Formulář nové položky skladu ──────────────────────────────────────────────
function AddPolozkaModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { addPolozka, dodavatele } = useProvozStore();
  const [nazev, setNazev] = useState("");
  const [kategorie, setKategorie] = useState<InventuraKategorie>("pecivo");
  const [jednotka, setJednotka] = useState("ks");
  const [minZasoba, setMinZasoba] = useState("1");
  const [pocStav, setPocStav] = useState("0");
  const [cena, setCena] = useState("");
  const [prodejniCena, setProdejniCena] = useState("");
  const [dphSazba, setDphSazba] = useState(21);
  const [plu, setPlu] = useState(""); // krátký kód pro numpad
  const [dodavatelId, setDodavatelId] = useState("");
  const [minTrvanlivost, setMinTrvanlivost] = useState("");
  const [ean, setEan] = useState(""); // uložený EAN položky (sken i ruční)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [eanInput, setEanInput] = useState("");
  const [inputMode, setInputMode] = useState<"name" | "ean">("name");
  const JEDNOTKY = ["ks", "l", "dl", "ml", "kg", "g", "lahev", "balení", "porce"];

  const handleEanScanned = useCallback(async (ean: string) => {
    setShowScanner(false);
    setScanLoading(true);
    setEan(ean);
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
    setEan(eanInput.trim());
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

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!nazev.trim()) return;
    addPolozka({
      nazev: nazev.trim(),
      kategorie,
      jednotka,
      aktualniStav: parseFloat(pocStav) || 0,
      minZasoba: parseFloat(minZasoba) || 1,
      cenaJednotka: cena ? parseFloat(cena) : undefined,
      prodejniCena: prodejniCena ? parseFloat(prodejniCena) : undefined,
      dphSazba,
      ean: ean.trim() || undefined,
      plu: plu.trim() || undefined,
      fotoUrl: fotoUrl ?? undefined,
      dodavatelId: dodavatelId || undefined,
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
    <div className="provoz-modal" style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div className="relative rounded-t-3xl px-5 pt-5 pb-8 space-y-4 animate-slide-up provoz-modal-card"
        style={{ background: "var(--bg-primary)", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))", maxHeight: "90dvh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("provoz.novaPolozka")}</h3>
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
            <Keyboard size={14} /> {t("provoz.zadatRucne")}
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
            <ScanLine size={14} /> {t("provoz.skenovatEan")}
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
              <ScanLine size={18} /> {t("provoz.otevritFotoaparat")}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{t("provoz.neboZadatEan")}</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={eanInput}
                onChange={e => setEanInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEanManual()}
                placeholder={t("provoz.eanPlaceholder")}
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
                {scanLoading ? "..." : t("provoz.hledat")}
              </button>
            </div>
            {nazev && (
              <div style={{ padding: "10px 14px", borderRadius: 14, background: "var(--green-light)", border: "1px solid var(--green-primary)" }}>
                <p style={{ fontSize: 12, color: "var(--green-dark)", fontWeight: 600 }}>{t("provoz.nalezeno").replace("{n}", nazev)}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.nazev")}</label>
            <input
              autoFocus value={nazev} onChange={e => setNazev(e.target.value)}
              placeholder={t("provoz.nazevPlaceholder")}
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }}
            />
          </div>
        )}

        {/* Zbytek formuláře — vždy viditelný pokud máme název */}
        {(nazev.trim() || inputMode === "name") && (
          <>
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.kategorie")}</label>
              <div className="grid grid-cols-2 gap-2">
                {INVENTURA_KATEGORIE.map((k) => (
                  <button key={k.id} onClick={() => setKategorie(k.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left"
                    style={{
                      background: kategorie === k.id ? "var(--green-light)" : "white",
                      border: `1.5px solid ${kategorie === k.id ? "var(--green-primary)" : "var(--border)"}`,
                      color: kategorie === k.id ? "var(--green-dark)" : "var(--text-primary)",
                    }}>
                    <span>{k.emoji}</span> {katLabel(t, k.id)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.jednotka")}</label>
              <select value={jednotka} onChange={e => setJednotka(e.target.value)}
                style={{ width: "100%", background: "white", border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 14, outline: "none", color: "var(--text-primary)" }}>
                {JEDNOTKY.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.aktualniStav")}</label>
                <input type="number" value={pocStav} onChange={e => setPocStav(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none text-center"
                  style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.minZasoba")}</label>
                <input type="number" value={minZasoba} onChange={e => setMinZasoba(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none text-center"
                  style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
              </div>
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.cenaJedn")}</label>
                <input type="number" value={cena} onChange={e => setCena(e.target.value)} placeholder={t("provoz.volitelne")}
                  className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.prodejniCena")}</label>
                <input type="number" value={prodejniCena} onChange={e => setProdejniCena(e.target.value)} placeholder={t("provoz.volitelne")}
                  className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.dodavatel")}</label>
              <select value={dodavatelId} onChange={e => setDodavatelId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "white", color: dodavatelId ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                <option value="">{t("provoz.dodavatelZadny")}</option>
                {dodavatele.map(d => <option key={d.id} value={d.id}>{d.nazev}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.minTrvanlivostDo")}</label>
              <input type="date" value={minTrvanlivost} onChange={e => setMinTrvanlivost(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "white", color: minTrvanlivost ? "var(--text-primary)" : "var(--text-tertiary)" }} />
            </div>

            {/* Vlastní kód (PLU) pro rychlé markování v kase */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.plu")}</label>
              <input type="text" inputMode="numeric" value={plu} onChange={e => setPlu(e.target.value)} placeholder={t("provoz.pluPlaceholder")}
                className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
            </div>

            <DphSelect value={dphSazba} onChange={setDphSazba} t={t} />

            {/* Fotka položky */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.foto")}</label>
              {fotoUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fotoUrl} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1.5px solid var(--border)" }} />
                  <button onClick={() => setFotoUrl(null)} style={{ fontSize: 13, fontWeight: 600, color: "#C0392B" }}>{t("provoz.odebratFoto")}</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => cameraRef.current?.click()}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 14, fontSize: 13, fontWeight: 600, background: "white", color: "var(--text-secondary)", border: "1.5px solid var(--border)" }}>
                    <Camera size={15} /> {t("provoz.fotit")}
                  </button>
                  <button onClick={() => photoRef.current?.click()}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 14, fontSize: 13, fontWeight: 600, background: "white", color: "var(--text-secondary)", border: "1.5px solid var(--border)" }}>
                    <ImageIcon size={15} /> {t("provoz.galerie")}
                  </button>
                </div>
              )}
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoFile} style={{ display: "none" }} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoFile} style={{ display: "none" }} />
            </div>
          </>
        )}

        <button onClick={save} className="btn-primary" disabled={!nazev.trim()}>
          <Plus size={16} /> {t("provoz.pridatPolozku")}
        </button>
      </div>
    </div>
  );
}

// ── Aktivní inventura — zadávání stavů ────────────────────────────────────────
function AktivniInventura({ inventura }: { inventura: Inventura }) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const { polozky, zadatZaznam, zavritInventuru, getHodnotaSkladu } = useProvozStore();
  const [aktivniKat, setAktivniKat] = useState<InventuraKategorie | "vse">("vse");
  const [vstupy, setVstupy] = useState<Record<string, string>>({});
  const [ulozeno, setUlozeno] = useState<Set<string>>(new Set());
  const [showZavrit, setShowZavrit] = useState(false);
  // Při uzavření: srovnat evidovaný stav skladu na napočítanou realitu? Default ano.
  const [srovnatSklad, setSrovnatSklad] = useState(true);

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
              {t("provoz.probihajiciInventura")}
            </p>
            <h3 className="font-bold text-lg" style={{ color: "white" }}>{inventura.nazev}</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{inventura.datum}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: "white", lineHeight: 1 }}>{zadano}/{celkem}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{t("provoz.polozek")}</p>
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", borderRadius: 6, background: "white", width: `${progress}%`, transition: "width 0.4s ease" }} />
        </div>
        {/* U slepé inventury hodnotu během počítání skryjeme (nesmí napovídat). */}
        {hodnotaSkladu > 0 && !inventura.slepa && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 10 }}>
            💰 {t("provoz.hodnotaSkladu")}: <b>{hodnotaSkladu.toLocaleString(dateLocale)} Kč</b>
          </p>
        )}
        {inventura.slepa && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
            🙈 {t("provoz.slepa.badge")}
          </p>
        )}
        <button
          onClick={() => setShowZavrit(true)}
          style={{ width: "100%", padding: "9px 0", borderRadius: 14, fontSize: 13, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
        >
          {t("provoz.uzavritInventuru")}
        </button>
      </div>

      {/* Potvrzení uzavření */}
      {showZavrit && (
        <div className="card p-4 mb-4 animate-fade-in" style={{ background: "#FFF3E0", border: "1px solid #FFE0B2" }}>
          <p className="text-sm font-bold mb-2" style={{ color: "#E65100" }}>{t("provoz.uzavritInventuruQ")}</p>
          <p className="text-xs mb-3" style={{ color: "#BF360C" }}>{t("provoz.poUzavreni")}</p>
          {/* Volba: srovnat sklad na napočítané stavy (evidence = realita) */}
          <button
            onClick={() => setSrovnatSklad((v) => !v)}
            className="flex items-center gap-2.5 w-full mb-3 text-left"
            style={{ background: "white", border: "1px solid #FFE0B2", borderRadius: 12, padding: "10px 12px" }}
          >
            <span style={{
              width: 40, height: 24, borderRadius: 99, flexShrink: 0, position: "relative",
              background: srovnatSklad ? "#E65100" : "var(--border)", transition: "background 0.2s",
            }}>
              <span style={{ position: "absolute", top: 3, left: srovnatSklad ? 19 : 3, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
            </span>
            <span style={{ fontSize: 12, color: "#BF360C", lineHeight: 1.35 }}>{t("provoz.srovnatSklad")}</span>
          </button>
          <div className="flex gap-2">
            <button onClick={() => zavritInventuru(inventura.id, srovnatSklad)} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: "#E65100", color: "white" }}>
              {t("provoz.anoUzavrit")}
            </button>
            <button onClick={() => setShowZavrit(false)} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>
              {t("common.back")}
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
            {t("provoz.vse").replace("{n}", String(celkem))}
          </button>
          {kategoriePouzite.map(k => {
            const pocet = polozky.filter(p => p.kategorie === k.id).length;
            return (
              <button key={k.id} onClick={() => setAktivniKat(k.id)}
                style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: aktivniKat === k.id ? 700 : 500, background: aktivniKat === k.id ? "var(--green-primary)" : "white", color: aktivniKat === k.id ? "white" : "var(--text-secondary)", border: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", whiteSpace: "nowrap" }}>
                {k.emoji} {katLabel(t, k.id)} ({pocet})
              </button>
            );
          })}
        </div>
      )}

      {/* Položky */}
      {filtrovane.length === 0 ? (
        <div className="text-center py-8">
          <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>{t("provoz.zadnePolozkyKat")}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtrovane.map((polozka, idx) => {
            const zaznam = zaznamMap[polozka.id];
            const jePod = zaznam !== undefined && zaznam <= polozka.minZasoba;
            const jeUlozeno = ulozeno.has(polozka.id);
            const kat = INVENTURA_KATEGORIE.find(k => k.id === polozka.kategorie);
            // Slepá inventura: zaměstnanec po zadání nevidí číslo ani „pod minimem",
            // jen potvrzení „zadáno" — nesmí poznat, kolik systém čekal.
            const slepa = !!inventura.slepa;
            return (
              <div key={polozka.id}
                style={{ borderBottom: idx < filtrovane.length - 1 ? "1px solid var(--border)" : "none", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15 }}>{kat?.emoji}</span>
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{polozka.nazev}</p>
                      {jePod && !slepa && <AlertTriangle size={13} style={{ color: "#F57C00", flexShrink: 0 }} />}
                    </div>
                    {zaznam !== undefined && (
                      slepa ? (
                        <p style={{ fontSize: 12, color: "var(--green-primary)", marginTop: 2 }}>{t("provoz.zadano")} ✓</p>
                      ) : (
                        <p style={{ fontSize: 12, color: jePod ? "#F57C00" : "var(--text-secondary)", marginTop: 2 }}>
                          {zaznam} {polozka.jednotka}
                          {jePod ? t("provoz.podMinimem") : " ✓"}
                          {polozka.cenaJednotka ? ` · ${(zaznam * polozka.cenaJednotka).toLocaleString(dateLocale)} Kč` : ""}
                        </p>
                      )
                    )}
                    {(() => {
                      const s = trvanlivostStatus(polozka.minTrvanlivost, t, locale);
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

// ── Historie účtenek + vyhledávání podle kódu + částečné vrácení ───────────────
function UctenkyView() {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const prodejky = useKasaStore((s) => s.prodejky);
  const [hledej, setHledej] = useState("");
  const [detail, setDetail] = useState<Prodejka | null>(null);

  // Filtrace: podle kódu účtenky (i bez pomlčky) nebo názvu položky.
  const filtr = hledej.trim().toLowerCase().replace(/[\s-]/g, "");
  const zobrazene = prodejky.filter((p) => {
    if (!filtr) return true;
    const kod = (p.cislo ?? "").toLowerCase();
    if (kod.includes(filtr)) return true;
    return p.radky.some((r) => r.nazev.toLowerCase().replace(/[\s-]/g, "").includes(filtr));
  });

  return (
    <div>
      {/* Vyhledávání podle kódu */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
        <input
          value={hledej}
          onChange={(e) => setHledej(e.target.value)}
          placeholder={t("uctenky.hledej")}
          style={{ width: "100%", paddingLeft: 40, paddingRight: 14, paddingTop: 12, paddingBottom: 12, borderRadius: 14, fontSize: 15, border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)" }}
        />
      </div>

      {zobrazene.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-tertiary)" }}>
          <Receipt size={40} strokeWidth={1.5} style={{ marginBottom: 10, opacity: 0.5 }} />
          <p style={{ fontSize: 14 }}>{hledej ? t("uctenky.nicNenalezeno") : t("uctenky.zadne")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {zobrazene.map((p) => (
            <button key={p.id} onClick={() => setDetail(p)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "white", border: "1px solid var(--border)", textAlign: "left", cursor: "pointer" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: p.vraceno ? "#FDE8E8" : "var(--green-light)" }}>
                {p.vraceno ? <RotateCcw size={18} style={{ color: "#C0392B" }} /> : <Receipt size={18} style={{ color: "var(--green-primary)" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  #{formatCisloUctenky(p.cislo)}
                  {p.vraceno && <span style={{ fontSize: 11, fontWeight: 700, color: "#C0392B", marginLeft: 6 }}>{t("uctenky.vraceni")}</span>}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {new Date(p.datum).toLocaleString(dateLocale, { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })} · {p.radky.map((r) => `${r.mnozstvi}× ${r.nazev}`).join(", ")}
                </p>
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: p.celkem < 0 ? "#C0392B" : "var(--text-primary)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                {p.celkem.toLocaleString(dateLocale)} Kč
              </span>
            </button>
          ))}
        </div>
      )}

      {detail && <UctenkaDetail prodejka={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

// Detail účtenky: tisk (rolička/A4) + částečné vrácení.
export function UctenkaDetail({ prodejka, onClose }: { prodejka: Prodejka; onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const vratitPolozky = useKasaStore((s) => s.vratitPolozky);
  const nazevFirmy = useBusinessStore((s) => s.name);
  const firma = useBusinessStore((s) => s.firma);
  const jeNativni = Capacitor.isNativePlatform();
  const [rezimVraceni, setRezimVraceni] = useState(false);
  // Kolik kusů z každého řádku vrátit (index → počet).
  const [vraceni, setVraceni] = useState<Record<number, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  const jeVracenka = !!prodejka.vraceno;

  // Poslat účtenku e-mailem přes mailto: — otevře mailovou appku obsluhy s
  // předvyplněným textem (bez serveru). Plné odesílání s PDF přílohou = Play fáze.
  const poslatEmail = () => {
    const radkyText = prodejka.radky
      .map((r) => `${r.mnozstvi}× ${r.nazev} … ${(r.cena * r.mnozstvi).toLocaleString(dateLocale)} Kč`)
      .join("\n");
    // Rozpad DPH do e-mailu — jen plátce. Ceny jsou vč. DPH → dopočítáme daň.
    let dphText = "";
    if (firma.platceDph) {
      const map = new Map<number, { zaklad: number; dan: number }>();
      prodejka.radky.forEach((r) => {
        const sazba = r.dphSazba ?? 21;
        const brutto = r.cena * r.mnozstvi;
        const zaklad = brutto / (1 + sazba / 100);
        const cur = map.get(sazba) ?? { zaklad: 0, dan: 0 };
        cur.zaklad += zaklad; cur.dan += brutto - zaklad;
        map.set(sazba, cur);
      });
      const radky = [...map.entries()].sort((a, b) => b[0] - a[0])
        .map(([s, v]) => `DPH ${s}%: základ ${v.zaklad.toLocaleString(dateLocale, { maximumFractionDigits: 2 })} Kč, daň ${v.dan.toLocaleString(dateLocale, { maximumFractionDigits: 2 })} Kč`);
      dphText = ["", "Rozpad DPH:", ...radky].join("\n");
    }
    const predmet = `${nazevFirmy || "Účtenka"} — #${formatCisloUctenky(prodejka.cislo)}`;
    const telo = [
      nazevFirmy || "",
      firma.ico ? `IČO: ${firma.ico}` : "",
      firma.dic ? `DIČ: ${firma.dic}` : "",
      "",
      firma.platceDph ? `Zjednodušený daňový doklad #${formatCisloUctenky(prodejka.cislo)}` : `Účtenka #${formatCisloUctenky(prodejka.cislo)}`,
      new Date(prodejka.datum).toLocaleString(dateLocale),
      "─────────────",
      radkyText,
      "─────────────",
      `Celkem: ${prodejka.celkem.toLocaleString(dateLocale)} Kč`,
      dphText,
      firma.patickaUctenky ? `\n${firma.patickaUctenky}` : "",
    ].filter(Boolean).join("\n");
    const url = `mailto:?subject=${encodeURIComponent(predmet)}&body=${encodeURIComponent(telo)}`;
    if (typeof window !== "undefined") window.location.href = url;
  };

  const tisk = async (typ: TiskarnaTyp) => {
    await tiskUctenky(
      {
        nazevFirmy: nazevFirmy || "",
        firma: { ico: firma.ico, dic: firma.dic, adresa: firma.adresa, telefon: firma.telefon, patickaUctenky: firma.patickaUctenky },
        radky: prodejka.radky.map((r) => ({ nazev: r.nazev, mnozstvi: r.mnozstvi, cena: r.cena, dphSazba: r.dphSazba })),
        celkem: prodejka.celkem,
        platba: prodejka.platba,
        datum: prodejka.datum,
        cislo: formatCisloUctenky(prodejka.cislo),
        vraceno: prodejka.vraceno,
        platceDph: firma.platceDph,
      },
      typ,
    );
  };

  const celkemVraceno = prodejka.radky.reduce((sum, r, i) => sum + r.cena * (vraceni[i] ?? 0), 0);

  const potvrditVraceni = () => {
    const polozky = Object.entries(vraceni)
      .map(([i, m]) => ({ radekIndex: Number(i), mnozstvi: m }))
      .filter((x) => x.mnozstvi > 0);
    if (polozky.length === 0) return;
    const id = vratitPolozky(prodejka.id, polozky);
    if (id) {
      setToast(t("uctenky.vraceno"));
      setTimeout(() => { setToast(null); onClose(); }, 1500);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div className="sheet-overlay animate-fade-in" onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div className="relative animate-slide-up rounded-t-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-primary)", maxHeight: "90dvh" }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="overflow-y-auto px-5 pt-2" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                #{formatCisloUctenky(prodejka.cislo)}
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {new Date(prodejka.datum).toLocaleString(dateLocale, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                {jeVracenka && prodejka.puvodniCislo && ` · ${t("uctenky.kUctence")} #${formatCisloUctenky(prodejka.puvodniCislo)}`}
                {prodejka.obsluha && ` · ${t("kasa.obsluha.stitek")}: ${prodejka.obsluha}`}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
              <X size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {jeVracenka && (
            <div style={{ background: "#FDE8E8", borderRadius: 12, padding: "8px 12px", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#C0392B" }}>{t("uctenky.tojeVracenka")}</span>
            </div>
          )}

          {/* Řádky */}
          <div className="card overflow-hidden" style={{ marginBottom: 14 }}>
            {prodejka.radky.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < prodejka.radky.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{r.nazev}</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.mnozstvi}× {r.cena.toLocaleString(dateLocale)} Kč</p>
                </div>
                {rezimVraceni ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setVraceni((v) => ({ ...v, [i]: Math.max(0, (v[i] ?? 0) - 1) }))}
                      style={{ width: 30, height: 30, borderRadius: 8, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={13} style={{ color: "var(--text-secondary)" }} />
                    </button>
                    <span style={{ minWidth: 40, textAlign: "center", fontSize: 14, fontWeight: 700, color: (vraceni[i] ?? 0) > 0 ? "#C0392B" : "var(--text-tertiary)" }}>
                      {vraceni[i] ?? 0}/{r.mnozstvi}
                    </span>
                    <button onClick={() => setVraceni((v) => ({ ...v, [i]: Math.min(r.mnozstvi, (v[i] ?? 0) + 1) }))}
                      style={{ width: 30, height: 30, borderRadius: 8, background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Plus size={13} style={{ color: "var(--green-primary)" }} />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {(r.cena * r.mnozstvi).toLocaleString(dateLocale)} Kč
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Celkem / vratná částka */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 4px" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>
              {rezimVraceni ? t("uctenky.kVraceni") : t("kasa.celkem")}
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: rezimVraceni ? "#C0392B" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
              {(rezimVraceni ? -celkemVraceno : prodejka.celkem).toLocaleString(dateLocale)} Kč
            </span>
          </div>

          {/* Akce */}
          {rezimVraceni ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setRezimVraceni(false); setVraceni({}); }} className="btn-secondary" style={{ flex: 1 }}>
                {t("uctenky.zrusit")}
              </button>
              <button onClick={potvrditVraceni} disabled={celkemVraceno <= 0} className="btn-primary" style={{ flex: 2, opacity: celkemVraceno > 0 ? 1 : 0.5, background: "#C0392B" }}>
                <RotateCcw size={16} /> {t("uctenky.potvrditVraceni")}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => tisk("pdf")} className="btn-secondary" style={{ flex: 1 }}>
                  <Printer size={16} /> {t("uctenky.tiskA4")}
                </button>
                {jeNativni && (
                  <button onClick={() => tisk("bluetooth")} className="btn-secondary" style={{ flex: 1 }}>
                    <Receipt size={16} /> {t("uctenky.tiskRolicka")}
                  </button>
                )}
              </div>
              <button onClick={poslatEmail} className="btn-secondary">
                <Mail size={16} /> {t("uctenky.poslatEmail")}
              </button>
              {!jeVracenka && (
                <button onClick={() => setRezimVraceni(true)} className="btn-secondary" style={{ color: "#C0392B", borderColor: "#F0B4B4" }}>
                  <RotateCcw size={16} /> {t("uctenky.vratitZbozi")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {toast && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "var(--text-primary)", color: "white", padding: "10px 18px", borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 400 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Odpisy (waste report) ─────────────────────────────────────────────────────
const ODPIS_DUVODY: OdpisDuvod[] = ["expirace", "zkazeni", "rozbiti", "jine"];

function OdpisyView() {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const { odpisy, polozky, addOdpis, removeOdpis } = useProvozStore();
  const recordWasted = useGamificationStore((s) => s.recordWasted);
  const [showModal, setShowModal] = useState(false);

  // Odpis = vyhozená potravina → započítej do gamifikace (plýtvání).
  const addOdpisTracked = (o: Omit<Odpis, "id" | "datum">) => {
    addOdpis(o);
    recordWasted();
  };

  const celkem = odpisy.reduce((sum, o) => sum + (o.cenaJednotka ? o.mnozstvi * o.cenaJednotka : 0), 0);

  return (
    <div>
      {/* Souhrn ztráty */}
      <div className="card mb-4" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "#FDE8E8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <TrendingDown size={22} style={{ color: "#C0392B" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t("provoz.odpis.celkovaZtrata")}</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#C0392B", lineHeight: 1.1 }}>{celkem.toLocaleString(dateLocale)} Kč</p>
        </div>
        {odpisy.length > 0 && (
          <button
            onClick={() => exportOdpisyPDF(odpisy, t, locale)}
            style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#FDE8E8" }}
            title={t("provoz.stahnoutPdf")}
          >
            <FileText size={16} style={{ color: "#C0392B" }} />
          </button>
        )}
      </div>

      <button className="btn-primary mb-4" onClick={() => setShowModal(true)}>
        <Plus size={16} /> {t("provoz.odpis.pridat")}
      </button>

      {/* Seznam odpisů */}
      {odpisy.length === 0 ? (
        <div className="text-center py-8">
          <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>{t("provoz.odpis.zadne")}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {odpisy.map((o, idx) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: idx < odpisy.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{o.nazev}</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {o.datum} · {t(`provoz.odpis.duvod.${o.duvod}`)}{o.poznamka ? ` · ${o.poznamka}` : ""}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{o.mnozstvi} {o.jednotka}</p>
                {o.cenaJednotka && <p style={{ fontSize: 11, color: "#C0392B", fontWeight: 600 }}>−{(o.mnozstvi * o.cenaJednotka).toLocaleString(dateLocale)} Kč</p>}
              </div>
              <button onClick={() => removeOdpis(o.id)} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--border)", flexShrink: 0 }}>
                <Trash2 size={13} style={{ color: "var(--text-tertiary)" }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddOdpisModal polozky={polozky} onClose={() => setShowModal(false)} onSave={addOdpisTracked} />}
    </div>
  );
}

function AddOdpisModal({ polozky, onClose, onSave }: {
  polozky: InventuraPolozka[];
  onClose: () => void;
  onSave: (o: Omit<Odpis, "id" | "datum">) => void;
}) {
  const t = useT();
  const [polozkaId, setPolozkaId] = useState("");
  const [mnozstvi, setMnozstvi] = useState("");
  const [duvod, setDuvod] = useState<OdpisDuvod>("expirace");
  const [poznamka, setPoznamka] = useState("");

  const polozka = polozky.find(p => p.id === polozkaId);

  const ulozit = () => {
    const m = parseFloat(mnozstvi);
    if (!polozka || !m || m <= 0) return;
    onSave({
      polozkaId: polozka.id,
      nazev: polozka.nazev,
      mnozstvi: m,
      jednotka: polozka.jednotka,
      duvod,
      cenaJednotka: polozka.cenaJednotka,
      poznamka: poznamka.trim() || undefined,
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div className="relative rounded-t-3xl px-5 pt-5 pb-10 space-y-4 animate-slide-up"
        style={{ background: "var(--bg-primary)", paddingBottom: "max(40px, env(safe-area-inset-bottom, 40px))", maxHeight: "85vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("provoz.odpis.pridat")}</h3>
          <button onClick={onClose}><X size={20} style={{ color: "var(--text-tertiary)" }} /></button>
        </div>

        {/* Výběr položky */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.odpis.polozka")}</label>
          <select
            value={polozkaId}
            onChange={e => setPolozkaId(e.target.value)}
            className="w-full px-3 py-3 rounded-2xl text-sm outline-none"
            style={{ background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          >
            <option value="">{t("provoz.odpis.vyberPolozku")}</option>
            {polozky.map(p => <option key={p.id} value={p.id}>{p.nazev}</option>)}
          </select>
        </div>

        {/* Množství */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.odpis.mnozstvi")}{polozka ? ` (${polozka.jednotka})` : ""}</label>
          <input
            type="number" value={mnozstvi} onChange={e => setMnozstvi(e.target.value)} placeholder="0"
            className="w-full px-3 py-3 rounded-2xl text-sm outline-none"
            style={{ background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Důvod */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.odpis.duvodCol")}</label>
          <div className="flex gap-2 flex-wrap">
            {ODPIS_DUVODY.map(d => (
              <button key={d} onClick={() => setDuvod(d)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: duvod === d ? "var(--green-primary)" : "white", color: duvod === d ? "white" : "var(--text-secondary)", border: `1.5px solid ${duvod === d ? "var(--green-primary)" : "var(--border)"}` }}>
                {t(`provoz.odpis.duvod.${d}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Poznámka */}
        <input
          type="text" value={poznamka} onChange={e => setPoznamka(e.target.value)} placeholder={t("provoz.odpis.poznamka")}
          className="w-full px-3 py-3 rounded-2xl text-sm outline-none"
          style={{ background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
        />

        <button onClick={ulozit} className="btn-primary" disabled={!polozka || !parseFloat(mnozstvi)}>
          <Check size={16} /> {t("provoz.odpis.ulozit")}
        </button>
      </div>
    </div>
  );
}

// ── Přehled minulých inventur ─────────────────────────────────────────────────
function HistorieInventur() {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const { inventury, polozky, removeInventura, getHodnotaSkladu, getRozdilSestava } = useProvozStore();
  const [otevreneId, setOtevreneId] = useState<string | null>(null);
  const zavrene = inventury.filter(i => i.zavrena);

  if (zavrene.length === 0) return (
    <div className="text-center py-8">
      <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>{t("provoz.zadnaUzavrena")}</p>
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
        const sestava = getRozdilSestava(inv.id);

        return (
          <div key={inv.id} className="card overflow-hidden">
            {/* Hlavička — kliknutím rozklikne */}
            <button
              onClick={() => setOtevreneId(otevreno ? null : inv.id)}
              style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{inv.nazev}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{inv.datum} · {t("provoz.polozekDatum").replace("{n}", String(inv.zaznamy.length))}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                  {hodnota > 0 && <span style={{ fontSize: 11, color: "var(--green-primary)", fontWeight: 600 }}>💰 {hodnota.toLocaleString(dateLocale)} Kč</span>}
                  {podMin > 0 && <span style={{ fontSize: 11, color: "#F57C00", fontWeight: 600 }}>{t("provoz.podMinimemBadge").replace("{n}", String(podMin))}</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <ChevronRight size={16} style={{ color: "var(--text-tertiary)", transform: otevreno ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                <button
                  onClick={e => { e.stopPropagation(); exportCSV(inv, polozky, t); }}
                  style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#E8F5E9" }}
                  title={t("provoz.stahnoutCsv")}
                >
                  <FileSpreadsheet size={14} style={{ color: "#2E7D32" }} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); exportPDF(inv, polozky, t, locale); }}
                  style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#FDE8E8" }}
                  title={t("provoz.stahnoutPdf")}
                >
                  <FileText size={14} style={{ color: "#C0392B" }} />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const podMinPocet = zaznamy.filter(z => z.podMin).length;
                    const text = `📋 ${t("provoz.tab.inventura")}: ${inv.nazev}\n📅 ${inv.datum}\n📦 ${t("provoz.polozekDatum").replace("{n}", String(inv.zaznamy.length))}${hodnota > 0 ? `\n💰 ${t("provoz.export.hodnota")}: ${hodnota.toLocaleString(dateLocale)} Kč` : ""}\n${podMinPocet > 0 ? t("provoz.podMinimemBadge").replace("{n}", String(podMinPocet)) : ""}`;
                    if (navigator.share) navigator.share({ title: inv.nazev, text });
                    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#E8F4FD" }}
                  title={t("provoz.sdilet")}
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
                {/* Rozdílová sestava — manka a přebytky proti minulé inventuře */}
                {sestava.pocetRozdilu > 0 && (
                  <div style={{ padding: "12px 16px", background: "#FFFBF5", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", marginBottom: 8 }}>
                      {t("provoz.sestava.titulek")}
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1, background: "#FDE8E8", borderRadius: 10, padding: "8px 10px" }}>
                        <p style={{ fontSize: 10, color: "#C0392B", fontWeight: 600 }}>{t("provoz.sestava.manka")}</p>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "#C0392B" }}>−{sestava.manka.toLocaleString(dateLocale)} Kč</p>
                      </div>
                      <div style={{ flex: 1, background: "#E8F5EE", borderRadius: 10, padding: "8px 10px" }}>
                        <p style={{ fontSize: 10, color: "var(--green-dark)", fontWeight: 600 }}>{t("provoz.sestava.prebytky")}</p>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--green-dark)" }}>+{sestava.prebytky.toLocaleString(dateLocale)} Kč</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, marginTop: 8, color: "var(--text-secondary)" }}>
                      {t("provoz.sestava.bilance")}: <b style={{ color: sestava.bilance < 0 ? "#C0392B" : "var(--green-dark)" }}>{sestava.bilance >= 0 ? "+" : "−"}{Math.abs(sestava.bilance).toLocaleString(dateLocale)} Kč</b>
                    </p>
                  </div>
                )}
                {zaznamy.length === 0 ? (
                  <p style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-tertiary)" }}>{t("provoz.zadneZaznamy")}</p>
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
                            {t("provoz.min")} {z.polozka.minZasoba} {z.polozka.jednotka}
                            {z.podMin ? t("provoz.podMinimem") : ""}
                          </p>
                        )}
                        {(() => {
                          const s = trvanlivostStatus(z.polozka?.minTrvanlivost, t, locale);
                          if (!s) return null;
                          return <p style={{ fontSize: 11, color: s.color, margin: 0 }}>🗓 {s.label}</p>;
                        })()}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: z.podMin ? "#E65100" : "var(--text-primary)", margin: 0 }}>
                          {z.skutecnyStav} {z.polozka?.jednotka ?? ""}
                        </p>
                        {/* Rozdíl proti očekávanému stavu (manko/přebytek) */}
                        {z.ocekavanyStav !== undefined && z.skutecnyStav !== z.ocekavanyStav && (() => {
                          const rozdil = z.skutecnyStav - z.ocekavanyStav;
                          const barva = rozdil < 0 ? "#C0392B" : "var(--green-dark)";
                          return (
                            <p style={{ fontSize: 11, fontWeight: 700, color: barva, margin: 0 }}>
                              {rozdil > 0 ? "+" : ""}{rozdil} {z.polozka?.jednotka ?? ""}
                              {z.polozka?.cenaJednotka ? ` · ${rozdil > 0 ? "+" : "−"}${Math.abs(rozdil * z.polozka.cenaJednotka).toLocaleString(dateLocale)} Kč` : ""}
                            </p>
                          );
                        })()}
                        {z.polozka?.cenaJednotka && (
                          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>
                            {(z.skutecnyStav * z.polozka.cenaJednotka).toLocaleString(dateLocale)} Kč
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
  const t = useT();
  const { updatePolozka, dodavatele } = useProvozStore();
  const [nazev, setNazev] = useState(polozka.nazev);
  const [jednotka, setJednotka] = useState(polozka.jednotka);
  const [minZasoba, setMinZasoba] = useState(String(polozka.minZasoba));
  const [aktualniStav, setAktualniStav] = useState(String(polozka.aktualniStav));
  const [cena, setCena] = useState(polozka.cenaJednotka ? String(polozka.cenaJednotka) : "");
  const [prodejniCena, setProdejniCena] = useState(polozka.prodejniCena != null ? String(polozka.prodejniCena) : "");
  const [dphSazba, setDphSazba] = useState(polozka.dphSazba ?? 21);
  const [plu, setPlu] = useState(polozka.plu ?? "");
  const [ean, setEan] = useState(polozka.ean ?? "");
  const [dodavatelId, setDodavatelId] = useState(polozka.dodavatelId ?? "");
  const [minTrvanlivost, setMinTrvanlivost] = useState(polozka.minTrvanlivost ?? "");
  const [fotoUrl, setFotoUrl] = useState<string | null>(polozka.fotoUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const JEDNOTKY = ["ks", "l", "dl", "ml", "kg", "g", "lahev", "balení", "porce"];

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = () => {
    updatePolozka(polozka.id, {
      nazev: nazev.trim(),
      jednotka,
      minZasoba: parseFloat(minZasoba) || 1,
      aktualniStav: parseFloat(aktualniStav) || 0,
      cenaJednotka: cena ? parseFloat(cena) : undefined,
      prodejniCena: prodejniCena ? parseFloat(prodejniCena) : undefined,
      dphSazba,
      plu: plu.trim() || undefined,
      ean: ean.trim() || undefined,
      dodavatelId: dodavatelId || undefined,
      dodavatel: undefined, // při editaci přecházíme na dodavatelId, starý text čistíme
      minTrvanlivost: minTrvanlivost || undefined,
      fotoUrl: fotoUrl ?? undefined,
    });
    onClose();
  };

  return (
    <div className="provoz-modal" style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div className="relative rounded-t-3xl px-5 pt-5 pb-8 space-y-4 animate-slide-up provoz-modal-card"
        style={{ background: "var(--bg-primary)", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))", maxHeight: "90dvh", overflowY: "auto" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("provoz.upravitPolozku")}</h3>
          <button onClick={onClose}><X size={20} style={{ color: "var(--text-tertiary)" }} /></button>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.nazev")}</label>
          <input value={nazev} onChange={e => setNazev(e.target.value)} autoFocus
            className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
            style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.jednotka")}</label>
          <select value={jednotka} onChange={e => setJednotka(e.target.value)}
            style={{ width: "100%", background: "white", border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 14, outline: "none", color: "var(--text-primary)" }}>
            {JEDNOTKY.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div style={{ flex: 1, minWidth: 0 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.aktualniStav")}</label>
            <input type="number" value={aktualniStav} onChange={e => setAktualniStav(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none text-center"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.minZasoba")}</label>
            <input type="number" value={minZasoba} onChange={e => setMinZasoba(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none text-center"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
        </div>
        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.cenaJedn")}</label>
            <input type="number" value={cena} onChange={e => setCena(e.target.value)} placeholder={t("provoz.volitelne")}
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.prodejniCena")}</label>
            <input type="number" value={prodejniCena} onChange={e => setProdejniCena(e.target.value)} placeholder={t("provoz.volitelne")}
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.dodavatel")}</label>
          <select value={dodavatelId} onChange={e => setDodavatelId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
            style={{ border: "1.5px solid var(--border)", background: "white", color: dodavatelId ? "var(--text-primary)" : "var(--text-tertiary)" }}>
            <option value="">{t("provoz.dodavatelZadny")}</option>
            {dodavatele.map(d => <option key={d.id} value={d.id}>{d.nazev}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.plu")}</label>
            <input type="text" inputMode="numeric" value={plu} onChange={e => setPlu(e.target.value)} placeholder={t("provoz.volitelne")}
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.eanKod")}</label>
            <input type="text" inputMode="numeric" value={ean} onChange={e => setEan(e.target.value)} placeholder={t("provoz.volitelne")}
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
        </div>
        <DphSelect value={dphSazba} onChange={setDphSazba} t={t} />
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.minTrvanlivostDo")}</label>
          <input type="date" value={minTrvanlivost} onChange={e => setMinTrvanlivost(e.target.value)}
            className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
            style={{ border: "1.5px solid var(--border)", background: "white", color: minTrvanlivost ? "var(--text-primary)" : "var(--text-tertiary)" }} />
        </div>

        {/* Fotka položky */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.foto")}</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {fotoUrl ? (
              <div style={{ position: "relative" }}>
                <img src={fotoUrl} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1.5px solid var(--border)" }} />
                <button onClick={() => setFotoUrl(null)}
                  style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
                  <X size={11} color="white" />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, flex: 1 }}>
                <button onClick={() => cameraInputRef.current?.click()}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 12, border: "1.5px solid var(--border)", background: "white", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                  <Camera size={15} style={{ color: "var(--green-primary)" }} /> {t("provoz.fotit")}
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 12, border: "1.5px solid var(--border)", background: "white", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                  <ImageIcon size={15} style={{ color: "var(--green-primary)" }} /> {t("provoz.galerie")}
                </button>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoFile} style={{ display: "none" }} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoFile} style={{ display: "none" }} />
        </div>

        <button onClick={save} className="btn-primary" disabled={!nazev.trim()}>
          <Check size={16} /> {t("common.saveChanges")}
        </button>
      </div>
    </div>
  );
}

// Odhad skladové kategorie podle názvu (vlastní pro Provoz — jiný výčet než Nákup)
function guessSkladKategorie(name: string): InventuraKategorie {
  const n = name.toLowerCase();
  const has = (...kw: string[]) => kw.some((k) => n.includes(k));
  // Alkohol rozdělený: víno / pivo / tvrdý
  if (has("víno", "vino", "sekt", "šampaň", "sampan", "prosecco")) return "vino";
  if (has("pivo", "piva", "ležák", "lezak", "radler")) return "pivo";
  if (has("rum", "vodka", "whisky", "becher", "fernet", "likér", "liker", "tequila", "gin", "alkohol", "slivovic", "griotk")) return "alkohol";
  // Nápoje nealko rozdělené: káva/čaj / vody / slazené
  if (has("káv", "kav", "čaj", "caj", "espresso", "cappuccino", "latte")) return "kava-caj";
  if (has("voda", "vody", "minerálk", "mineralk", "perliv", "kojeneck")) return "vody";
  if (has("džus", "dzus", "limonád", "limonad", "kofol", "cola", "kola", "sirup", "energ", "juice", "malinovk")) return "napoje-slazene";
  // Maso & ryby
  if (has("kuř", "kur", "hověz", "hovez", "vepřov", "veprov", "maso", "šunk", "sunk", "salám", "salam", "klobás", "klobas", "ryb", "losos", "filet", "mlet", "slanin", "párk", "park")) return "maso-ryby";
  // Mléčné
  if (has("mlék", "mlek", "másl", "masl", "sýr", "syr", "jogurt", "tvaroh", "smetan", "vejc", "vajíčk", "vajick", "kefír", "kefir")) return "mlecne";
  // Pečivo
  if (has("chléb", "chleb", "pečiv", "peciv", "rohlík", "rohlik", "housk", "bageta", "toustov", "koláč", "kolac", "croissant")) return "pecivo";
  // Ovoce / zelenina rozdělené
  if (has("jablk", "banán", "banan", "hrušk", "hrusk", "pomeranč", "pomeranc", "citrón", "citron", "jahod", "hrozn", "meloun", "ovoce", "mandarink", "kiwi")) return "ovoce";
  if (has("brambor", "cibul", "česnek", "cesnek", "rajč", "rajc", "paprik", "okurk", "mrkev", "mrkv", "salát", "salat", "zelenin", "zelí", "zeli", "květák", "kvetak", "špenát", "spenat")) return "zelenina";
  // Sladké & slané
  if (has("čokolád", "cokolad", "bonbón", "bonbon", "sušenk", "susenk", "chips", "chips", "oříšk", "orisk", "tyčink", "tycink", "žvýkač", "zvykac", "wafl", "keks")) return "sladke-slane";
  // Mražené
  if (has("mražen", "mrazen", "zmrzlin", "nanuk")) return "mrazene";
  // Drogerie
  if (has("mýdl", "mydl", "šampon", "sampon", "prášek", "prasek", "toaletn", "ubrous", "sáčk", "sacek", "čistič", "cistic", "sav", "houbičk", "houbick")) return "drogerie";
  // Suché zboží
  if (has("mouk", "cukr", "rýže", "ryze", "těstovin", "testovin", "luštěn", "lusten", "olej", "ocet", "koření", "koreni", "konzerv", "rýži", "ryzi", "sůl", "sul")) return "suche-zbozi";
  return "ostatni";
}

// Samostatný hlasový mikrofon pro sklad Provozu (oddělený od Nákupu).
// Naparsované položky zakládá rovnou do skladu Provozu.
function SkladVoiceFab({ onItems }: { onItems: (items: { name: string; quantity: number; unit: string }[]) => void }) {
  const t = useT();
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "listening" | "processing">("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const start = () => {
    setError(null);
    setTranscript("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(t("provoz.voice.nepodporovano"));
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
          if (items.length > 0) onItems(items);
          else setError(t("provoz.voice.nerozumel"));
          setState("idle");
          setTranscript("");
        }, 300);
      }
    };
    recognition.onerror = (event: any) => {
      setError(event.error === "not-allowed" ? t("provoz.voice.odmitnut") : t("provoz.voice.neslysel"));
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
          {error ? error : transcript ? `„${transcript}"` : t("provoz.voice.poslouchamHint")}
        </div>
      )}
      <button
        onClick={listening ? stop : start}
        aria-label={t("provoz.voice.aria")}
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
  const t = useT();
  const locale = useLocale();
  const { polozky, removePolozka, getPolozkyCritical, addPolozka, dodavatele } = useProvozStore();
  const predikceDoprodeje = useKasaStore((s) => s.predikceDoprodeje);
  const jeObchod = useBusinessStore((s) => s.typProvozu) === "obchod";
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const critical = getPolozkyCritical();
  // Jméno dodavatele z číselníku (fallback na starý volný text při migraci).
  const dodavatelNazev = (p: InventuraPolozka) =>
    dodavatele.find(d => d.id === p.dodavatelId)?.nazev ?? p.dodavatel ?? "";

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
    setToast(items.length === 1 ? t("provoz.pridanoDoSkladu").replace("{n}", items[0].name) : t("provoz.polozkyPridany").replace("{n}", String(items.length)));
    setTimeout(() => setToast(null), 3000);
  };

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
              {t("provoz.podMinZasobou").replace("{n}", String(critical.length))}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#BF360C" }}>
              {critical.slice(0, 3).map(p => p.nazev).join(", ")}{critical.length > 3 ? t("provoz.aDalsi").replace("{n}", String(critical.length - 3)) : ""}
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
            placeholder={t("provoz.hledatVeSkladu")}
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
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{t("provoz.nicNenalezeno").replace("{q}", search)}</p>
          </div>
        ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
            <Package size={28} style={{ color: "var(--green-primary)" }} strokeWidth={1.5} />
          </div>
          <div className="text-center" style={{ maxWidth: 360 }}>
            <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>{t("provoz.skladPrazdny")}</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("provoz.skladPrazdnyDesc")}</p>
          </div>
          {/* Restaurace: navedení, kam patří jídla vs. suroviny (častý zmatek). */}
          {!jeObchod && (
            <div style={{ maxWidth: 400, padding: "12px 16px", borderRadius: 14, background: "#FFF3D6", border: "1.5px solid #F0C24B" }}>
              <p style={{ fontSize: 13, color: "#7a4f00", fontWeight: 700, margin: 0 }}>{t("provoz.skladSurovinNadpis")}</p>
              <p style={{ fontSize: 12.5, color: "#9a6a1a", margin: "3px 0 0", lineHeight: 1.45 }}>{t("provoz.skladSurovinHint")}</p>
            </div>
          )}
          <button className="btn-primary" style={{ width: "auto", paddingLeft: 24, paddingRight: 24 }} onClick={() => setShowAdd(true)}>
            <Plus size={16} /> {t("provoz.pridatPolozku")}
          </button>
        </div>
        )
      ) : (
        <div className="space-y-4">
          {byKategorie.map(k => (
            <div key={k.id}>
              <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>
                {k.emoji} {katLabel(t, k.id)}
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
                          {t("provoz.skladem")} {p.aktualniStav} {p.jednotka} · {t("provoz.min")} {p.minZasoba}
                          {dodavatelNazev(p) ? ` · ${dodavatelNazev(p)}` : ""}
                          {isCritical ? " ⚠️" : ""}
                        </p>
                        {(() => {
                          const s = trvanlivostStatus(p.minTrvanlivost, t, locale);
                          if (!s) return null;
                          return (
                            <p className="text-xs font-semibold mt-0.5" style={{ color: s.color }}>
                              🗓 {s.label}
                            </p>
                          );
                        })()}
                        {(() => {
                          // Prediktivní dokup: odhad z rychlosti prodeje. Ukážeme
                          // jen když dojde do ~7 dní (jinak nezajímavé).
                          const dni = predikceDoprodeje(p.id, p.aktualniStav);
                          if (dni == null || dni > 7) return null;
                          const barva = dni <= 2 ? "#C0392B" : dni <= 4 ? "#E65100" : "#8a6d1f";
                          const txt = dni <= 0
                            ? t("provoz.dojdeDnes")
                            : t("provoz.dojdeZa").replace("{n}", String(dni));
                          return (
                            <p className="text-xs font-semibold mt-0.5" style={{ color: barva }}>📉 {txt}</p>
                          );
                        })()}
                      </div>
                      {p.cenaJednotka && (
                        <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)", flexShrink: 0, whiteSpace: "nowrap" }}>
                          {p.cenaJednotka} Kč/{p.jednotka}
                        </span>
                      )}
                      <button onClick={() => setEditId(p.id)} style={{ marginRight: 4, flexShrink: 0 }}>
                        <Pencil size={14} style={{ color: "var(--text-tertiary)" }} />
                      </button>
                      <button onClick={() => removePolozka(p.id)} style={{ flexShrink: 0 }}>
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
            <Plus size={16} /> {t("provoz.pridatPolozku")}
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
            zIndex: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", maxWidth: "calc(100vw - 32px)",
          }}
        >
          <Check size={15} strokeWidth={3} style={{ flexShrink: 0 }} /> <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{toast}</span>
        </div>
      )}
    </div>
  );
}

// ── Dodavatelé ────────────────────────────────────────────────────────────────
function DodavateleView() {
  const t = useT();
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
            <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>{t("provoz.zadniDodavatele")}</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("provoz.dodavateleDesc")}</p>
          </div>
          <button className="btn-primary" style={{ width: "auto", paddingLeft: 24, paddingRight: 24 }} onClick={() => setShowAdd(true)}>
            <Plus size={16} /> {t("provoz.pridatDodavatele")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {dodavatele.map(d => (
            <div key={d.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div style={{ minWidth: 0 }}>
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)", overflowWrap: "anywhere" }}>{d.nazev}</p>
                  {d.telefon && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)", overflowWrap: "anywhere" }}>📞 {d.telefon}</p>}
                  {d.email && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)", overflowWrap: "anywhere" }}>✉️ {d.email}</p>}
                  {d.poznamka && <p className="text-xs mt-0.5 italic" style={{ color: "var(--text-tertiary)", overflowWrap: "anywhere" }}>{d.poznamka}</p>}
                </div>
                <div className="flex gap-2" style={{ flexShrink: 0 }}>
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
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{t("provoz.novyDodavatel")}</p>
              {[
                { labelKey: "provoz.dod.nazev", value: nazev, set: setNazev, placeholderKey: "provoz.dod.nazevPlaceholder" },
                { labelKey: "provoz.dod.telefon", value: telefon, set: setTelefon, placeholderKey: "provoz.dod.telefonPlaceholder" },
                { labelKey: "provoz.dod.email", value: email, set: setEmail, placeholderKey: "provoz.dod.emailPlaceholder" },
                { labelKey: "provoz.dod.poznamka", value: poznamka, set: setPoznamka, placeholderKey: "provoz.dod.poznamkaPlaceholder" },
              ].map(f => (
                <div key={f.labelKey}>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t(f.labelKey)}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={t(f.placeholderKey)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-2xl text-sm font-bold" style={{ background: "var(--green-primary)", color: "white" }}>
                  {t("common.save")}
                </button>
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-2xl text-sm font-bold" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)}
              className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "white", color: "var(--green-primary)", border: "1.5px dashed var(--green-primary)" }}>
              <Plus size={16} /> {t("provoz.pridatDodavatele")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Co dokoupit (kritické zásoby) ─────────────────────────────────────────────
function CoDokoupit() {
  const t = useT();
  const { getPolozkyCritical } = useProvozStore();
  const addShoppingItem = useShoppingStore((s) => s.addItem);
  const critical = getPolozkyCritical();
  const [added, setAdded] = useState<Set<string>>(new Set());
  if (critical.length === 0) return null;

  // Doporučené množství k doobjednání = kolik chybí do minima (aspoň 1).
  const toBuy = (p: InventuraPolozka) => Math.max(1, p.minZasoba - p.aktualniStav);

  const addOne = (p: InventuraPolozka) => {
    addShoppingItem({ name: p.nazev, quantity: toBuy(p), unit: p.jednotka }, "provoz");
    setAdded((s) => new Set(s).add(p.id));
  };
  const addAll = () => {
    critical.forEach((p) => addShoppingItem({ name: p.nazev, quantity: toBuy(p), unit: p.jednotka }, "provoz"));
    setAdded(new Set(critical.map((p) => p.id)));
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#E65100", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>
          {t("provoz.coDokoupit").replace("{n}", String(critical.length))}
        </p>
        <button
          onClick={addAll}
          style={{ fontSize: 11, fontWeight: 700, color: "#E65100", background: "#FFE0B2", border: "none", borderRadius: 99, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}
        >
          <Plus size={12} /> {t("provoz.coDokoupitAddAll")}
        </button>
      </div>
      <div style={{ background: "#FFF3E0", border: "1px solid #FFE0B2", borderRadius: 16, overflow: "hidden" }}>
        {critical.map((p, idx) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "11px 16px", borderBottom: idx < critical.length - 1 ? "1px solid #FFE0B2" : "none" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#BF360C", margin: 0, overflowWrap: "anywhere" }}>{p.nazev}</p>
              <p style={{ fontSize: 11, color: "#E65100", margin: 0 }}>
                {t("provoz.skladStavLabel").replace("{stav}", String(p.aktualniStav)).replace("{min}", String(p.minZasoba)).replace("{j}", p.jednotka)}
              </p>
            </div>
            <button
              onClick={() => addOne(p)}
              disabled={added.has(p.id)}
              style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "5px 10px", border: "none", display: "flex", alignItems: "center", gap: 4, background: added.has(p.id) ? "#C8E6C9" : "white", color: added.has(p.id) ? "#2E7D32" : "#E65100" }}
            >
              {added.has(p.id) ? <><Check size={12} /> {t("provoz.coDokoupitAdded")}</> : <><Plus size={12} /> {t("provoz.coDokoupitAdd")}</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Obrazovka přípravy (Kuchyně / Bar) ─────────────────────────────────────────
// Sem padají objednávky odeslané z kasy tlačítkem „Odeslat na přípravu".
// Kuchař/barman vidí, co má připravit, a odškrtne hotové.
function PripravaView({ pracoviste }: { pracoviste: Pracoviste }) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const tickets = useTicketStore((s) => s.tickets);
  // Bonovací displej: ukážeme VŠECHNY dnešní lístky pracoviště, nejnovější
  // nahoře. Nic se neodškrtává — starší (10+ min) jen ztlumíme, ať kuchař vidí
  // celou směnu a nové poznatky nahoře. Namarkuje → vyjede → servírka si vezme.
  const dnes = new Date().toISOString().slice(0, 10);
  const aktivni = tickets
    .filter((tk) => tk.pracoviste === pracoviste && tk.datum.slice(0, 10) === dnes)
    .sort((a, b) => b.datum.localeCompare(a.datum)); // nejnovější první

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        {pracoviste === "kuchyne" ? <ChefHat size={20} style={{ color: "var(--green-primary)" }} /> : <Beer size={20} style={{ color: "var(--green-primary)" }} />}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          {pracoviste === "kuchyne" ? t("provoz.tab.kuchyne") : t("provoz.tab.bar")}
        </h2>
        {aktivni.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "white", background: "var(--green-primary)", borderRadius: 999, padding: "2px 10px" }}>
            {aktivni.length}
          </span>
        )}
      </div>

      {/* Info: jak lístky fungují + že tisk na bonovací tiskárnu je až v appce */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", borderRadius: 12, background: "var(--blue-wash, #E4EEF3)", marginBottom: 14 }}>
        <Printer size={15} style={{ color: "#2f6d8c", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12.5, color: "#2f6d8c", margin: 0, lineHeight: 1.45 }}>{t("provoz.priprava.info")}</p>
      </div>

      {aktivni.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
            {pracoviste === "kuchyne" ? <ChefHat size={28} style={{ color: "var(--green-primary)" }} /> : <Beer size={28} style={{ color: "var(--green-primary)" }} />}
          </div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{t("provoz.priprava.prazdno")}</p>
        </div>
      ) : (
        <div className="priprava-grid" style={{ display: "grid", gap: 12 }}>
          {aktivni.map((tk) => {
            const cas = new Date(tk.datum).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
            const min = Math.floor((Date.now() - new Date(tk.datum).getTime()) / 60000);
            // Nový lístek (< 10 min) = jasný, zvýrazněný. Starší = ztlumený
            // (obsloužený, jen historie). Žádné odškrtávání — vyjelo, vzalo se.
            const novy = min < 10;
            return (
              <div key={tk.id} className="card" style={{ padding: 14, opacity: novy ? 1 : 0.55,
                border: novy ? "1.5px solid var(--green-primary)" : "1px solid var(--border)",
                background: novy ? "var(--green-light)" : "var(--bg-secondary, white)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{tk.oznaceni}</span>
                  {novy && <span style={{ fontSize: 10, fontWeight: 800, color: "white", background: "var(--green-primary)", borderRadius: 99, padding: "2px 8px", letterSpacing: "0.04em" }}>{t("provoz.priprava.novy")}</span>}
                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--text-tertiary)", fontWeight: 500, marginLeft: "auto" }}>
                    <Clock size={12} /> {cas}{min > 0 ? ` · před ${min} min` : ""}
                  </span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                  {tk.polozky.map((p, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, fontSize: 15, color: "var(--text-primary)" }}>
                      <span style={{ fontWeight: 800, color: "var(--green-dark)", minWidth: 28 }}>{p.mnozstvi}×</span>
                      <span>{p.nazev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Hlavní view ───────────────────────────────────────────────────────────────
type ProvozTab = "kasa" | "ucetnictvi" | "inventura" | "sklad" | "recepty" | "historie" | "odpisy" | "dodavatele" | "uctenky" | "kuchyne" | "bar";

export function ProvozView() {
  const t = useT();
  const { polozky, inventury, vytvorInventuru, aktivniInventuraId, setAktivniInventura } = useProvozStore();
  const provozSubTab = useUIStore((s) => s.provozSubTab);
  const setProvozSubTab = useUIStore((s) => s.setProvozSubTab);
  const setProvozActiveTab = useUIStore((s) => s.setProvozActiveTab);
  const jeObchod = useBusinessStore((s) => s.typProvozu) === "obchod";
  // Režim zaměstnance: lokální PIN-zámek NEBO cloud role "employee" → jen Kasa.
  const zamestnanec = useJeZamestnanec();
  const [tab, setTabRaw] = useState<ProvozTab>("kasa");

  // Přepnutí vnitřní záložky vždy propiš i do trvalého stavu v uiStore, aby
  // spodní lišta věděla, kde jsme, a rozsvítila správnou ikonu. (provozSubTab
  // je jen pomíjivý signál, který se hned nuluje — na svícení nestačí.)
  const setTab = useCallback((next: ProvozTab) => {
    setTabRaw(next);
    setProvozActiveTab(next);
  }, [setProvozActiveTab]);

  // Spodní provozní lišta nastaví provozSubTab → skoč na tu vnitřní záložku.
  // Řešíme přes refs bez synchronního setState v efektu (jinak kaskáda renderů):
  // efekt jen porovná poslední zpracovaný signál a případně přepne tab.
  const lastSubRef = useRef<ProvozSubTab | undefined>(undefined);
  useEffect(() => {
    if (provozSubTab && provozSubTab !== lastSubRef.current) {
      lastSubRef.current = provozSubTab;
      setTab(provozSubTab);
      // Vynulování signálu odložíme mimo tento render (zabrání kaskádě).
      queueMicrotask(() => setProvozSubTab(null));
    }
    if (!provozSubTab) lastSubRef.current = undefined;
  }, [provozSubTab, setProvozSubTab, setTab]);
  const [showNazevModal, setShowNazevModal] = useState(false);
  const [novyNazev, setNovyNazev] = useState("");
  const [slepa, setSlepa] = useState(false);

  const aktivniInventura = inventury.find(i => i.id === aktivniInventuraId && !i.zavrena);
  const rozpracovane = inventury.filter(i => !i.zavrena && i.id !== aktivniInventuraId);

  const handleVytvorit = () => {
    if (!novyNazev.trim()) return;
    vytvorInventuru(novyNazev.trim(), slepa);
    setNovyNazev("");
    setSlepa(false);
    setShowNazevModal(false);
    setTab("inventura");
  };

  // Sekce pod tlačítkem „Víc" (spodní lišta). Hlavní 4 (Kasa/Sklad/Inventura/
  // Účto) jsou přímo ve spodní liště, tady nejsou. Recepty jen restaurace.
  const VIC_TABS: { id: ProvozTab; labelKey: string; icon: React.ReactNode }[] = [
    // Kuchyně + Bar jen v restauraci — sem padají odeslané objednávky.
    ...(jeObchod ? [] : [
      { id: "kuchyne" as ProvozTab, labelKey: "provoz.tab.kuchyne", icon: <ChefHat size={15} /> },
      { id: "bar" as ProvozTab, labelKey: "provoz.tab.bar", icon: <Beer size={15} /> },
      { id: "recepty" as ProvozTab, labelKey: "provoz.tab.recepty", icon: <ChefHat size={15} /> },
    ]),
    { id: "uctenky", labelKey: "provoz.tab.uctenky", icon: <Receipt size={15} /> },
    { id: "dodavatele", labelKey: "provoz.tab.dodavatele", icon: <Truck size={15} /> },
    { id: "odpisy", labelKey: "provoz.tab.odpisy", icon: <TrendingDown size={15} /> },
    { id: "historie", labelKey: "provoz.tab.historie", icon: <BarChart3 size={15} /> },
  ];


  // Režim zaměstnance → jen Kasa a tlačítko odemknout (majitel zadá PIN).
  if (zamestnanec) {
    return (
      <div className="relative flex-1 overflow-y-auto">
        <div className="px-5 pt-2 pb-24" style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
          <KasaView />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-y-auto provoz-scroll">
      <div className={`px-5 pt-2 pb-24 provoz-inner provoz-tab-${tab}`} style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>

        {/* Hlavní 4 záložky (Kasa/Sklad/Inventura/Účto) se ovládají spodní lištou,
            takže tady horní navigaci NEukazujeme. „Víc" sekce (Recepty/Dodavatelé/
            Odpisy/Historie) dostane vlastní podmenu s tlačítkem zpět na dlaždice. */}
        {VIC_TABS.some(v => v.id === tab) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
              {VIC_TABS.map(tb => (
                <button key={tb.id} onClick={() => setTab(tb.id)}
                  style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: tab === tb.id ? 700 : 500,
                    background: tab === tb.id ? "var(--green-primary)" : "white",
                    color: tab === tb.id ? "white" : "var(--text-secondary)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "none",
                    whiteSpace: "nowrap",
                  }}>
                  {tb.icon} {t(tb.labelKey)}
                </button>
              ))}
            </div>
          </div>
        )}

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
                      {t("provoz.rozpracovane")}
                    </p>
                    {rozpracovane.map(inv => (
                      <button key={inv.id} onClick={() => setAktivniInventura(inv.id)}
                        className="card w-full p-4 mb-2 flex items-center justify-between text-left">
                        <div>
                          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{inv.nazev}</p>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{inv.datum} · {t("provoz.polozekZ").replace("{a}", String(inv.zaznamy.length)).replace("{b}", String(polozky.length))}</p>
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
                      <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>{t("provoz.jakZacit")}</p>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("provoz.triKroky")}</p>
                    </div>
                    {[
                      { step: 1, icon: <Package size={20} style={{ color: "var(--green-primary)" }} />, title: t("provoz.krok1.title"), desc: t("provoz.krok1.desc"), action: () => setTab("sklad"), btn: t("provoz.krok1.btn") },
                      { step: 2, icon: <ClipboardList size={20} style={{ color: "#E8862E" }} />, title: t("provoz.krok2.title"), desc: t("provoz.krok2.desc"), action: null, btn: null },
                      { step: 3, icon: <FileText size={20} style={{ color: "#E87D35" }} />, title: t("provoz.krok3.title"), desc: t("provoz.krok3.desc"), action: null, btn: null },
                    ].map(({ step, icon, title, desc, action, btn }) => (
                      <div key={step} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1.5px solid var(--border)", opacity: step === 1 ? 1 : 0.55 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: step === 1 ? "var(--green-light)" : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)" }}>{t("provoz.krok").replace("{n}", String(step))}</span>
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
                      <p className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>{t("provoz.spustitInventuru")}</p>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {t("provoz.projdetePolozek").replace("{n}", String(polozky.length))}
                      </p>
                    </div>
                    <button className="btn-primary" style={{ width: "auto", paddingLeft: 28, paddingRight: 28 }} onClick={() => setShowNazevModal(true)}>
                      <ClipboardList size={16} /> {t("provoz.zacitInventuru")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "kasa" && <KasaView />}
        {tab === "ucetnictvi" && <UcetnictviView />}
        {tab === "sklad" && <SpravaSkladu />}
        {tab === "recepty" && <RecipesView />}
        {tab === "historie" && <HistorieInventur />}
        {tab === "uctenky" && <UctenkyView />}
        {tab === "kuchyne" && <PripravaView pracoviste="kuchyne" />}
        {tab === "bar" && <PripravaView pracoviste="bar" />}
        {tab === "odpisy" && <OdpisyView />}
        {tab === "dodavatele" && <DodavateleView />}
      </div>

      {/* Modal pro název inventury */}
      {showNazevModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setShowNazevModal(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div className="relative rounded-t-3xl px-5 pt-5 pb-10 space-y-4 animate-slide-up"
            style={{ background: "var(--bg-primary)", paddingBottom: "max(40px, env(safe-area-inset-bottom, 40px))" }}>
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("provoz.nazevInventury")}</h3>
            <input
              autoFocus value={novyNazev} onChange={e => setNovyNazev(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVytvorit()}
              placeholder={t("provoz.nazevInventuryPlaceholder")}
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
              style={{ background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
            />
            {/* Slepá inventura — zaměstnanec nevidí očekávaný stav, musí počítat */}
            <button
              onClick={() => setSlepa(s => !s)}
              style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", textAlign: "left", background: "white", border: `1.5px solid ${slepa ? "var(--green-primary)" : "var(--border)"}`, borderRadius: 16, padding: "12px 14px" }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1, background: slepa ? "var(--green-primary)" : "white", border: `1.5px solid ${slepa ? "var(--green-primary)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {slepa && <Check size={14} color="white" strokeWidth={3} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t("provoz.slepa.title")}</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{t("provoz.slepa.desc")}</p>
              </div>
            </button>
            <button onClick={handleVytvorit} className="btn-primary" disabled={!novyNazev.trim()}>
              <ClipboardList size={16} /> {t("provoz.spustitInventuru")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
