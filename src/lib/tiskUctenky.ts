// Tisk účtenky na Bluetooth termotiskárnu (ESC/POS) — BETA.
// Jen v nativní appce (Capacitor plugin). Web tisk nepodporuje.
//
// ⚠️ BETA: naprogramováno podle standardu ESC/POS, ale zatím neověřeno na
// reálné tiskárně — chování se může u konkrétních modelů lišit. Až bude
// kamarádka mít konkrétní tiskárnu, doladí se podle ní.

import { Capacitor } from "@capacitor/core";

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
}

export type TiskVysledek =
  | { ok: true }
  | { ok: false; duvod: "not-native" | "no-printer" | "error"; zprava?: string };

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

// Vytiskne účtenku na tiskárnu s danou BT adresou.
export async function tiskUctenky(data: UctenkaData, printerAddress: string): Promise<TiskVysledek> {
  if (!Capacitor.isNativePlatform()) return { ok: false, duvod: "not-native" };
  if (!printerAddress) return { ok: false, duvod: "no-printer" };

  try {
    const { CapacitorThermalPrinter } = await import("capacitor-thermal-printer");

    await CapacitorThermalPrinter.connect({ address: printerAddress });

    // Datum/čas hezky
    const d = new Date(data.datum);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const cas = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const datumStr = `${dd}.${mm}.${d.getFullYear()} ${cas}`;

    const cara = "--------------------------------";
    const kc = (n: number) => `${n.toFixed(2)} Kc`; // ESC/POS = ASCII, bez diakritiky

    // Fluent ESC/POS příkazy
    let p = CapacitorThermalPrinter.begin();

    // Hlavička — název firmy velký, na střed
    p = p.align("center").bold(true).text(`${data.nazevFirmy || "Uctenka"}\n`).bold(false);
    if (data.firma.adresa) p = p.text(`${data.firma.adresa}\n`);
    if (data.firma.ico) p = p.text(`ICO: ${data.firma.ico}\n`);
    if (data.firma.dic) p = p.text(`DIC: ${data.firma.dic}\n`);
    if (data.firma.telefon) p = p.text(`Tel: ${data.firma.telefon}\n`);

    p = p.align("left").text(`${cara}\n`);
    p = p.text(`${datumStr}\n`);
    p = p.text(`${cara}\n`);

    // Položky: název, pod ním "mn x cena = celkem"
    for (const r of data.radky) {
      const soucet = r.cena * r.mnozstvi;
      p = p.text(`${r.nazev}\n`);
      p = p.align("right").text(`${r.mnozstvi} x ${kc(r.cena)} = ${kc(soucet)}\n`).align("left");
    }

    p = p.text(`${cara}\n`);
    p = p.align("right").bold(true).text(`CELKEM: ${kc(data.celkem)}\n`).bold(false).align("left");
    if (data.platba) p = p.text(`Platba: ${data.platba === "karta" ? "Kartou" : "Hotove"}\n`);

    // Patička
    p = p.align("center").text(`\n${data.firma.patickaUctenky || "Dekujeme za nakup!"}\n`);

    // Odřízni papír
    p = p.feedCutPaper();

    await p.write();
    try { await CapacitorThermalPrinter.disconnect(); } catch {}

    return { ok: true };
  } catch (e: any) {
    return { ok: false, duvod: "error", zprava: String(e?.message || e || "") };
  }
}
