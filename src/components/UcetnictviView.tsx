"use client";

import { useState, useMemo } from "react";
import { TrendingUp, Wallet, CreditCard, Banknote, Percent, FileText, FileSpreadsheet, Trophy } from "lucide-react";
import { useKasaStore, UcetniSouhrn, Prodejka } from "@/store/kasaStore";
import { useBusinessStore, FirmaUdaje } from "@/store/businessStore";
import { useT, useLocale } from "@/lib/i18n";
import type { Locale } from "@/store/localeStore";

type TFn = (key: string) => string;
type ObdobiKey = "dnes" | "tyden" | "mesic" | "rok" | "vlastni";

// Lokální YYYY-MM-DD (ne UTC).
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Vrátí [od, do] pro rychlé období. Počítá se z „dnes" předaného zvenčí,
// aby se Date.now() volalo jen v komponentě (ne v modulu/store).
function rozsahProObdobi(key: ObdobiKey, dnes: Date): [string, string] {
  const doISO = iso(dnes);
  const od = new Date(dnes);
  if (key === "tyden") od.setDate(od.getDate() - 6);
  else if (key === "mesic") od.setDate(od.getDate() - 29);
  else if (key === "rok") od.setDate(od.getDate() - 364);
  return [iso(od), doISO];
}

function fmt(n: number, locale: string): string {
  return n.toLocaleString(locale, { maximumFractionDigits: 2 });
}

// ── Export CSV — jeden řádek na prodejní řádek účtenky ──────────────────────────
function exportCSV(prodejky: Prodejka[], odISO: string, doISO: string) {
  const head = ["Datum", "Čas", "Položka", "Množství", "Cena/ks", "Celkem", "DPH %", "Platba"];
  const rows = [head];
  prodejky.forEach((p) => {
    const d = new Date(p.datum);
    const datum = d.toLocaleDateString("cs-CZ");
    const cas = d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    p.radky.forEach((r) => {
      rows.push([
        datum, cas, r.nazev, String(r.mnozstvi),
        String(r.cena), String(r.cena * r.mnozstvi),
        String(r.dphSazba ?? 21), p.platba === "karta" ? "karta" : "hotovost",
      ]);
    });
  });
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prodeje-${odISO}_${doISO}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Export PDF — přehled/uzávěrka za období ─────────────────────────────────────
async function exportPDF(s: UcetniSouhrn, odISO: string, doISO: string, t: TFn, locale: Locale, nazevFirmy: string, firma: FirmaUdaje) {
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import("jspdf"),
    import("html2canvas").then((m) => m.default),
  ]);
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:#fff;font-family:system-ui,sans-serif;padding:32px;box-sizing:border-box;";

  const dphRows = s.dph.map((d) => `<tr>
    <td style="padding:6px 8px;border-bottom:1px solid #eee">${d.sazba} %</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${fmt(d.zaklad, dateLocale)} Kč</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:700">${fmt(d.dan, dateLocale)} Kč</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${fmt(d.brutto, dateLocale)} Kč</td>
  </tr>`).join("");

  const topRows = s.topProdukty.map((p, i) => `<tr>
    <td style="padding:5px 8px;border-bottom:1px solid #f0f0f0;color:#888">${i + 1}.</td>
    <td style="padding:5px 8px;border-bottom:1px solid #f0f0f0">${p.nazev}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #f0f0f0;text-align:right">${p.mnozstvi}×</td>
    <td style="padding:5px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">${fmt(p.trzba, dateLocale)} Kč</td>
  </tr>`).join("");

  // Řádek s identifikací firmy (jen co je vyplněno).
  const idRadek = [
    firma.ico ? `IČO: ${firma.ico}` : "",
    firma.dic ? `DIČ: ${firma.dic}` : "",
    firma.telefon ? `tel: ${firma.telefon}` : "",
  ].filter(Boolean).join(" · ");
  const esc = (x: string) => x.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  container.innerHTML = `
    <div style="background:#006d40;color:#fff;padding:14px 18px;border-radius:10px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:14px;font-weight:800;letter-spacing:.04em">${t("ucto.exportHlavicka")}</span>
      <span style="font-size:11px;opacity:.85">Spižírna</span>
    </div>
    ${(nazevFirmy || idRadek || firma.adresa || firma.logoUrl) ? `
    <div style="display:flex;align-items:center;gap:14px;margin:14px 4px 4px">
      ${firma.logoUrl ? `<img src="${firma.logoUrl}" alt="" style="width:48px;height:48px;object-fit:contain;border-radius:8px"/>` : ""}
      <div>
        ${nazevFirmy ? `<div style="font-size:15px;font-weight:800;color:#1a1a1a">${esc(nazevFirmy)}</div>` : ""}
        ${firma.adresa ? `<div style="font-size:11px;color:#666">${esc(firma.adresa)}</div>` : ""}
        ${idRadek ? `<div style="font-size:11px;color:#666">${esc(idRadek)}</div>` : ""}
      </div>
    </div>` : ""}
    <p style="margin:10px 4px 18px;font-size:12px;color:#888">${t("ucto.datumOd")} ${odISO} ${t("ucto.datumDo")} ${doISO}</p>

    <div style="display:flex;gap:12px;margin-bottom:20px">
      <div style="flex:1;background:#F1FAF5;border:1px solid #cfe9db;border-radius:10px;padding:12px 14px">
        <div style="font-size:11px;color:#2E7D32;text-transform:uppercase;font-weight:700">${t("ucto.trzba")}</div>
        <div style="font-size:22px;font-weight:800;color:#1a1a1a">${fmt(s.trzba, dateLocale)} Kč</div>
        <div style="font-size:11px;color:#888">${s.pocetUctenek} ${t("ucto.uctenek").toLowerCase()} · ${t("ucto.hotovost")}: ${fmt(s.hotovost, dateLocale)} · ${t("ucto.karta")}: ${fmt(s.karta, dateLocale)}</div>
      </div>
      <div style="flex:1;background:#FFFBF0;border:1px solid #f0e2c0;border-radius:10px;padding:12px 14px">
        <div style="font-size:11px;color:#B8860B;text-transform:uppercase;font-weight:700">${t("ucto.zisk")}</div>
        <div style="font-size:22px;font-weight:800;color:#1a1a1a">${fmt(s.zisk, dateLocale)} Kč</div>
        <div style="font-size:11px;color:#888">${t("ucto.marze")}: ${fmt(s.marzeProcent, dateLocale)} % · ${t("ucto.nakup")}: ${fmt(s.nakup, dateLocale)} Kč</div>
      </div>
    </div>

    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#333">${t("ucto.dph")}</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px">
      <thead><tr style="background:#2d2d2d;color:#fff">
        <th style="padding:8px;text-align:left">${t("ucto.dphSazba")}</th>
        <th style="padding:8px;text-align:right">${t("ucto.dphZaklad")}</th>
        <th style="padding:8px;text-align:right">${t("ucto.dphDan")}</th>
        <th style="padding:8px;text-align:right">Celkem</th>
      </tr></thead>
      <tbody>${dphRows}</tbody>
    </table>
    <p style="margin:0 0 20px;font-size:12px;color:#333;text-align:right">${t("ucto.dphCelkem")}: <b>${fmt(s.dphCelkem, dateLocale)} Kč</b></p>

    ${topRows ? `<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#333">${t("ucto.top")}</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px">${topRows}</table>` : ""}

    <p style="margin-top:26px;font-size:10px;color:#bbb;text-align:right">Spižírna · ${new Date().toLocaleDateString(dateLocale)}</p>
  `;

  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#fff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imgW = 210, imgH = (canvas.height * imgW) / canvas.width;
    let posY = 0;
    while (posY < imgH) {
      if (posY > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -posY, imgW, imgH);
      posY += 297;
    }
    pdf.save(`ucetnictvi-${odISO}_${doISO}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

// ── Karta jednoho čísla ─────────────────────────────────────────────────────────
function StatCard({ icon, label, hodnota, podnadpis, barva }: {
  icon: React.ReactNode; label: string; hodnota: string; podnadpis?: string; barva: string;
}) {
  return (
    <div className="card" style={{ padding: 14, flex: "1 1 140px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${barva}22`, display: "flex", alignItems: "center", justifyContent: "center", color: barva, flexShrink: 0 }}>{icon}</div>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{label}</span>
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>{hodnota}</p>
      {podnadpis && <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{podnadpis}</p>}
    </div>
  );
}

// ── Hlavní obrazovka účetnictví ─────────────────────────────────────────────────
export function UcetnictviView() {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const getSouhrn = useKasaStore((s) => s.getSouhrn);
  const prodejky = useKasaStore((s) => s.prodejky);
  const nazevFirmy = useBusinessStore((s) => s.name);
  const firma = useBusinessStore((s) => s.firma);

  const dnes = useMemo(() => new Date(), []);
  const [obdobi, setObdobi] = useState<ObdobiKey>("dnes");
  const [odVlastni, setOdVlastni] = useState(iso(dnes));
  const [doVlastni, setDoVlastni] = useState(iso(dnes));

  const [odISO, doISO] = obdobi === "vlastni"
    ? [odVlastni, doVlastni]
    : rozsahProObdobi(obdobi, dnes);

  const s = useMemo(() => getSouhrn(odISO, doISO), [getSouhrn, odISO, doISO]);
  const prodejeVObdobi = useMemo(
    () => prodejky.filter((p) => { const d = p.datum.slice(0, 10); return d >= odISO && d <= doISO; }),
    [prodejky, odISO, doISO],
  );

  const OBDOBI: { id: ObdobiKey; label: string }[] = [
    { id: "dnes", label: t("ucto.dnes") },
    { id: "tyden", label: t("ucto.tyden") },
    { id: "mesic", label: t("ucto.mesic") },
    { id: "rok", label: t("ucto.rok") },
    { id: "vlastni", label: t("ucto.vlastni") },
  ];

  return (
    <div>
      {/* Přepínač období */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", marginBottom: 12 }}>
        {OBDOBI.map((o) => (
          <button key={o.id} onClick={() => setObdobi(o.id)}
            style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: obdobi === o.id ? 700 : 500, background: obdobi === o.id ? "var(--green-primary)" : "white", color: obdobi === o.id ? "white" : "var(--text-secondary)", border: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", whiteSpace: "nowrap" }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Vlastní od–do */}
      {obdobi === "vlastni" && (
        <div className="card" style={{ padding: 12, marginBottom: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 130px" }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("ucto.od")}</label>
            <input type="date" value={odVlastni} onChange={(e) => setOdVlastni(e.target.value)} max={doVlastni}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
          <div style={{ flex: "1 1 130px" }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("ucto.do")}</label>
            <input type="date" value={doVlastni} onChange={(e) => setDoVlastni(e.target.value)} min={odVlastni} max={iso(dnes)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
        </div>
      )}

      {s.pocetUctenek === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>{t("ucto.zadneProdeje")}</p>
        </div>
      ) : (
        <>
          {/* Uzávěrka — tržba + platby */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <StatCard icon={<Wallet size={17} />} barva="#006d40"
              label={t("ucto.trzba")} hodnota={`${fmt(s.trzba, dateLocale)} Kč`}
              podnadpis={`${s.pocetUctenek} ${t("ucto.uctenek").toLowerCase()}`} />
            <StatCard icon={<Banknote size={17} />} barva="#4CAF82"
              label={t("ucto.hotovost")} hodnota={`${fmt(s.hotovost, dateLocale)} Kč`} />
            <StatCard icon={<CreditCard size={17} />} barva="#3d7a5a"
              label={t("ucto.karta")} hodnota={`${fmt(s.karta, dateLocale)} Kč`} />
          </div>

          {/* Zisk / marže */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <StatCard icon={<TrendingUp size={17} />} barva="#B8860B"
              label={t("ucto.zisk")} hodnota={`${fmt(s.zisk, dateLocale)} Kč`} podnadpis={t("ucto.ziskInfo")} />
            <StatCard icon={<Percent size={17} />} barva="#8a6d1f"
              label={t("ucto.marze")} hodnota={`${fmt(s.marzeProcent, dateLocale)} %`}
              podnadpis={`${t("ucto.nakup")}: ${fmt(s.nakup, dateLocale)} Kč`} />
          </div>

          {/* DPH rozpad */}
          <div className="card overflow-hidden" style={{ marginBottom: 16 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t("ucto.dph")}</p>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{t("ucto.dphPozn")}</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 340 }}>
                <thead>
                  <tr style={{ background: "var(--surface-container, #eef5f7)" }}>
                    <th style={{ padding: "8px 16px", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>{t("ucto.dphSazba")}</th>
                    <th style={{ padding: "8px 16px", textAlign: "right", fontWeight: 600, color: "var(--text-secondary)" }}>{t("ucto.dphZaklad")}</th>
                    <th style={{ padding: "8px 16px", textAlign: "right", fontWeight: 600, color: "var(--text-secondary)" }}>{t("ucto.dphDan")}</th>
                  </tr>
                </thead>
                <tbody>
                  {s.dph.map((d) => (
                    <tr key={d.sazba} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "9px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{d.sazba} %</td>
                      <td style={{ padding: "9px 16px", textAlign: "right", color: "var(--text-secondary)" }}>{fmt(d.zaklad, dateLocale)} Kč</td>
                      <td style={{ padding: "9px 16px", textAlign: "right", fontWeight: 700, color: "var(--text-primary)" }}>{fmt(d.dan, dateLocale)} Kč</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "2px solid var(--border)", background: "var(--green-light)" }}>
                    <td style={{ padding: "9px 16px", fontWeight: 700, color: "var(--green-dark)" }}>{t("ucto.dphCelkem")}</td>
                    <td />
                    <td style={{ padding: "9px 16px", textAlign: "right", fontWeight: 800, color: "var(--green-dark)" }}>{fmt(s.dphCelkem, dateLocale)} Kč</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top produkty */}
          {s.topProdukty.length > 0 && (
            <div className="card overflow-hidden" style={{ marginBottom: 16 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <Trophy size={16} style={{ color: "#B8860B" }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t("ucto.top")}</p>
              </div>
              {s.topProdukty.map((p, i) => (
                <div key={p.nazev} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-tertiary)", minWidth: 18 }}>{i + 1}.</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nazev}</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t("ucto.kusu").replace("{n}", String(p.mnozstvi))}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", minWidth: 70, textAlign: "right" }}>{fmt(p.trzba, dateLocale)} Kč</span>
                </div>
              ))}
            </div>
          )}

          {/* Export */}
          <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>{t("ucto.export")}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => exportPDF(s, odISO, doISO, t, locale, nazevFirmy, firma)}
              style={{ flex: "1 1 140px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 700, background: "var(--green-primary)", color: "white", border: "none" }}>
              <FileText size={16} /> {t("ucto.exportPdf")}
            </button>
            <button onClick={() => exportCSV(prodejeVObdobi, odISO, doISO)}
              style={{ flex: "1 1 140px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 700, background: "white", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
              <FileSpreadsheet size={16} /> {t("ucto.exportCsv")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
