import { create } from "zustand";
import { persist } from "zustand/middleware";

// Preference chytrých upozornění — každý TYP jde zapnout/vypnout zvlášť.
// Default: vše zapnuté. Ukládá se lokálně (per zařízení).
//
// Přidání nového typu: přidej klíč sem do NotifType + popisek do NOTIF_META
// a obal jeho notifikaci v page.tsx přes isNotifEnabled(klíč).

export type NotifType =
  // Domácnost
  | "expirace"
  | "dochazi"
  | "coUvarit"
  | "prazdnaSpizirna"
  | "tipVyuziti"
  | "stradka"
  | "plytvaniTyden"
  // Provoz
  | "provozRannePriprava"
  | "provozSouhrn"
  | "provozUzaverka";

interface NotifPrefsStore {
  // true/false per typ; chybějící klíč = zapnuto (default).
  prefs: Partial<Record<NotifType, boolean>>;
  isEnabled: (t: NotifType) => boolean;
  setEnabled: (t: NotifType, on: boolean) => void;
}

export const useNotifPrefsStore = create<NotifPrefsStore>()(
  persist(
    (set, get) => ({
      prefs: {},
      isEnabled: (t) => get().prefs[t] !== false, // default zapnuto
      setEnabled: (t, on) => set((s) => ({ prefs: { ...s.prefs, [t]: on } })),
    }),
    { name: "notif-prefs" },
  ),
);

// Pomocník pro použití mimo React (v plánovači notifikací).
export function isNotifEnabled(t: NotifType): boolean {
  return useNotifPrefsStore.getState().isEnabled(t);
}

// Popisky pro Nastavení (CZ + SK), seskupené podle režimu.
export const NOTIF_META: {
  domacnost: { key: NotifType; cs: string; sk: string }[];
  provoz: { key: NotifType; cs: string; sk: string }[];
} = {
  domacnost: [
    { key: "expirace", cs: "Blížící se spotřeba", sk: "Blížiaca sa spotreba" },
    { key: "dochazi", cs: "Dochází / čas koupit", sk: "Dochádza / čas kúpiť" },
    { key: "coUvarit", cs: "Co dnes uvařit", sk: "Čo dnes uvariť" },
    { key: "prazdnaSpizirna", cs: "Prázdná spížírna", sk: "Prázdna špajza" },
    { key: "tipVyuziti", cs: "Tip na využití zásob", sk: "Tip na využitie zásob" },
    { key: "stradka", cs: "Série a pochvaly", sk: "Séria a pochvaly" },
    { key: "plytvaniTyden", cs: "Plýtvání za týden", sk: "Plytvanie za týždeň" },
  ],
  provoz: [
    { key: "provozRannePriprava", cs: "Ranní příprava skladu", sk: "Ranná príprava skladu" },
    { key: "provozSouhrn", cs: "Večerní souhrn tržby", sk: "Večerné zhrnutie tržby" },
    { key: "provozUzaverka", cs: "Připomínka uzávěrky", sk: "Pripomienka uzávierky" },
  ],
};
