// Tisk účtenky — tři způsoby (jen v nativní appce, web tisk nepodporuje):
//  1) BLUETOOTH  ESC/POS termotiskárna (capacitor-thermal-printer)
//  2) WIFI/SÍŤ   ESC/POS přes TCP na IP:9100 (capacitor-tcp-socket)
//  3) PDF/A4      systémový tisk telefonu → jakákoli tiskárna (i WiFi/USB)
//
// ⚠️ BETA: ESC/POS naprogramováno podle standardu; chování se u konkrétních
// modelů může lišit — doladí se podle reálné tiskárny.

import { Capacitor } from "@capacitor/core";

export type TiskarnaTyp = "bluetooth" | "wifi" | "pdf";

export interface UctenkaData {
  nazevFirmy: string;
  firma: {
    ico?: string;
    dic?: string;
    adresa?: string;
    telefon?: string;
    patickaUctenky?: string;
  };
  radky: { nazev: string; mnozstvi: number; cena: number }[];
  celkem: number;
  platba?: string;      // "hotovost" | "karta"
  datum: string;        // ISO
  cislo?: string;       // lidský kód účtenky pro tisk, např. "26-000042"
  vraceno?: boolean;    // doklad o vrácení (na účtence odlišíme nadpisem)
}

export type TiskVysledek =
  | { ok: true }
  | { ok: false; duvod: "not-native" | "no-printer" | "error"; zprava?: string };

// ── Pomocné: datum a formát ──────────────────────────────────────────────────
function datumText(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const cas = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${dd}.${mm}.${d.getFullYear()} ${cas}`;
}
const CARA = "--------------------------------";
const kc = (n: number) => `${n.toFixed(2)} Kc`; // ESC/POS = ASCII, bez diakritiky

// Odstraní diakritiku (ESC/POS tiskárny běžně neumí UTF-8).
function bezDiakritiky(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// ══════════════════════════════════════════════════════════════════════════
// 1) BLUETOOTH — capacitor-thermal-printer (fluent API)
// ══════════════════════════════════════════════════════════════════════════

// Naskenuje BT tiskárny a vrátí jejich seznam (uživatel si vybere).
export async function najdiTiskarny(timeoutMs = 6000): Promise<{ name: string; address: string }[]> {
  if (!Capacitor.isNativePlatform()) return [];
  const { CapacitorThermalPrinter } = await import("capacitor-thermal-printer");
  const found: Record<string, { name: string; address: string }> = {};

  const handle = await CapacitorThermalPrinter.addListener("discoverDevices", (data: any) => {
    for (const d of data?.devices ?? []) {
      if (d?.address) found[d.address] = { name: d.name || d.address, address: d.address };
    }
  });

  await CapacitorThermalPrinter.startScan();
  await new Promise((r) => setTimeout(r, timeoutMs));
  try { await CapacitorThermalPrinter.stopScan?.(); } catch {}
  await handle.remove();

  return Object.values(found);
}

async function tiskBluetooth(data: UctenkaData, printerAddress: string): Promise<TiskVysledek> {
  if (!printerAddress) return { ok: false, duvod: "no-printer" };
  try {
    const { CapacitorThermalPrinter } = await import("capacitor-thermal-printer");
    await CapacitorThermalPrinter.connect({ address: printerAddress });

    const datumStr = datumText(data.datum);
    let p = CapacitorThermalPrinter.begin();
    p = p.align("center").bold(true).text(`${bezDiakritiky(data.nazevFirmy) || "Uctenka"}\n`).bold(false);
    if (data.firma.adresa) p = p.text(`${bezDiakritiky(data.firma.adresa)}\n`);
    if (data.firma.ico) p = p.text(`ICO: ${data.firma.ico}\n`);
    if (data.firma.dic) p = p.text(`DIC: ${data.firma.dic}\n`);
    if (data.firma.telefon) p = p.text(`Tel: ${data.firma.telefon}\n`);
    if (data.vraceno) p = p.align("center").bold(true).text("*** VRACENI ***\n").bold(false).align("left");
    p = p.align("left").text(`${CARA}\n`);
    if (data.cislo) p = p.text(`Uctenka c. ${data.cislo}\n`);
    p = p.text(`${datumStr}\n${CARA}\n`);
    for (const r of data.radky) {
      const soucet = r.cena * r.mnozstvi;
      p = p.text(`${bezDiakritiky(r.nazev)}\n`);
      p = p.align("right").text(`${r.mnozstvi} x ${kc(r.cena)} = ${kc(soucet)}\n`).align("left");
    }
    p = p.text(`${CARA}\n`);
    p = p.align("right").bold(true).text(`CELKEM: ${kc(data.celkem)}\n`).bold(false).align("left");
    if (data.platba) p = p.text(`Platba: ${data.platba === "karta" ? "Kartou" : "Hotove"}\n`);
    p = p.align("center").text(`\n${bezDiakritiky(data.firma.patickaUctenky || "Dekujeme za nakup!")}\n`);
    p = p.feedCutPaper();

    await p.write();
    try { await CapacitorThermalPrinter.disconnect(); } catch {}
    return { ok: true };
  } catch (e: any) {
    return { ok: false, duvod: "error", zprava: String(e?.message || e || "") };
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 2) WIFI / SÍŤ — raw ESC/POS bajty přes TCP na IP:9100
// ══════════════════════════════════════════════════════════════════════════

// Sestaví syrové ESC/POS bajty účtenky (stejný layout jako BT verze).
function escposBajty(data: UctenkaData): number[] {
  const ESC = 0x1b, GS = 0x1d, LF = 0x0a;
  const out: number[] = [];
  const push = (...b: number[]) => out.push(...b);
  const txt = (s: string) => { for (const ch of bezDiakritiky(s)) out.push(ch.charCodeAt(0) & 0xff); };
  const line = (s = "") => { txt(s); push(LF); };
  const align = (n: 0 | 1 | 2) => push(ESC, 0x61, n); // 0 vlevo, 1 střed, 2 vpravo
  const bold = (on: boolean) => push(ESC, 0x45, on ? 1 : 0);

  push(ESC, 0x40); // inicializace tiskárny
  align(1); bold(true); line(data.nazevFirmy || "Uctenka"); bold(false);
  if (data.firma.adresa) line(data.firma.adresa);
  if (data.firma.ico) line(`ICO: ${data.firma.ico}`);
  if (data.firma.dic) line(`DIC: ${data.firma.dic}`);
  if (data.firma.telefon) line(`Tel: ${data.firma.telefon}`);
  if (data.vraceno) { align(1); bold(true); line("*** VRACENI ***"); bold(false); }
  align(0); line(CARA);
  if (data.cislo) line(`Uctenka c. ${data.cislo}`);
  line(datumText(data.datum)); line(CARA);
  for (const r of data.radky) {
    line(r.nazev);
    align(2); line(`${r.mnozstvi} x ${kc(r.cena)} = ${kc(r.cena * r.mnozstvi)}`); align(0);
  }
  line(CARA);
  align(2); bold(true); line(`CELKEM: ${kc(data.celkem)}`); bold(false); align(0);
  if (data.platba) line(`Platba: ${data.platba === "karta" ? "Kartou" : "Hotove"}`);
  align(1); line(); line(data.firma.patickaUctenky || "Dekujeme za nakup!");
  push(LF, LF, LF);
  push(GS, 0x56, 0x42, 0x00); // odříznutí papíru (partial cut)
  return out;
}

function bajtyNaHex(bajty: number[]): string {
  return bajty.map((b) => (b & 0xff).toString(16).padStart(2, "0")).join("");
}

async function tiskWifi(data: UctenkaData, ip: string, port = 9100): Promise<TiskVysledek> {
  if (!ip) return { ok: false, duvod: "no-printer" };
  try {
    const { TcpSocket, DataEncoding } = await import("capacitor-tcp-socket");
    const { client } = await TcpSocket.connect({ ipAddress: ip, port });
    try {
      await TcpSocket.send({ client, data: bajtyNaHex(escposBajty(data)), encoding: DataEncoding.HEX });
    } finally {
      try { await TcpSocket.disconnect({ client }); } catch {}
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, duvod: "error", zprava: String(e?.message || e || "") };
  }
}

// Auto-discovery síťových tiskáren — prohledá lokální podsíť na portu 9100.
// (Pomalejší než BT; kdyby nic nenašlo, uživatel zadá IP ručně.)
export async function najdiSitoveTiskarny(timeoutMs = 400): Promise<{ name: string; address: string }[]> {
  if (!Capacitor.isNativePlatform()) return [];
  try {
    const { TcpSocket } = await import("capacitor-tcp-socket");
    const zaklad = await zjistiPodsit();
    if (!zaklad) return [];
    const found: { name: string; address: string }[] = [];
    // Zkus běžné rozsahy .1–.254 paralelně po dávkách (port 9100 otevřený = tiskárna).
    const tryIp = async (ip: string) => {
      try {
        const res = await Promise.race([
          TcpSocket.connect({ ipAddress: ip, port: 9100 }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("t")), timeoutMs)),
        ]) as { client: number };
        try { await TcpSocket.disconnect({ client: res.client }); } catch {}
        found.push({ name: `Tiskárna ${ip}`, address: ip });
      } catch { /* port zavřený / není tiskárna */ }
    };
    // dávky po 32, ať to nezahltí síť
    for (let start = 1; start <= 254; start += 32) {
      const batch = [];
      for (let i = start; i < start + 32 && i <= 254; i++) batch.push(tryIp(`${zaklad}.${i}`));
      await Promise.all(batch);
    }
    return found;
  } catch {
    return [];
  }
}

// Základ lokální podsítě pro discovery. Bez nativního pluginu na zjištění IP
// telefonu zkoušíme nejběžnější domácí/firemní podsíť. Když tiskárna leží jinde,
// uživatel zadá IP ručně (spolehlivá cesta).
async function zjistiPodsit(): Promise<string | null> {
  return "192.168.1";
}

// ══════════════════════════════════════════════════════════════════════════
// 3) PDF / A4 — systémový tisk (jakákoli tiskárna přes tiskový dialog OS)
// ══════════════════════════════════════════════════════════════════════════

// Vygeneruje HTML účtenky (A4, s diakritikou) a otevře systémový tisk.
// Funguje i pro WiFi/USB tiskárny, které OS zná. Účtenka je na papír A4.
async function tiskPdf(data: UctenkaData): Promise<TiskVysledek> {
  try {
    const radkyHtml = data.radky.map((r) => {
      const soucet = (r.cena * r.mnozstvi).toFixed(2);
      return `<tr><td>${escapeHtml(r.nazev)}</td><td style="text-align:right">${r.mnozstvi}× ${r.cena.toFixed(2)} Kč</td><td style="text-align:right">${soucet} Kč</td></tr>`;
    }).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111}
      h1{font-size:20px;text-align:center;margin:0 0 4px}
      .meta{text-align:center;color:#555;font-size:12px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse;font-size:14px}
      td{padding:4px 0;border-bottom:1px solid #eee}
      .celkem{font-size:18px;font-weight:800;text-align:right;margin-top:12px}
      .paticka{text-align:center;color:#555;margin-top:20px;font-size:13px}
    </style></head><body>
      <h1>${escapeHtml(data.nazevFirmy || "Účtenka")}</h1>
      ${data.vraceno ? `<div style="text-align:center;font-weight:800;color:#C0392B;margin-bottom:8px">DOKLAD O VRÁCENÍ</div>` : ""}
      <div class="meta">
        ${data.firma.adresa ? escapeHtml(data.firma.adresa) + "<br>" : ""}
        ${data.firma.ico ? "IČO: " + escapeHtml(data.firma.ico) + " " : ""}
        ${data.firma.dic ? "DIČ: " + escapeHtml(data.firma.dic) : ""}<br>
        ${data.cislo ? `<b>Účtenka č. ${escapeHtml(data.cislo)}</b><br>` : ""}
        ${datumText(data.datum)}
      </div>
      <table>${radkyHtml}</table>
      <div class="celkem">Celkem: ${data.celkem.toFixed(2)} Kč</div>
      ${data.platba ? `<div style="text-align:right;color:#555">Platba: ${data.platba === "karta" ? "Kartou" : "Hotově"}</div>` : ""}
      <div class="paticka">${escapeHtml(data.firma.patickaUctenky || "Děkujeme za nákup!")}</div>
    </body></html>`;

    // Otevři v novém okně a spusť systémový tisk.
    const w = window.open("", "_blank");
    if (!w) return { ok: false, duvod: "error", zprava: "popup blokován" };
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch {} }, 300);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, duvod: "error", zprava: String(e?.message || e || "") };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ══════════════════════════════════════════════════════════════════════════
// Veřejné API — jeden vstup, podle typu tiskárny
// ══════════════════════════════════════════════════════════════════════════

// target = pro BT adresa, pro WiFi IP (volitelně ip:port), pro PDF ignorováno.
export async function tiskUctenky(
  data: UctenkaData,
  typ: TiskarnaTyp,
  target?: string,
): Promise<TiskVysledek> {
  // PDF jde i na webu (přes okno), ostatní jen nativně.
  if (typ !== "pdf" && !Capacitor.isNativePlatform()) return { ok: false, duvod: "not-native" };

  if (typ === "bluetooth") return tiskBluetooth(data, target ?? "");
  if (typ === "wifi") {
    const [ip, portStr] = (target ?? "").split(":");
    return tiskWifi(data, ip, portStr ? parseInt(portStr, 10) : 9100);
  }
  return tiskPdf(data);
}
