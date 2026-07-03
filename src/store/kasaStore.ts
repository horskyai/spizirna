import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useProvozStore } from "@/store/provozStore";
import { useRecipeStore } from "@/store/recipeStore";

// ── Kasa (pokladna / POS) ──────────────────────────────────────────────────────
// Prodej v provozovně, který AUTOMATICKY odečítá ze skladu — obsluha už nemusí
// každý den ručně odepisovat, co se prodalo. Sklad tak zůstává živý a inventura
// (v provozStore) jen porovná realitu s tím, co systém napočítal.
//
// MenuPolozka = to, co si zákazník objedná / koupí (guláš, bramboračka, Pepsi).
// Do skladu se promítne dvěma způsoby:
//   • sklad   → přímá vazba na 1 skladovou položku (Pepsi = −1 ks Pepsi)
//   • recept  → rozpustí ingredience receptu na daný počet porcí (guláš →
//               −maso, −cibule … podle receptu, přepočteno na 1 porci)

export type MenuVazbaTyp = "sklad" | "recept" | "zadna";

export interface MenuPolozka {
  id: string;
  nazev: string;
  cena: number;            // prodejní cena za 1 kus / porci (Kč)
  kategorie?: string;      // volitelné seskupení dlaždic (Jídla, Nápoje…)
  dphSazba?: number;       // sazba DPH v % (21 | 12 | 0). Default 21.
  plu?: string;            // krátký kód pro rychlé namarkování na numpadu
  fotoUrl?: string;        // fotka pro dlaždici (data URL)
  vazbaTyp: MenuVazbaTyp;
  // vazba "sklad": odečte se `odbet` jednotek této skladové položky za 1 prodej
  polozkaId?: string;
  odbet?: number;          // kolik jednotek skladu ubere 1 prodej (default 1)
  // vazba "recept": rozpustí ingredience receptu na 1 porci
  receptId?: string;
  aktivni?: boolean;       // false = dočasně skryté z pultu (default true)
}

// Prodejní řádek pochází z jednoho ze dvou zdrojů dlaždic:
//   • menuId    → položka nabídky kasy (restaurace: recept/porce, nebo ruční)
//   • polozkaId → přímo skladová položka (obchod: Pepsi ze skladu se prodává 1:1)
export interface ProdejkaRadek {
  menuId?: string;
  polozkaId?: string;
  nazev: string;           // název v době prodeje (kdyby se pak změnil)
  mnozstvi: number;
  cena: number;            // PRODEJNÍ cena za kus v době prodeje (s DPH)
  nakup?: number;          // nákupní cena za kus v době prodeje (pro výpočet zisku/marže)
  dphSazba?: number;       // sazba DPH v % v době prodeje (snapshot; default 21)
}

export type ZpusobPlatby = "hotovost" | "karta";

export interface Prodejka {
  id: string;
  datum: string;           // ISO datetime prodeje
  radky: ProdejkaRadek[];
  celkem: number;          // celková částka účtenky (Kč, s DPH)
  platba?: ZpusobPlatby;   // hotovost / karta (pro uzávěrku); default hotovost
}

export interface CartItem {
  menuId?: string;    // dlaždice z nabídky kasy
  polozkaId?: string; // dlaždice přímo ze skladu
  volnaCena?: number; // volná položka z numpadu (nemá vazbu na sklad)
  volnaNazev?: string;
  mnozstvi: number;
}

// Rozpad DPH pro jednu sazbu. Ceny v kase jsou VČETNĚ DPH → z celkové (brutto)
// se dopočítá základ (netto) a daň: dan = brutto − brutto/(1+sazba/100).
export interface DphRadek {
  sazba: number;   // %
  zaklad: number;  // netto (bez DPH)
  dan: number;     // částka DPH
  brutto: number;  // s DPH
}

// Účetní souhrn za období — uzávěrka, DPH rozpad, zisk/marže, platby.
export interface UcetniSouhrn {
  trzba: number;          // celkem s DPH
  pocetUctenek: number;
  hotovost: number;
  karta: number;
  nakup: number;          // nákupní hodnota prodaného zboží (kde známe nákupní cenu)
  zisk: number;           // trzba(netto pokud plátce? — zde brutto − nakup) viz níže
  marzeProcent: number;   // zisk / trzba × 100
  dph: DphRadek[];        // rozpad podle sazeb
  dphCelkem: number;      // suma DPH
  topProdukty: { nazev: string; mnozstvi: number; trzba: number }[]; // nejprodávanější
}

interface KasaStore {
  menu: MenuPolozka[];
  prodejky: Prodejka[];

  // Správa menu
  addMenuPolozka: (p: Omit<MenuPolozka, "id">) => void;
  updateMenuPolozka: (id: string, changes: Partial<MenuPolozka>) => void;
  removeMenuPolozka: (id: string) => void;

  // Prodej — zapíše účtenku a AUTOMATICKY odečte ze skladu (provozStore).
  // Vrací id nové prodejky, nebo null když je košík prázdný.
  prodat: (cart: CartItem[], platba?: ZpusobPlatby) => string | null;
  stornoProdejka: (id: string) => void; // smaže účtenku a vrátí zboží na sklad

  // Výpočty
  getTrzbaDne: (isoDate: string) => number;      // tržba za daný den (YYYY-MM-DD)
  getPocetProdejekDne: (isoDate: string) => number;
  // Účetní souhrn za období [od, do] včetně (YYYY-MM-DD).
  getSouhrn: (odISO: string, doISO: string) => UcetniSouhrn;
}

// Odečte/vrátí danou skladovou položku (podle id). znamenko −1 = prodej (úbytek),
// +1 = storno/vrácení (návrat na sklad).
function pohybSkladu(polozkaId: string, mnozstvi: number, znamenko: 1 | -1) {
  const provoz = useProvozStore.getState();
  if (znamenko < 0) {
    provoz.odeberZeSkladu(polozkaId, mnozstvi);
  } else {
    // Návrat na sklad — přes prijemNaSklad podle názvu (čitelnější než záporný odečet).
    const p = provoz.polozky.find((x) => x.id === polozkaId);
    if (p) provoz.prijemNaSklad(p.nazev, mnozstvi, p.jednotka, p.cenaJednotka);
  }
}

// Promítne jeden prodejní řádek do skladu. Řádek je buď přímá skladová dlaždice
// (polozkaId), nebo položka nabídky (menuId → sklad/recept/žádná).
// Znaménko: −1 = prodej (úbytek), +1 = storno (návrat na sklad).
function promitniDoSkladu(radek: { menuId?: string; polozkaId?: string }, mnozstvi: number, znamenko: 1 | -1) {
  // 1) Přímá skladová dlaždice (obchod): 1 prodej = 1 jednotka skladu.
  if (radek.polozkaId) {
    pohybSkladu(radek.polozkaId, mnozstvi, znamenko);
    return;
  }

  if (!radek.menuId) return;
  const menuP = useKasaStore.getState().menu.find((m) => m.id === radek.menuId);
  if (!menuP) return;

  // 2) Položka nabídky napojená na skladovou položku (odbet ks/prodej).
  if (menuP.vazbaTyp === "sklad" && menuP.polozkaId) {
    pohybSkladu(menuP.polozkaId, (menuP.odbet ?? 1) * mnozstvi, znamenko);
    return;
  }

  // 3) Položka nabídky = recept (restaurace): rozpusť ingredience na 1 porci.
  if (menuP.vazbaTyp === "recept" && menuP.receptId) {
    const provoz = useProvozStore.getState();
    const recept = useRecipeStore.getState().recipes.find((r) => r.id === menuP.receptId);
    if (!recept) return;
    const porce = recept.servings > 0 ? recept.servings : 1;
    recept.ingredients.forEach((ing) => {
      // Ingredience jsou na celý recept (`servings` porcí) → přepočti na 1 porci.
      const uber = (ing.quantity / porce) * mnozstvi;
      if (uber <= 0) return;
      // Spáruj surovinu na skladovou položku podle názvu (case-insensitive) —
      // stejná logika, jakou používá prijemNaSklad při naskladnění.
      const p = provoz.polozky.find(
        (x) => x.nazev.toLowerCase().trim() === ing.name.toLowerCase().trim(),
      );
      if (!p) return; // surovina není ve skladu evidovaná → přeskoč (voda apod.)
      pohybSkladu(p.id, uber, znamenko);
    });
  }
}

export const useKasaStore = create<KasaStore>()(
  persist(
    (set, get) => ({
      menu: [],
      prodejky: [],

      addMenuPolozka: (p) =>
        set((s) => ({
          menu: [...s.menu, { aktivni: true, odbet: 1, ...p, id: crypto.randomUUID() }],
        })),

      updateMenuPolozka: (id, changes) =>
        set((s) => ({
          menu: s.menu.map((m) => (m.id === id ? { ...m, ...changes } : m)),
        })),

      removeMenuPolozka: (id) =>
        set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),

      prodat: (cart, platba = "hotovost") => {
        const items = cart.filter((c) => c.mnozstvi > 0);
        if (items.length === 0) return null;
        const menu = get().menu;
        const polozky = useProvozStore.getState().polozky;
        const recepty = useRecipeStore.getState().recipes;
        const radky: ProdejkaRadek[] = [];
        items.forEach((c) => {
          if (c.polozkaId) {
            // Přímá skladová dlaždice (obchod).
            const p = polozky.find((x) => x.id === c.polozkaId);
            if (!p) return;
            const cena = p.prodejniCena ?? p.cenaJednotka ?? 0;
            radky.push({ polozkaId: p.id, nazev: p.nazev, mnozstvi: c.mnozstvi, cena, nakup: p.cenaJednotka, dphSazba: p.dphSazba ?? 21 });
          } else if (c.menuId) {
            // Položka nabídky (restaurace).
            const m = menu.find((x) => x.id === c.menuId);
            if (!m) return;
            // Nákupní cena receptu = součet nákupních cen surovin na 1 porci (food cost).
            let nakup: number | undefined;
            if (m.vazbaTyp === "recept" && m.receptId) {
              const r = recepty.find((x) => x.id === m.receptId);
              if (r) {
                const porce = r.servings > 0 ? r.servings : 1;
                nakup = r.ingredients.reduce((sum, ing) => {
                  const sp = polozky.find((x) => x.nazev.toLowerCase().trim() === ing.name.toLowerCase().trim());
                  return sum + (sp?.cenaJednotka ? (ing.quantity / porce) * sp.cenaJednotka : 0);
                }, 0);
              }
            } else if (m.vazbaTyp === "sklad" && m.polozkaId) {
              const sp = polozky.find((x) => x.id === m.polozkaId);
              if (sp?.cenaJednotka != null) nakup = (m.odbet ?? 1) * sp.cenaJednotka;
            }
            radky.push({ menuId: m.id, nazev: m.nazev, mnozstvi: c.mnozstvi, cena: m.cena, nakup, dphSazba: m.dphSazba ?? 21 });
          } else if (c.volnaCena != null) {
            // Volná položka z numpadu — jen tržba, sklad se nedotýká.
            radky.push({ nazev: c.volnaNazev || "—", mnozstvi: c.mnozstvi, cena: c.volnaCena, dphSazba: 21 });
          }
        });
        if (radky.length === 0) return null;
        const celkem = radky.reduce((sum, r) => sum + r.cena * r.mnozstvi, 0);
        const id = crypto.randomUUID();
        set((s) => ({
          prodejky: [
            { id, datum: new Date().toISOString(), radky, celkem, platba },
            ...s.prodejky,
          ],
        }));
        // Automatický odečet ze skladu — jádro celé funkce.
        radky.forEach((r) => promitniDoSkladu(r, r.mnozstvi, -1));
        return id;
      },

      stornoProdejka: (id) => {
        const prodejka = get().prodejky.find((p) => p.id === id);
        if (!prodejka) return;
        // Vrať prodané zboží zpět na sklad, pak smaž účtenku.
        prodejka.radky.forEach((r) => promitniDoSkladu(r, r.mnozstvi, 1));
        set((s) => ({ prodejky: s.prodejky.filter((p) => p.id !== id) }));
      },

      getTrzbaDne: (isoDate) =>
        get()
          .prodejky.filter((p) => p.datum.slice(0, 10) === isoDate)
          .reduce((sum, p) => sum + p.celkem, 0),

      getPocetProdejekDne: (isoDate) =>
        get().prodejky.filter((p) => p.datum.slice(0, 10) === isoDate).length,

      getSouhrn: (odISO, doISO) => {
        // Účtenky v období [od, do] včetně (porovnání přes YYYY-MM-DD prefix).
        const vObdobi = get().prodejky.filter((p) => {
          const d = p.datum.slice(0, 10);
          return d >= odISO && d <= doISO;
        });

        let trzba = 0, hotovost = 0, karta = 0, nakup = 0;
        const dphMap = new Map<number, { zaklad: number; dan: number; brutto: number }>();
        const topMap = new Map<string, { mnozstvi: number; trzba: number }>();

        vObdobi.forEach((p) => {
          trzba += p.celkem;
          if (p.platba === "karta") karta += p.celkem; else hotovost += p.celkem;
          p.radky.forEach((r) => {
            const brutto = r.cena * r.mnozstvi;
            const sazba = r.dphSazba ?? 21;
            // Ceny jsou VČETNĚ DPH → základ = brutto / (1 + sazba/100), daň = brutto − základ.
            const zaklad = brutto / (1 + sazba / 100);
            const dan = brutto - zaklad;
            const cur = dphMap.get(sazba) ?? { zaklad: 0, dan: 0, brutto: 0 };
            cur.zaklad += zaklad; cur.dan += dan; cur.brutto += brutto;
            dphMap.set(sazba, cur);
            if (r.nakup != null) nakup += r.nakup * r.mnozstvi;
            const tm = topMap.get(r.nazev) ?? { mnozstvi: 0, trzba: 0 };
            tm.mnozstvi += r.mnozstvi; tm.trzba += brutto;
            topMap.set(r.nazev, tm);
          });
        });

        const dph: DphRadek[] = [...dphMap.entries()]
          .map(([sazba, v]) => ({ sazba, zaklad: v.zaklad, dan: v.dan, brutto: v.brutto }))
          .sort((a, b) => b.sazba - a.sazba);
        const dphCelkem = dph.reduce((s, d) => s + d.dan, 0);
        const zisk = trzba - nakup;
        const marzeProcent = trzba > 0 ? (zisk / trzba) * 100 : 0;
        const topProdukty = [...topMap.entries()]
          .map(([nazev, v]) => ({ nazev, mnozstvi: v.mnozstvi, trzba: v.trzba }))
          .sort((a, b) => b.trzba - a.trzba)
          .slice(0, 10);

        return {
          trzba, pocetUctenek: vObdobi.length, hotovost, karta,
          nakup, zisk, marzeProcent, dph, dphCelkem, topProdukty,
        };
      },
    }),
    {
      name: "kasa-store",
      version: 1,
    },
  ),
);
