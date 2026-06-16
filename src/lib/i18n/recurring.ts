import type { Translation } from "./dict";

// Překlady pro obrazovku Opakování (RecurringView).
export const recurring: Record<string, Translation> = {
  // ── Modal: Přidat opakovaný nákup ──
  "recurring.modalTitle": { cs: "Opakující se nákup", sk: "Opakujúci sa nákup" },
  "recurring.product": { cs: "PRODUKT", sk: "PRODUKT" },
  "recurring.productPlaceholder": { cs: "např. Mléko, Káva, Chleba...", sk: "napr. Mlieko, Káva, Chlieb..." },
  "recurring.quantity": { cs: "MNOŽSTVÍ", sk: "MNOŽSTVO" },
  "recurring.unit": { cs: "JEDNOTKA", sk: "JEDNOTKA" },
  "recurring.frequency": { cs: "FREKVENCE", sk: "FREKVENCIA" },
  "recurring.orCustomDays": { cs: "Nebo vlastní počet dní:", sk: "Alebo vlastný počet dní:" },
  "recurring.days": { cs: "dní", sk: "dní" },
  "recurring.store": { cs: "OBCHOD (volitelně)", sk: "OBCHOD (voliteľné)" },
  "recurring.storePlaceholder": { cs: "např. Lidl, Rohlik...", sk: "napr. Lidl, Rohlik..." },
  "recurring.addReminder": { cs: "Přidat připomínku", sk: "Pridať pripomienku" },

  // ── Intervaly (frekvence) ──
  "recurring.intervalWeek": { cs: "Každý týden", sk: "Každý týždeň" },
  "recurring.interval2Weeks": { cs: "Každé 2 týdny", sk: "Každé 2 týždne" },
  "recurring.intervalMonth": { cs: "Každý měsíc", sk: "Každý mesiac" },
  "recurring.interval2Months": { cs: "Každé 2 měsíce", sk: "Každé 2 mesiace" },
  "recurring.interval3Months": { cs: "Každé 3 měsíce", sk: "Každé 3 mesiace" },
  "recurring.intervalCustom": { cs: "Každých {n} dní", sk: "Každých {n} dní" },

  // ── Stavové popisky karty ──
  "recurring.overdue": { cs: "Mělo se koupit před {n} dny", sk: "Malo sa kúpiť pred {n} dňami" },
  "recurring.buyToday": { cs: "Koupit dnes", sk: "Kúpiť dnes" },
  "recurring.inDay": { cs: "Za {n} den", sk: "O {n} deň" },
  "recurring.inDays2to4": { cs: "Za {n} dny", sk: "O {n} dni" },
  "recurring.inDays": { cs: "Za {n} dní", sk: "O {n} dní" },

  // ── Akce na kartě ──
  "recurring.added": { cs: "Přidáno", sk: "Pridané" },
  "recurring.toShopping": { cs: "Do nákupu", sk: "Do nákupu" },
  "recurring.purchased": { cs: "Koupeno", sk: "Kúpené" },
  "recurring.removeReminder": { cs: "Odebrat připomínku", sk: "Odobrať pripomienku" },

  // ── Predikce ze spižírny ──
  "recurring.runningOut": { cs: "Brzy dojde", sk: "Čoskoro dôjde" },
  "recurring.outToday": { cs: "Dnes dojde", sk: "Dnes dôjde" },
  "recurring.leftDay": { cs: "Zbývá 1 den", sk: "Zostáva 1 deň" },
  "recurring.leftDays": { cs: "Zbývá ~{n} dní", sk: "Zostáva ~{n} dní" },
  "recurring.addToShoppingShort": { cs: "+ Do nákupu", sk: "+ Do nákupu" },

  // ── Sekce / hlavní pohled ──
  "recurring.intro": {
    cs: "Pravidelné nákupy s automatickou připomínkou. Zaškrtnutím odešlete položku do nákupního seznamu.",
    sk: "Pravidelné nákupy s automatickou pripomienkou. Zaškrtnutím odošlete položku do nákupného zoznamu.",
  },
  "recurring.timeToBuy": { cs: "🔴 Je čas koupit ({n})", sk: "🔴 Je čas kúpiť ({n})" },
  "recurring.soonBuy": { cs: "🟡 Brzy koupit ({n})", sk: "🟡 Čoskoro kúpiť ({n})" },
  "recurring.scheduled": { cs: "Naplánováno", sk: "Naplánované" },

  // ── Prázdný stav ──
  "recurring.emptyTitle": { cs: "Pravidelné zásoby", sk: "Pravidelné zásoby" },
  "recurring.emptyDesc": {
    cs: "Přidej položky, které kupuješ opakovaně — např. mléko každý týden, prací prášek každý měsíc. Aplikace ti připomene, až bude čas nakoupit.",
    sk: "Pridaj položky, ktoré kupuješ opakovane — napr. mlieko každý týždeň, prací prášok každý mesiac. Aplikácia ti pripomenie, keď bude čas nakúpiť.",
  },
  "recurring.exampleMilk": { cs: "Mléko", sk: "Mlieko" },
  "recurring.exampleMilkInterval": { cs: "každý týden", sk: "každý týždeň" },
  "recurring.exampleBread": { cs: "Chléb", sk: "Chlieb" },
  "recurring.exampleBreadInterval": { cs: "každé 3 dny", sk: "každé 3 dni" },
  "recurring.exampleDetergent": { cs: "Prací prášek", sk: "Prací prášok" },
  "recurring.exampleDetergentInterval": { cs: "každý měsíc", sk: "každý mesiac" },
  "recurring.reminderPrefix": { cs: "Připomínka {interval}", sk: "Pripomienka {interval}" },
  "recurring.addFirst": { cs: "Přidat první zásobu", sk: "Pridať prvú zásobu" },
};
