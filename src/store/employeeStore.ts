import { create } from "zustand";
import { persist } from "zustand/middleware";

// Režim zaměstnance (jen provoz) — jednoduchý PIN-zámek na JEDNOM zařízení.
// Když je zapnutý a zamčený, zaměstnanec vidí jen Kasu; majitel odemkne PINem
// plný přístup (sklad, ceny, účetnictví, nastavení). Reset po zamčení.
//
// POZOR — úroveň ochrany: je to „poctivostní" zámek na jednom zařízení (data
// jsou lokální), NE serverové oprávnění. Chrání proti běžnému nahlížení/omylu
// zaměstnance, ne proti cílenému obcházení. Skutečné role až s cloudem (Play fáze).
interface EmployeeStore {
  enabled: boolean;      // majitel zapnul ochranu
  pin: string;           // 4+ místný PIN majitele
  locked: boolean;       // true = právě běží režim zaměstnance (omezený)
  enable: (pin: string) => void;   // zapne ochranu, nastaví PIN, rovnou zamkne
  disable: () => void;             // vypne ochranu úplně
  changePin: (pin: string) => void;
  lock: () => void;                // přepni do režimu zaměstnance
  unlock: (pin: string) => boolean; // zkus PIN → true když sedí (odemkne)
}

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    (set, get) => ({
      enabled: false,
      pin: "",
      locked: false,
      enable: (pin) => set({ enabled: true, pin, locked: true }),
      disable: () => set({ enabled: false, pin: "", locked: false }),
      changePin: (pin) => set({ pin }),
      lock: () => { if (get().enabled) set({ locked: true }); },
      unlock: (pin) => {
        if (pin === get().pin) { set({ locked: false }); return true; }
        return false;
      },
    }),
    { name: "employee-mode" },
  ),
);

// Pomocník: je právě aktivní omezený režim zaměstnance? (zapnuto A zamčeno)
export function jeZamestnanecRezim(): boolean {
  const s = useEmployeeStore.getState();
  return s.enabled && s.locked;
}
