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
  aktualniStav: number; // ŽIVÉ množství na skladě — nákup zvyšuje, odpis/vaření snižuje, inventura koriguje
  minZasoba: number; // minimální zásoba — pod tím upozornit
  cenaJednotka?: number; // cena za jednotku pro výpočet hodnoty skladu
  dodavatelId?: string; // reference na Dodavatel.id (číselník)
  dodavatel?: string; // ZASTARALÉ: volný text dodavatele (migrace → dodavatelId)
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
  slepa?: boolean; // slepá inventura — zaměstnanec nevidí očekávaný stav
  zaznamy: InventuraZaznam[];
}

// Odpis (waste) — vyhozená/znehodnocená položka. Daňový doklad i statistika plýtvání.
export type OdpisDuvod = "expirace" | "zkazeni" | "rozbiti" | "jine";

export interface Odpis {
  id: string;
  polozkaId: string;
  nazev: string;        // název v době odpisu (kdyby se položka pak smazala)
  mnozstvi: number;
  jednotka: string;
  duvod: OdpisDuvod;
  cenaJednotka?: number; // pro vyčíslení hodnoty
  datum: string;         // ISO date
  poznamka?: string;
}

export interface Dodavatel {
  id: string;
  nazev: string;
  telefon?: string;
  email?: string;
  poznamka?: string;
}

// Rozdílová sestava — souhrn mank a přebytků inventury.
export interface RozdilSestava {
  manka: number;        // |záporné rozdíly| v Kč
  prebytky: number;     // kladné rozdíly v Kč
  bilance: number;      // přebytky - manka (čistý rozdíl v Kč)
  pocetRozdilu: number; // kolik položek se liší
}

interface ProvozStore {
  polozky: InventuraPolozka[];
  inventury: Inventura[];
  dodavatele: Dodavatel[];
  odpisy: Odpis[];
  aktivniInventuraId: string | null;

  // Položky skladu (aktualniStav volitelný — default 0)
  addPolozka: (p: Omit<InventuraPolozka, "id" | "aktualniStav"> & { aktualniStav?: number }) => void;
  updatePolozka: (id: string, changes: Partial<InventuraPolozka>) => void;
  removePolozka: (id: string) => void;

  // Pohyby skladu (živý stav). prijemNaSklad přijme zboží (nákup) — pokud
  // položka s daným názvem neexistuje, založí ji. odeberZeSkladu odečte
  // (vaření/spotřeba) a stav neklesne pod 0.
  prijemNaSklad: (nazev: string, mnozstvi: number, jednotka: string, cenaJednotka?: number) => void;
  odeberZeSkladu: (polozkaId: string, mnozstvi: number) => void;

  // Inventury
  vytvorInventuru: (nazev: string, slepa?: boolean) => string;
  zavritInventuru: (id: string) => void;
  setAktivniInventura: (id: string | null) => void;
  zadatZaznam: (inventuraId: string, polozkaId: string, skutecnyStav: number, poznamka?: string) => void;
  removeInventura: (id: string) => void;

  // Dodavatelé
  addDodavatel: (d: Omit<Dodavatel, "id">) => void;
  removeDodavatel: (id: string) => void;

  // Odpisy (waste)
  addOdpis: (o: Omit<Odpis, "id" | "datum">) => void;
  removeOdpis: (id: string) => void;

  // Výpočty
  getPolozkyCritical: () => InventuraPolozka[];
  getHodnotaSkladu: (inventuraId: string) => number; // historická hodnota dle inventury
  getHodnotaSkladuAktualni: () => number; // živá hodnota skladu (z aktualniStav)
  getDifference: (inventuraId: string, polozkaId: string) => number | null;
  getLastKnownStav: (polozkaId: string, beforeInventuraId?: string) => number | undefined;
  getRozdilSestava: (inventuraId: string) => RozdilSestava;
}

export const useProvozStore = create<ProvozStore>()(
  persist(
    (set, get) => ({
      polozky: [],
      inventury: [],
      dodavatele: [],
      odpisy: [],
      aktivniInventuraId: null,

      addPolozka: (p) =>
        set((s) => ({ polozky: [...s.polozky, { ...p, aktualniStav: p.aktualniStav ?? 0, id: crypto.randomUUID() }] })),

      updatePolozka: (id, changes) =>
        set((s) => ({ polozky: s.polozky.map((p) => p.id === id ? { ...p, ...changes } : p) })),

      removePolozka: (id) =>
        set((s) => ({ polozky: s.polozky.filter((p) => p.id !== id) })),

      prijemNaSklad: (nazev, mnozstvi, jednotka, cenaJednotka) =>
        set((s) => {
          // Spáruj podle názvu (case-insensitive). Existuje → přičti, jinak založ.
          const idx = s.polozky.findIndex((p) => p.nazev.toLowerCase().trim() === nazev.toLowerCase().trim());
          if (idx >= 0) {
            return {
              polozky: s.polozky.map((p, i) =>
                i === idx
                  ? { ...p, aktualniStav: p.aktualniStav + mnozstvi, ...(cenaJednotka != null && p.cenaJednotka == null ? { cenaJednotka } : {}) }
                  : p,
              ),
            };
          }
          return {
            polozky: [...s.polozky, {
              id: crypto.randomUUID(),
              nazev: nazev.trim(),
              kategorie: "ostatni" as InventuraKategorie,
              jednotka,
              aktualniStav: mnozstvi,
              minZasoba: 0,
              ...(cenaJednotka != null ? { cenaJednotka } : {}),
            }],
          };
        }),

      odeberZeSkladu: (polozkaId, mnozstvi) =>
        set((s) => ({
          polozky: s.polozky.map((p) =>
            p.id === polozkaId ? { ...p, aktualniStav: Math.max(0, p.aktualniStav - mnozstvi) } : p,
          ),
        })),

      vytvorInventuru: (nazev, slepa = false) => {
        const id = crypto.randomUUID();
        const datum = new Date().toISOString().slice(0, 10);
        set((s) => ({
          inventury: [
            { id, nazev, datum, zavrena: false, slepa, zaznamy: [] },
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
        // Očekávaný stav = poslední známý stav z předchozích inventur. Spočítá
        // se jednou při prvním zadání a dál se zachová (rozdíl pak dává smysl).
        const ocekavany = get().getLastKnownStav(polozkaId, inventuraId);
        set((s) => ({
          inventury: s.inventury.map((inv) => {
            if (inv.id !== inventuraId) return inv;
            const existing = inv.zaznamy.findIndex((z) => z.polozkaId === polozkaId);
            const zaznam: InventuraZaznam = {
              id: existing >= 0 ? inv.zaznamy[existing].id : crypto.randomUUID(),
              polozkaId,
              datum: new Date().toISOString().slice(0, 10),
              skutecnyStav,
              // U přepisu zachovej původní očekávaný stav, jinak ulož spočítaný.
              ocekavanyStav: existing >= 0 ? inv.zaznamy[existing].ocekavanyStav : ocekavany,
              poznamka,
            };
            const zaznamy = existing >= 0
              ? inv.zaznamy.map((z, i) => i === existing ? zaznam : z)
              : [...inv.zaznamy, zaznam];
            return { ...inv, zaznamy };
          }),
          // Inventura koriguje živý stav skladu na napočítanou realitu.
          polozky: s.polozky.map((p) =>
            p.id === polozkaId ? { ...p, aktualniStav: skutecnyStav } : p,
          ),
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

      addOdpis: (o) =>
        set((s) => ({
          odpisy: [
            { ...o, id: crypto.randomUUID(), datum: new Date().toISOString().slice(0, 10) },
            ...s.odpisy,
          ],
          // Odpis snižuje živý stav skladu (vyhozené zboží už na skladě není).
          polozky: s.polozky.map((p) =>
            p.id === o.polozkaId ? { ...p, aktualniStav: Math.max(0, p.aktualniStav - o.mnozstvi) } : p,
          ),
        })),

      removeOdpis: (id) =>
        set((s) => ({ odpisy: s.odpisy.filter((o) => o.id !== id) })),

      getPolozkyCritical: () => {
        // Kritické = živý stav na/pod minimální zásobou (minZasoba > 0).
        const { polozky } = get();
        return polozky.filter((p) => p.minZasoba > 0 && p.aktualniStav <= p.minZasoba);
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

      getHodnotaSkladuAktualni: () => {
        return get().polozky.reduce(
          (sum, p) => sum + (p.cenaJednotka ? p.aktualniStav * p.cenaJednotka : 0),
          0,
        );
      },

      getDifference: (inventuraId, polozkaId) => {
        const { inventury } = get();
        const inv = inventury.find((i) => i.id === inventuraId);
        if (!inv) return null;
        const zaznam = inv.zaznamy.find((z) => z.polozkaId === polozkaId);
        if (!zaznam || zaznam.ocekavanyStav === undefined) return null;
        return zaznam.skutecnyStav - zaznam.ocekavanyStav;
      },

      // Poslední známý stav položky před danou inventurou (z dřívějších inventur).
      // Slouží jako "očekávaný stav" pro rozdílovou sestavu.
      getLastKnownStav: (polozkaId, beforeInventuraId) => {
        const { inventury } = get();
        // Inventury seřaď podle data sestupně; přeskoč tu právě probíhající.
        const sorted = [...inventury].sort((a, b) => b.datum.localeCompare(a.datum));
        for (const inv of sorted) {
          if (inv.id === beforeInventuraId) continue;
          const z = inv.zaznamy.find((z) => z.polozkaId === polozkaId);
          if (z) return z.skutecnyStav;
        }
        return undefined;
      },

      getRozdilSestava: (inventuraId) => {
        const { inventury, polozky } = get();
        const inv = inventury.find((i) => i.id === inventuraId);
        const empty: RozdilSestava = { manka: 0, prebytky: 0, bilance: 0, pocetRozdilu: 0 };
        if (!inv) return empty;
        let manka = 0, prebytky = 0, pocet = 0;
        inv.zaznamy.forEach((z) => {
          if (z.ocekavanyStav === undefined) return;
          const rozdilKs = z.skutecnyStav - z.ocekavanyStav;
          if (rozdilKs === 0) return;
          pocet++;
          const cena = polozky.find((p) => p.id === z.polozkaId)?.cenaJednotka ?? 0;
          const rozdilKc = rozdilKs * cena;
          if (rozdilKc < 0) manka += Math.abs(rozdilKc);
          else prebytky += rozdilKc;
        });
        return { manka, prebytky, bilance: prebytky - manka, pocetRozdilu: pocet };
      },
    }),
    {
      name: "provoz-store",
      version: 1,
      // Migrace v0→v1: starým položkám bez `aktualniStav` ho dopočítáme
      // z posledního zaznamenaného stavu v inventurách (jinak 0), a volný
      // text `dodavatel` necháme — spárování na dodavatelId řeší UI volitelně.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as ProvozStore;
        if (version < 1 && state?.polozky) {
          const lastStav: Record<string, { stav: number; datum: string }> = {};
          (state.inventury ?? []).forEach((inv) => {
            inv.zaznamy.forEach((z) => {
              const cur = lastStav[z.polozkaId];
              if (!cur || z.datum >= cur.datum) lastStav[z.polozkaId] = { stav: z.skutecnyStav, datum: z.datum };
            });
          });
          state.polozky = state.polozky.map((p) => ({
            ...p,
            aktualniStav: p.aktualniStav ?? lastStav[p.id]?.stav ?? 0,
          }));
        }
        return state;
      },
    }
  )
);
