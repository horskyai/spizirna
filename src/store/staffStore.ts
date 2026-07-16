import { create } from "zustand";
import { persist } from "zustand/middleware";

// Zaměstnanci provozovny — lokální seznam (jméno + PIN) a kdo je právě
// přihlášený na směnu. Slouží k ODPOVĚDNOSTI: jméno obsluhy se zapíše ke každé
// účtence i ke každému stornu/vrácení. Majitel vidí, kdo co udělal.
//
// POZOR — úroveň ochrany: lokální na jednom zařízení (poctivostní), ne
// serverové role. Skutečné víceúčtové role až s cloudem (Play fáze). Přesto
// dává reálnou stopu „kdo markoval / kdo stornoval" v běžném provozu.
export interface Zamestnanec {
  id: string;
  jmeno: string;
  pin: string;        // 4+ místný, pro přihlášení na směnu
  jeMajitel?: boolean; // majitel smí do nastavení, cen, storna bez omezení
}

interface StaffStore {
  zamestnanci: Zamestnanec[];
  aktivniId: string | null; // kdo je přihlášený na směnu (null = nikdo)

  pridej: (jmeno: string, pin: string, jeMajitel?: boolean) => void;
  uprav: (id: string, changes: Partial<Omit<Zamestnanec, "id">>) => void;
  smaz: (id: string) => void;
  prihlas: (id: string, pin: string) => boolean; // přihlásí na směnu když PIN sedí
  odhlas: () => void;

  // Jméno aktuálně přihlášeného (pro zápis k dokladu). "" když nikdo/žádní.
  aktivniJmeno: () => string;
}

export const useStaffStore = create<StaffStore>()(
  persist(
    (set, get) => ({
      zamestnanci: [],
      aktivniId: null,

      pridej: (jmeno, pin, jeMajitel) =>
        set((s) => ({
          zamestnanci: [...s.zamestnanci, { id: crypto.randomUUID(), jmeno: jmeno.trim(), pin, jeMajitel }],
        })),

      uprav: (id, changes) =>
        set((s) => ({ zamestnanci: s.zamestnanci.map((z) => (z.id === id ? { ...z, ...changes } : z)) })),

      smaz: (id) =>
        set((s) => ({
          zamestnanci: s.zamestnanci.filter((z) => z.id !== id),
          aktivniId: s.aktivniId === id ? null : s.aktivniId,
        })),

      prihlas: (id, pin) => {
        const z = get().zamestnanci.find((x) => x.id === id);
        if (z && z.pin === pin) { set({ aktivniId: id }); return true; }
        return false;
      },

      odhlas: () => set({ aktivniId: null }),

      aktivniJmeno: () => {
        const { zamestnanci, aktivniId } = get();
        return zamestnanci.find((z) => z.id === aktivniId)?.jmeno ?? "";
      },
    }),
    { name: "staff-store" },
  ),
);

// React hook — jméno aktuálně přihlášené obsluhy (reaktivní).
export function useAktivniJmeno(): string {
  return useStaffStore((s) => s.zamestnanci.find((z) => z.id === s.aktivniId)?.jmeno ?? "");
}
