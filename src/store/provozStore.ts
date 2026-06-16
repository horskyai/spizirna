import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InventuraKategorie =
  | "potraviny"
  | "napoje-nealkohol"
  | "alkohol"
  | "maso-ryby"
  | "mlecne"
  | "ovoce-zelenina"
  | "suche-zbozi"
  | "ostatni";

export const INVENTURA_KATEGORIE: { id: InventuraKategorie; label: string; emoji: string }[] = [
  { id: "potraviny", label: "Potraviny", emoji: "🥫" },
  { id: "maso-ryby", label: "Maso & ryby", emoji: "🥩" },
  { id: "mlecne", label: "Mléčné", emoji: "🧀" },
  { id: "ovoce-zelenina", label: "Ovoce & zelenina", emoji: "🥦" },
  { id: "suche-zbozi", label: "Suché zboží", emoji: "🌾" },
  { id: "napoje-nealkohol", label: "Nápoje", emoji: "🥤" },
  { id: "alkohol", label: "Alkohol", emoji: "🍷" },
  { id: "ostatni", label: "Ostatní", emoji: "📦" },
];

export interface InventuraPolozka {
  id: string;
  nazev: string;
  kategorie: InventuraKategorie;
  jednotka: string;
  minZasoba: number; // minimální zásoba — pod tím upozornit
  cenaJednotka?: number; // cena za jednotku pro výpočet hodnoty skladu
  dodavatel?: string;
  minTrvanlivost?: string; // YYYY-MM-DD
  fotoUrl?: string; // fotka položky (data URL z galerie/foťáku)
}

export interface InventuraZaznam {
  id: string;
  polozkaId: string;
  datum: string; // ISO date YYYY-MM-DD
  skutecnyStav: number;
  ocekavanyStav?: number; // co systém čekal
  poznamka?: string;
}

export interface Inventura {
  id: string;
  nazev: string;
  datum: string;
  zavrena: boolean;
  zaznamy: InventuraZaznam[];
}

export interface Dodavatel {
  id: string;
  nazev: string;
  telefon?: string;
  email?: string;
  poznamka?: string;
}

interface ProvozStore {
  polozky: InventuraPolozka[];
  inventury: Inventura[];
  dodavatele: Dodavatel[];
  aktivniInventuraId: string | null;

  // Položky skladu
  addPolozka: (p: Omit<InventuraPolozka, "id">) => void;
  updatePolozka: (id: string, changes: Partial<InventuraPolozka>) => void;
  removePolozka: (id: string) => void;

  // Inventury
  vytvorInventuru: (nazev: string) => string;
  zavritInventuru: (id: string) => void;
  setAktivniInventura: (id: string | null) => void;
  zadatZaznam: (inventuraId: string, polozkaId: string, skutecnyStav: number, poznamka?: string) => void;
  removeInventura: (id: string) => void;

  // Dodavatelé
  addDodavatel: (d: Omit<Dodavatel, "id">) => void;
  removeDodavatel: (id: string) => void;

  // Výpočty
  getPolozkyCritical: () => InventuraPolozka[];
  getHodnotaSkladu: (inventuraId: string) => number;
  getDifference: (inventuraId: string, polozkaId: string) => number | null;
}

export const useProvozStore = create<ProvozStore>()(
  persist(
    (set, get) => ({
      polozky: [],
      inventury: [],
      dodavatele: [],
      aktivniInventuraId: null,

      addPolozka: (p) =>
        set((s) => ({ polozky: [...s.polozky, { ...p, id: crypto.randomUUID() }] })),

      updatePolozka: (id, changes) =>
        set((s) => ({ polozky: s.polozky.map((p) => p.id === id ? { ...p, ...changes } : p) })),

      removePolozka: (id) =>
        set((s) => ({ polozky: s.polozky.filter((p) => p.id !== id) })),

      vytvorInventuru: (nazev) => {
        const id = crypto.randomUUID();
        const datum = new Date().toISOString().slice(0, 10);
        set((s) => ({
          inventury: [
            { id, nazev, datum, zavrena: false, zaznamy: [] },
            ...s.inventury,
          ],
          aktivniInventuraId: id,
        }));
        return id;
      },

      zavritInventuru: (id) =>
        set((s) => ({
          inventury: s.inventury.map((i) => i.id === id ? { ...i, zavrena: true } : i),
          aktivniInventuraId: s.aktivniInventuraId === id ? null : s.aktivniInventuraId,
        })),

      setAktivniInventura: (id) => set({ aktivniInventuraId: id }),

      zadatZaznam: (inventuraId, polozkaId, skutecnyStav, poznamka) => {
        set((s) => ({
          inventury: s.inventury.map((inv) => {
            if (inv.id !== inventuraId) return inv;
            const existing = inv.zaznamy.findIndex((z) => z.polozkaId === polozkaId);
            const zaznam: InventuraZaznam = {
              id: crypto.randomUUID(),
              polozkaId,
              datum: new Date().toISOString().slice(0, 10),
              skutecnyStav,
              poznamka,
            };
            const zaznamy = existing >= 0
              ? inv.zaznamy.map((z, i) => i === existing ? zaznam : z)
              : [...inv.zaznamy, zaznam];
            return { ...inv, zaznamy };
          }),
        }));
      },

      removeInventura: (id) =>
        set((s) => ({
          inventury: s.inventury.filter((i) => i.id !== id),
          aktivniInventuraId: s.aktivniInventuraId === id ? null : s.aktivniInventuraId,
        })),

      addDodavatel: (d) =>
        set((s) => ({ dodavatele: [...s.dodavatele, { ...d, id: crypto.randomUUID() }] })),

      removeDodavatel: (id) =>
        set((s) => ({ dodavatele: s.dodavatele.filter((d) => d.id !== id) })),

      getPolozkyCritical: () => {
        const { polozky, inventury } = get();
        // Najít poslední zaznamenaný stav každé položky
        const latestByPolozka: Record<string, number> = {};
        inventury.forEach((inv) => {
          inv.zaznamy.forEach((z) => {
            if (latestByPolozka[z.polozkaId] === undefined || z.datum > (inv.datum)) {
              latestByPolozka[z.polozkaId] = z.skutecnyStav;
            }
          });
        });
        return polozky.filter((p) => {
          const stav = latestByPolozka[p.id];
          return stav !== undefined && stav <= p.minZasoba;
        });
      },

      getHodnotaSkladu: (inventuraId) => {
        const { polozky, inventury } = get();
        const inv = inventury.find((i) => i.id === inventuraId);
        if (!inv) return 0;
        return inv.zaznamy.reduce((sum, z) => {
          const polozka = polozky.find((p) => p.id === z.polozkaId);
          if (!polozka?.cenaJednotka) return sum;
          return sum + z.skutecnyStav * polozka.cenaJednotka;
        }, 0);
      },

      getDifference: (inventuraId, polozkaId) => {
        const { inventury } = get();
        const inv = inventury.find((i) => i.id === inventuraId);
        if (!inv) return null;
        const zaznam = inv.zaznamy.find((z) => z.polozkaId === polozkaId);
        if (!zaznam || zaznam.ocekavanyStav === undefined) return null;
        return zaznam.skutecnyStav - zaznam.ocekavanyStav;
      },
    }),
    { name: "provoz-store" }
  )
);
