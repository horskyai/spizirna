import { create } from "zustand";
import { persist } from "zustand/middleware";

// Typ provozu — rozhoduje, jak se aplikace v provozním režimu chová:
//   • obchod     → prodej jen kusového zboží ze skladu; recepty/porce skryté
//   • restaurace → jídla (denní porce / recepty) + kusové zboží (nápoje…)
// null = uživatel ještě nevybral → zobrazí se výběrová obrazovka.
export type TypProvozu = "obchod" | "restaurace";

// Název provozovny — používá se v provozním režimu pro oslovení v hlavičce
// a upozorněních (místo křestního jména jako u domácnosti).
interface BusinessStore {
  name: string;
  setName: (name: string) => void;
  // Typ provozu (obchod/restaurace). null dokud uživatel nevybere.
  typProvozu: TypProvozu | null;
  setTypProvozu: (typ: TypProvozu) => void;
}

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set) => ({
      name: "",
      setName: (name) => set({ name }),
      typProvozu: null,
      setTypProvozu: (typ) => set({ typProvozu: typ }),
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
