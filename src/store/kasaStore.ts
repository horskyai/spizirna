import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useProvozStore } from "@/store/provozStore";
import { useRecipeStore } from "@/store/recipeStore";
import { useStaffStore } from "@/store/staffStore";

// ── Kasa (pokladna / POS) ──────────────────────────────────────────────────────
// Prodej v provozovně, který AUTOMATICKY odečítá ze skladu — obsluha už nemusí
// každý den ručně odepisovat, co se prodalo. Sklad tak zůstává živý a inventura
// (v provozStore) jen porovná realitu s tím, co systém napočítal.
//
// MenuPolozka = to, co si zákazník objedná / koupí (guláš, bramboračka, Pepsi).
// Do skladu se promítne třemi způsoby:
//   • sklad   → přímá vazba na 1 skladovou položku (Pepsi = −1 ks Pepsi)
//   • recept  → rozpustí ingredience receptu na daný počet porcí (guláš →
//               −maso, −cibule … podle receptu, přepočteno na 1 porci)
//   • porce   → denně navařený počet porcí (restaurace): kuchař ráno zadá
//               navařeno, číšník vidí „zbývá X", prodej ubírá, po dni reset.
//               Sklad surovin se u této vazby NEDOTÝKÁ.

export type MenuVazbaTyp = "sklad" | "recept" | "porce" | "zadna";

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
  // vazba "porce": denní počítadlo navařených porcí
  navareno?: number;       // kolik porcí je dnes navařeno (undefined = neomezeno, jen počítá)
  navarenoDatum?: string;  // YYYY-MM-DD dne, ke kterému navareno/prodano platí
  prodanoDnes?: number;    // kolik porcí se dnes prodalo (reset po dni)
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
  cislo?: string;          // lidský 8místný kód účtenky: RR + 6 číslic pořadí, zobrazí se "26-000042"
  datum: string;           // ISO datetime prodeje
  radky: ProdejkaRadek[];
  celkem: number;          // celková částka účtenky (Kč, s DPH)
  platba?: ZpusobPlatby;   // hotovost / karta (pro uzávěrku); default hotovost
  vraceno?: boolean;       // true = tato účtenka je doklad o vrácení (záporné částky)
  puvodniCislo?: string;   // u dokladu o vrácení: kód původní účtenky, ke které se vrací
  obsluha?: string;        // jméno obsluhy, která doklad vytvořila (odpovědnost za prodej/storno)
  rozpisPlatby?: { hotovost: number; karta: number }; // dělená platba: kolik hotově a kolik kartou
}

// Formátuje 8místný kód pro zobrazení: "26000042" → "26-000042".
export function formatCisloUctenky(cislo: string | undefined): string {
  if (!cislo) return "";
  return cislo.length === 8 ? `${cislo.slice(0, 2)}-${cislo.slice(2)}` : cislo;
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

// Pohyb hotovosti v zásuvce (mimo prodej/vrácení, ty se počítají z účtenek).
// pocatecni = ranní vklad do zásuvky; vklad/vyber = ruční příjem/odvod hotovosti.
export type TypPohybu = "pocatecni" | "vklad" | "vyber";
export interface PohybHotovosti {
  id: string;
  datum: string;       // ISO datetime
  typ: TypPohybu;
  castka: number;      // vždy kladná; význam určuje typ
  poznamka?: string;
}

// Výsledek uzávěrky zásuvky pro daný den — očekávaný vs. napočítaný stav.
export interface StavZasuvky {
  pocatecni: number;   // ranní vklad
  trzbaHotovost: number; // hotovostní tržby dne (z účtenek)
  vraceniHotovost: number; // hotovostní vrácení dne (záporné doklady)
  vklady: number;      // ruční vklady
  vybery: number;      // ruční výběry
  ocekavano: number;   // co MÁ být v zásuvce
}

interface KasaStore {
  menu: MenuPolozka[];
  prodejky: Prodejka[];
  // Provedené denní uzávěrky — den (YYYY-MM-DD) → kdy uzavřeno (ISO).
  // Slouží k notifikaci „včera byl prodej, ale uzávěrka se neudělala".
  uzaverky: Record<string, string>;
  // Pohyby hotovosti v zásuvce (počáteční vklad, ruční vklad/výběr).
  pohybyHotovosti: PohybHotovosti[];

  // Správa menu
  addMenuPolozka: (p: Omit<MenuPolozka, "id">) => void;
  updateMenuPolozka: (id: string, changes: Partial<MenuPolozka>) => void;
  removeMenuPolozka: (id: string) => void;
  // Denní porce (restaurace): kuchař nastaví kolik je dnes navařeno; reset prodáno.
  nastavNavareno: (id: string, navareno: number | undefined) => void;
  // Kolik porcí dnes zbývá (navareno − prodanoDnes). null = neomezeno / není vazba porce.
  getZbyvaPorci: (id: string) => number | null;

  // Prodej — zapíše účtenku a AUTOMATICKY odečte ze skladu (provozStore).
  // Vrací id nové prodejky, nebo null když je košík prázdný.
  prodat: (cart: CartItem[], platba?: ZpusobPlatby, rozpisPlatby?: { hotovost: number; karta: number }) => string | null;
  stornoProdejka: (id: string) => void; // smaže účtenku a vrátí zboží na sklad
  // Částečné vrácení: vrátí VYBRANÉ řádky z účtenky (množství po kusech).
  // Vytvoří samostatný doklad o vrácení (záporné částky), zboží vrátí na sklad,
  // původní účtenku ponechá. Vrací id dokladu o vrácení, nebo null.
  vratitPolozky: (prodejkaId: string, vraceni: { radekIndex: number; mnozstvi: number }[]) => string | null;

  // Výpočty
  getTrzbaDne: (isoDate: string) => number;      // tržba za daný den (YYYY-MM-DD)
  getPocetProdejekDne: (isoDate: string) => number;
  // Účetní souhrn za období [od, do] včetně (YYYY-MM-DD).
  getSouhrn: (odISO: string, doISO: string) => UcetniSouhrn;

  // Denní uzávěrka
  uzavritDen: (isoDate: string) => void;          // označí den za uzavřený
  jeDenUzavren: (isoDate: string) => boolean;     // byl den už uzavřen?
  prumernaTrzba: (dniZpet: number) => number;     // průměrná denní tržba za N dní (jen dny s prodejem)

  // Hotovost v zásuvce
  pridejPohybHotovosti: (typ: TypPohybu, castka: number, poznamka?: string) => void;
  smazPohybHotovosti: (id: string) => void;
  // Očekávaný stav zásuvky pro daný den (počáteční + hotovost tržby − vrácení + vklady − výběry).
  getStavZasuvky: (isoDate: string) => StavZasuvky;
}

// Dnešní datum jako YYYY-MM-DD (lokální).
function dnesLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Vygeneruje 8místný kód účtenky: RR (rok) + 6 číslic pořadí v rámci roku.
// Pořadí = kolik dokladů (prodej i vrácení) už letos je + 1. Roste postupně,
// po Novém roce se pořadí resetuje (prefix roku je rozliší). Vrací "26000042".
function generujCisloUctenky(prodejky: Prodejka[]): string {
  const d = new Date();
  const rr = String(d.getFullYear() % 100).padStart(2, "0");
  const letosCount = prodejky.filter((p) => p.cislo?.startsWith(rr)).length;
  const poradi = String(letosCount + 1).padStart(6, "0");
  return `${rr}${poradi}`;
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
      uzaverky: {},
      pohybyHotovosti: [],

      addMenuPolozka: (p) =>
        set((s) => ({
          menu: [...s.menu, { aktivni: true, odbet: 1, ...p, id: crypto.randomUUID() }],
        })),

      updateMenuPolozka: (id, changes) =>
        set((s) => ({
          menu: s.menu.map((m) => (m.id === id ? { ...m, ...changes } : m)),
        })),

      nastavNavareno: (id, navareno) =>
        set((s) => ({
          menu: s.menu.map((m) =>
            m.id === id
              ? { ...m, navareno, navarenoDatum: dnesLocal(), prodanoDnes: 0 }
              : m,
          ),
        })),

      getZbyvaPorci: (id) => {
        const m = get().menu.find((x) => x.id === id);
        if (!m || m.vazbaTyp !== "porce") return null;
        // Nový den → počítadlo prodáno je neplatné (bere se 0).
        const prodano = m.navarenoDatum === dnesLocal() ? (m.prodanoDnes ?? 0) : 0;
        if (m.navareno == null) return null; // neomezeno → jen počítá, nehlídá zbytek
        return Math.max(0, m.navareno - prodano);
      },

      removeMenuPolozka: (id) =>
        set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),

      prodat: (cart, platba = "hotovost", rozpisPlatby) => {
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
        const dnes = dnesLocal();
        // Kolik porcí se prodalo za každou menu položku (pro denní počítadlo).
        const prodanoPorci: Record<string, number> = {};
        radky.forEach((r) => { if (r.menuId) prodanoPorci[r.menuId] = (prodanoPorci[r.menuId] ?? 0) + r.mnozstvi; });
        const cislo = generujCisloUctenky(get().prodejky);
        const obsluha = useStaffStore.getState().aktivniJmeno() || undefined;
        set((s) => ({
          prodejky: [
            { id, cislo, datum: new Date().toISOString(), radky, celkem, platba, obsluha, ...(rozpisPlatby ? { rozpisPlatby } : {}) },
            ...s.prodejky,
          ],
          // Navýš denní počítadlo prodaných porcí (reset, když je nový den).
          menu: s.menu.map((m) => {
            const pr = prodanoPorci[m.id];
            if (!pr || m.vazbaTyp !== "porce") return m;
            const zaklad = m.navarenoDatum === dnes ? (m.prodanoDnes ?? 0) : 0;
            return { ...m, navarenoDatum: dnes, prodanoDnes: zaklad + pr };
          }),
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
        // Vrať i denní porce zpět (jen pokud se storno děje ve stejný den).
        const dnes = dnesLocal();
        const vratPorci: Record<string, number> = {};
        prodejka.radky.forEach((r) => { if (r.menuId) vratPorci[r.menuId] = (vratPorci[r.menuId] ?? 0) + r.mnozstvi; });
        set((s) => ({
          prodejky: s.prodejky.filter((p) => p.id !== id),
          menu: s.menu.map((m) => {
            const vr = vratPorci[m.id];
            if (!vr || m.vazbaTyp !== "porce" || m.navarenoDatum !== dnes) return m;
            return { ...m, prodanoDnes: Math.max(0, (m.prodanoDnes ?? 0) - vr) };
          }),
        }));
      },

      vratitPolozky: (prodejkaId, vraceni) => {
        const orig = get().prodejky.find((p) => p.id === prodejkaId);
        if (!orig) return null;
        // Sestav vrácené řádky (jen kladné množství, max co bylo prodáno).
        const radky: ProdejkaRadek[] = [];
        vraceni.forEach(({ radekIndex, mnozstvi }) => {
          const r = orig.radky[radekIndex];
          if (!r) return;
          const kolik = Math.min(Math.max(0, mnozstvi), r.mnozstvi);
          if (kolik > 0) radky.push({ ...r, mnozstvi: kolik });
        });
        if (radky.length === 0) return null;
        // Doklad o vrácení: záporná částka, vlastní kód, odkaz na původní účtenku.
        const celkem = -radky.reduce((sum, r) => sum + r.cena * r.mnozstvi, 0);
        const id = crypto.randomUUID();
        const cislo = generujCisloUctenky(get().prodejky);
        const dnes = dnesLocal();
        const vratPorci: Record<string, number> = {};
        radky.forEach((r) => { if (r.menuId) vratPorci[r.menuId] = (vratPorci[r.menuId] ?? 0) + r.mnozstvi; });
        const obsluha = useStaffStore.getState().aktivniJmeno() || undefined;
        set((s) => ({
          prodejky: [
            { id, cislo, datum: new Date().toISOString(), radky, celkem, platba: orig.platba, vraceno: true, puvodniCislo: orig.cislo, obsluha },
            ...s.prodejky,
          ],
          menu: s.menu.map((m) => {
            const vr = vratPorci[m.id];
            if (!vr || m.vazbaTyp !== "porce" || m.navarenoDatum !== dnes) return m;
            return { ...m, prodanoDnes: Math.max(0, (m.prodanoDnes ?? 0) - vr) };
          }),
        }));
        // Zboží zpět na sklad (kladné znaménko = návrat).
        radky.forEach((r) => promitniDoSkladu(r, r.mnozstvi, 1));
        return id;
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
          // Dělená platba: rozpočítej přesně. Jinak celá částka podle způsobu.
          if (p.rozpisPlatby) {
            hotovost += p.rozpisPlatby.hotovost;
            karta += p.rozpisPlatby.karta;
          } else if (p.platba === "karta") {
            karta += p.celkem;
          } else {
            hotovost += p.celkem;
          }
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

      uzavritDen: (isoDate) =>
        set((s) => ({ uzaverky: { ...s.uzaverky, [isoDate]: new Date().toISOString() } })),

      jeDenUzavren: (isoDate) => !!get().uzaverky[isoDate],

      // Průměrná denní tržba za posledních N dní — počítá jen dny, kdy byl prodej
      // (zavřené dny nezkreslují průměr). Vrací 0, když není z čeho počítat.
      prumernaTrzba: (dniZpet) => {
        const dnyMap = new Map<string, number>();
        for (const p of get().prodejky) {
          const d = p.datum.slice(0, 10);
          dnyMap.set(d, (dnyMap.get(d) ?? 0) + p.celkem);
        }
        const dnes = new Date();
        const hranice = new Date(dnes);
        hranice.setDate(dnes.getDate() - dniZpet);
        const dnesStr = dnes.toISOString().slice(0, 10);
        let soucet = 0, pocet = 0;
        for (const [den, trzba] of dnyMap) {
          if (den >= hranice.toISOString().slice(0, 10) && den < dnesStr) {
            soucet += trzba; pocet++;
          }
        }
        return pocet > 0 ? soucet / pocet : 0;
      },

      // ---- Hotovost v zásuvce ----
      pridejPohybHotovosti: (typ, castka, poznamka) =>
        set((s) => ({
          pohybyHotovosti: [
            { id: crypto.randomUUID(), datum: new Date().toISOString(), typ, castka: Math.abs(castka), poznamka },
            ...s.pohybyHotovosti,
          ],
        })),

      smazPohybHotovosti: (id) =>
        set((s) => ({ pohybyHotovosti: s.pohybyHotovosti.filter((p) => p.id !== id) })),

      getStavZasuvky: (isoDate) => {
        const pohyby = get().pohybyHotovosti.filter((p) => p.datum.slice(0, 10) === isoDate);
        // Poslední (nejnovější) počáteční vklad dne bereme jako výchozí stav.
        const pocatecni = pohyby.filter((p) => p.typ === "pocatecni").reduce((a, p) => a + p.castka, 0);
        const vklady = pohyby.filter((p) => p.typ === "vklad").reduce((a, p) => a + p.castka, 0);
        const vybery = pohyby.filter((p) => p.typ === "vyber").reduce((a, p) => a + p.castka, 0);
        // Hotovostní tržby a vrácení dne z účtenek (vrácenky mají záporný celkem).
        let trzbaHotovost = 0, vraceniHotovost = 0;
        for (const pr of get().prodejky) {
          if (pr.datum.slice(0, 10) !== isoDate) continue;
          // Dělená platba: do zásuvky jde jen hotovostní část.
          if (pr.rozpisPlatby) {
            if (pr.rozpisPlatby.hotovost > 0) trzbaHotovost += pr.rozpisPlatby.hotovost;
            else if (pr.rozpisPlatby.hotovost < 0) vraceniHotovost += -pr.rozpisPlatby.hotovost;
            continue;
          }
          if (pr.platba && pr.platba !== "hotovost") continue; // jen hotovost (default = hotovost)
          if (pr.celkem >= 0) trzbaHotovost += pr.celkem;
          else vraceniHotovost += -pr.celkem;
        }
        const ocekavano = pocatecni + trzbaHotovost - vraceniHotovost + vklady - vybery;
        return { pocatecni, trzbaHotovost, vraceniHotovost, vklady, vybery, ocekavano };
      },
    }),
    {
      name: "kasa-store",
      version: 1,
    },
  ),
);
