import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId } from "@/lib/uuid";

// Objednávky odeslané na přípravu (restaurace). Číšník naťuká a klikne
// „Odeslat na přípravu" → položky se roztřídí podle pracoviště: jídlo do
// KUCHYNĚ, pití na BAR. Každé pracoviště má svou obrazovku, kde běží tickety
// a kuchař/barman je odškrtává jako hotové.
//
// Vše lokální (localStorage). Sdílení mezi zařízeními (číšník ↔ kuchyně na
// jiném tabletu) až s cloudem (Play fáze) — teď to funguje na jednom zařízení
// nebo přes sdílenou provozovnu, pokud je aktivní.
export type Pracoviste = "kuchyne" | "bar";

export interface TicketPolozka {
  nazev: string;
  mnozstvi: number;
}

export interface Ticket {
  id: string;
  pracoviste: Pracoviste;
  polozky: TicketPolozka[];
  datum: string;        // ISO datetime odeslání
  oznaceni?: string;    // volitelné: stůl / jméno (zatím pořadové číslo)
  hotovo: boolean;      // kuchař/barman odškrtl
}

interface TicketStore {
  tickets: Ticket[];
  pocitadlo: number;    // pořadové číslo objednávky (pro označení)
  // Odešle várku na přípravu — roztřídí položky podle pracoviště na 1–2 tickety.
  odeslat: (polozky: { nazev: string; mnozstvi: number; pracoviste: Pracoviste }[], oznaceni?: string) => void;
  oznacHotovo: (id: string) => void;
  smaz: (id: string) => void;
  // Aktivní (nehotové) tickety daného pracoviště, nejstarší první.
  aktivni: (p: Pracoviste) => Ticket[];
}

export const useTicketStore = create<TicketStore>()(
  persist(
    (set, get) => ({
      tickets: [],
      pocitadlo: 0,

      odeslat: (polozky, oznaceni) => {
        const cisti = polozky.filter((p) => p.mnozstvi > 0 && p.pracoviste);
        if (cisti.length === 0) return;
        const cislo = get().pocitadlo + 1;
        const label = oznaceni || `#${cislo}`;
        const nove: Ticket[] = [];
        (["kuchyne", "bar"] as Pracoviste[]).forEach((prac) => {
          const pro = cisti.filter((p) => p.pracoviste === prac);
          if (pro.length === 0) return;
          nove.push({
            id: genId(),
            pracoviste: prac,
            polozky: pro.map((p) => ({ nazev: p.nazev, mnozstvi: p.mnozstvi })),
            datum: new Date().toISOString(),
            oznaceni: label,
            hotovo: false,
          });
        });
        if (nove.length === 0) return;
        set((s) => ({ tickets: [...nove, ...s.tickets], pocitadlo: cislo }));
      },

      oznacHotovo: (id) =>
        set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, hotovo: true } : t)) })),

      smaz: (id) => set((s) => ({ tickets: s.tickets.filter((t) => t.id !== id) })),

      aktivni: (p) =>
        get().tickets
          .filter((t) => t.pracoviste === p && !t.hotovo)
          .sort((a, b) => a.datum.localeCompare(b.datum)),
    }),
    { name: "ticket-store" },
  ),
);

// Odhad pracoviště, když ho položka nemá výslovně nastavené: podle kategorie/
// názvu. Pití → bar, zbytek → kuchyně.
export function hadejPracoviste(kategorie?: string, nazev?: string): Pracoviste {
  const s = `${kategorie ?? ""} ${nazev ?? ""}`.toLowerCase();
  const bar = ["nápoj", "napoj", "pití", "piti", "pivo", "víno", "vino", "kofola", "cola", "kola",
    "limonád", "limonad", "džus", "dzus", "voda", "vody", "káva", "kav", "čaj", "caj", "espresso",
    "kapučín", "cappuccino", "latte", "drink", "alko", "rum", "vodka", "whisky", "gin", "sekt", "prosecco"];
  return bar.some((k) => s.includes(k)) ? "bar" : "kuchyne";
}
