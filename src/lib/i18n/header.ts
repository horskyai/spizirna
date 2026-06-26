import type { Translation } from "./dict";

// Texty hlavičky aplikace (AppHeader) — titulky záložek, pozdrav, add menu,
// panel "Brzy vyprší".
export const header: Record<string, Translation> = {
  // ── Titulky záložek (TITLES) ──
  "header.title.spizirna": { cs: "Spižírna", sk: "Špajza" },
  "header.title.jidlo": { cs: "Jídlo", sk: "Jedlo" },
  "header.title.skenovat": { cs: "Skenovat", sk: "Skenovať" },
  "header.title.recepty": { cs: "Recepty", sk: "Recepty" },
  "header.title.nakup": { cs: "Nákupní seznam", sk: "Nákupný zoznam" },
  "header.title.opakujici": { cs: "Zásoby & připomínky", sk: "Zásoby & pripomienky" },
  "header.title.provoz": { cs: "Provoz & inventura", sk: "Prevádzka & inventúra" },

  // ── Hero hlavička ──
  // Pozdrav podle denní doby (vybírá se v AppHeaderu podle hodiny).
  "header.greetingMorning": { cs: "Dobré ráno", sk: "Dobré ráno" },
  "header.greetingAfternoon": { cs: "Dobré odpoledne", sk: "Dobré popoludnie" },
  "header.greetingEvening": { cs: "Dobrý večer", sk: "Dobrý večer" },
  "header.myPantry": { cs: "Moje spižírna", sk: "Moja špajza" },
  // Osobní oslovení v panelu expirace ({name} = křestní jméno).
  "header.expiryGreetingName": { cs: "{name}, tohle ti brzy končí — ať nic nevyhodíš:", sk: "{name}, toto ti čoskoro končí — nech nič nevyhodíš:" },
  "header.expiryGreeting": { cs: "Tohle ti brzy končí — ať nic nevyhodíš:", sk: "Toto ti čoskoro končí — nech nič nevyhodíš:" },

  // ── Add menu ──
  "header.scanEan": { cs: "Naskenovat EAN kód", sk: "Naskenovať EAN kód" },
  "header.scanEanDesc": {
    cs: "Automaticky načte info z databáze",
    sk: "Automaticky načíta info z databázy",
  },
  "header.addManual": { cs: "Přidat ručně", sk: "Pridať ručne" },
  "header.addManualDesc": {
    cs: "Zadejte název, výživové hodnoty a cenu",
    sk: "Zadajte názov, výživové hodnoty a cenu",
  },

  // ── Panel "Brzy vyprší" ──
  "header.expiringSoon": { cs: "Brzy vyprší", sk: "Čoskoro vyprší" },
  "header.expired": { cs: "Prošlé!", sk: "Prešlé!" },
  "header.today": { cs: "Dnes", sk: "Dnes" },
  "header.tomorrow": { cs: "Zítra", sk: "Zajtra" },
  "header.inDays": { cs: "Za {n} dní", sk: "O {n} dní" },
  // Akce v panelu expirace
  "header.expiry.remind": { cs: "Připomenout", sk: "Pripomenúť" },
  "header.expiry.reminded": { cs: "V připomínkách", sk: "V pripomienkach" },
  "header.expiry.cook": { cs: "Co z toho uvařit", sk: "Čo z toho uvariť" },
  "header.expiry.goToReminders": { cs: "Upravit připomínky", sk: "Upraviť pripomienky" },
};
