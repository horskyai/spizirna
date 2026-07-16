import { create } from "zustand";
import { persist } from "zustand/middleware";

// Typ provozu — rozhoduje, jak se aplikace v provozním režimu chová:
//   • obchod     → prodej jen kusového zboží ze skladu; recepty/porce skryté
//   • restaurace → jídla (denní porce / recepty) + kusové zboží (nápoje…)
// null = uživatel ještě nevybral → zobrazí se výběrová obrazovka.
export type TypProvozu = "obchod" | "restaurace";

// Formát tištěného dokladu pro zákazníka:
//   • uctenka → úzká účtenka 58/80 mm (Bluetooth ESC/POS tiskárna)
//   • faktura → doklad na A4 (PDF, běžná tiskárna / e-mail)
// Volí se v Nastavení, platí natrvalo, jde kdykoli změnit. Samotný tisk až
// v Capacitor/Play fázi — teď se jen ukládá volba.
export type FormatDokladu = "uctenka" | "faktura";

// Fakturační / identifikační údaje firmy — pro hlavičku účtenky a PDF dokladů.
// Vše volitelné; co uživatel vyplní, to se na doklad vytiskne.
export interface FirmaUdaje {
  ico?: string;
  dic?: string;
  adresa?: string;   // ulice, město, PSČ (volný víceřádkový text)
  telefon?: string;
  email?: string;
  logoUrl?: string;  // data URL loga (z galerie)
  patickaUctenky?: string; // volitelný text dole na účtence (např. „Děkujeme za návštěvu")
  // Plátce DPH? Rozhoduje, co smí být na daňovém dokladu:
  //   • true  → doklad je „zjednodušený daňový doklad": u položek se uvádí sazba
  //             a v souhrnu rozpad DPH (základ + daň); účetnictví ukazuje DPH.
  //   • false → NEplátce: na dokladu ani v účetnictví se DPH neuvádí vůbec
  //             (ze zákona nesmí). Doklad je jen „prodejní účtenka".
  // Default false (neplátce) — bezpečnější, malý provoz DPH obvykle neřeší.
  platceDph?: boolean;
}

// Název provozovny — používá se v provozním režimu pro oslovení v hlavičce
// a upozorněních (místo křestního jména jako u domácnosti).
interface BusinessStore {
  name: string;
  setName: (name: string) => void;
  // Typ provozu (obchod/restaurace). null dokud uživatel nevybere.
  typProvozu: TypProvozu | null;
  setTypProvozu: (typ: TypProvozu) => void;
  // Fakturační údaje firmy (pro účtenku / PDF doklady).
  firma: FirmaUdaje;
  setFirma: (changes: Partial<FirmaUdaje>) => void;
  // Formát dokladu pro zákazníka (úzká účtenka / A4 faktura). Default účtenka.
  formatDokladu: FormatDokladu;
  setFormatDokladu: (f: FormatDokladu) => void;
}

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set) => ({
      name: "",
      setName: (name) => set({ name }),
      typProvozu: null,
      setTypProvozu: (typ) => set({ typProvozu: typ }),
      firma: {},
      setFirma: (changes) => set((s) => ({ firma: { ...s.firma, ...changes } })),
      formatDokladu: "uctenka",
      setFormatDokladu: (f) => set({ formatDokladu: f }),
    }),
    {
      name: "business-name",
      version: 1,
      // Migrace v0→v1: stávající uživatelé (Markétka) už provoz používají —
      // aby nepřišli o recepty/porce, dostanou default "restaurace" (nejbohatší
      // typ). Novým se typProvozu nechá null → uvidí výběrovou obrazovku.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as BusinessStore;
        if (version < 1 && state) {
          // Měli uložený název provozovny = už provoz používali → restaurace.
          // Úplně čerstvý stav (bez názvu) necháme null (vybere si nový uživatel).
          if (state.typProvozu == null && state.name) state.typProvozu = "restaurace";
        }
        return state;
      },
    }
  )
);
