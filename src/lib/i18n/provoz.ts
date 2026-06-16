import type { Translation } from "./dict";

// Překlady oblasti Provoz (ProvozView) — inventura, sklad, dodavatelé, export.
export const provoz: Record<string, Translation> = {
  // ── Kategorie skladu (label podle id, id se nepřekládá) ──
  "provoz.kat.potraviny": { cs: "Potraviny", sk: "Potraviny" },
  "provoz.kat.maso-ryby": { cs: "Maso & ryby", sk: "Mäso & ryby" },
  "provoz.kat.mlecne": { cs: "Mléčné", sk: "Mliečne" },
  "provoz.kat.ovoce-zelenina": { cs: "Ovoce & zelenina", sk: "Ovocie & zelenina" },
  "provoz.kat.suche-zbozi": { cs: "Suché zboží", sk: "Suchý tovar" },
  "provoz.kat.napoje-nealkohol": { cs: "Nápoje", sk: "Nápoje" },
  "provoz.kat.alkohol": { cs: "Alkohol", sk: "Alkohol" },
  "provoz.kat.ostatni": { cs: "Ostatní", sk: "Ostatné" },

  // ── Záložky / navigace ──
  "provoz.tab.inventura": { cs: "Inventura", sk: "Inventúra" },
  "provoz.tab.sklad": { cs: "Sklad", sk: "Sklad" },
  "provoz.tab.historie": { cs: "Historie", sk: "História" },
  "provoz.tab.dodavatele": { cs: "Dodavatelé", sk: "Dodávatelia" },

  // ── Export (CSV/PDF) ──
  "provoz.export.nazev": { cs: "Název", sk: "Názov" },
  "provoz.export.kategorie": { cs: "Kategorie", sk: "Kategória" },
  "provoz.export.skutecnyStav": { cs: "Skutečný stav", sk: "Skutočný stav" },
  "provoz.export.jednotka": { cs: "Jednotka", sk: "Jednotka" },
  "provoz.export.minZasoba": { cs: "Min. zásoba", sk: "Min. zásoba" },
  "provoz.export.cenaJedn": { cs: "Cena/jedn.", sk: "Cena/jedn." },
  "provoz.export.hodnota": { cs: "Hodnota", sk: "Hodnota" },
  "provoz.export.podMinimem": { cs: "Pod minimem", sk: "Pod minimom" },
  "provoz.export.minTrvanlivostDo": { cs: "Min. trvanlivost do", sk: "Min. trvanlivosť do" },
  "provoz.export.ano": { cs: "ANO", sk: "ÁNO" },
  "provoz.export.ne": { cs: "NE", sk: "NIE" },
  "provoz.export.headerInventura": { cs: "INVENTURA", sk: "INVENTÚRA" },
  "provoz.export.headerSpizirna": { cs: "Spižírna — Provoz", sk: "Špajza — Prevádzka" },
  "provoz.export.datum": { cs: "Datum", sk: "Dátum" },
  "provoz.export.pocetPolozek": { cs: "Počet položek", sk: "Počet položiek" },
  "provoz.export.vygenerovano": { cs: "Vygenerováno", sk: "Vygenerované" },
  "provoz.export.celkovaHodnota": { cs: "Celková hodnota skladu", sk: "Celková hodnota skladu" },
  "provoz.export.minTrvanlivost": { cs: "Min. trvanlivost", sk: "Min. trvanlivosť" },
  "provoz.export.ok": { cs: "OK?", sk: "OK?" },
  "provoz.export.footer": { cs: "Spižírna — Provoz & Inventura", sk: "Špajza — Prevádzka & Inventúra" },

  // ── Trvanlivost ──
  "provoz.trv.vyprselo": { cs: "Vypršelo před {n} dny", sk: "Vypršalo pred {n} dňami" },
  "provoz.trv.vyprsiDnes": { cs: "Vyprší dnes!", sk: "Vyprší dnes!" },
  "provoz.trv.vyprsiZa1": { cs: "Vyprší za 1 den", sk: "Vyprší za 1 deň" },
  "provoz.trv.vyprsiZaDny": { cs: "Vyprší za {n} dny", sk: "Vyprší za {n} dni" },
  "provoz.trv.vyprsiZaDni": { cs: "Vyprší za {n} dní", sk: "Vyprší za {n} dní" },
  "provoz.trv.minTrvanlivost": { cs: "Min. trvanlivost: {d}", sk: "Min. trvanlivosť: {d}" },

  // ── Formulář nové položky skladu ──
  "provoz.novaPolozka": { cs: "Nová položka skladu", sk: "Nová položka skladu" },
  "provoz.zadatRucne": { cs: "Zadat ručně", sk: "Zadať ručne" },
  "provoz.skenovatEan": { cs: "Skenovat EAN", sk: "Skenovať EAN" },
  "provoz.otevritFotoaparat": { cs: "Otevřít fotoaparát", sk: "Otvoriť fotoaparát" },
  "provoz.neboZadatEan": { cs: "nebo zadat EAN číslo", sk: "alebo zadať EAN číslo" },
  "provoz.eanPlaceholder": { cs: "např. 8594013425054", sk: "napr. 8594013425054" },
  "provoz.hledat": { cs: "Hledat", sk: "Hľadať" },
  "provoz.nalezeno": { cs: "✓ Nalezeno: {n}", sk: "✓ Nájdené: {n}" },
  "provoz.nazev": { cs: "Název", sk: "Názov" },
  "provoz.nazevPlaceholder": { cs: "např. Kuřecí prsa, Vodka Absolut...", sk: "napr. Kuracie prsia, Vodka Absolut..." },
  "provoz.kategorie": { cs: "Kategorie", sk: "Kategória" },
  "provoz.jednotka": { cs: "Jednotka", sk: "Jednotka" },
  "provoz.minZasoba": { cs: "Min. zásoba", sk: "Min. zásoba" },
  "provoz.cenaJedn": { cs: "Cena/jedn. (Kč)", sk: "Cena/jedn. (Kč)" },
  "provoz.dodavatel": { cs: "Dodavatel", sk: "Dodávateľ" },
  "provoz.volitelne": { cs: "volitelné", sk: "voliteľné" },
  "provoz.minTrvanlivostDo": { cs: "Min. trvanlivost do", sk: "Min. trvanlivosť do" },
  "provoz.foto": { cs: "Fotka položky", sk: "Fotka položky" },
  "provoz.fotit": { cs: "Fotit", sk: "Fotiť" },
  "provoz.galerie": { cs: "Galerie", sk: "Galéria" },
  "provoz.pridatPolozku": { cs: "Přidat položku", sk: "Pridať položku" },

  // ── Aktivní inventura ──
  "provoz.probihajiciInventura": { cs: "Probíhající inventura", sk: "Prebiehajúca inventúra" },
  "provoz.polozek": { cs: "položek", sk: "položiek" },
  "provoz.hodnotaSkladu": { cs: "Hodnota skladu", sk: "Hodnota skladu" },
  "provoz.uzavritInventuru": { cs: "Uzavřít inventuru", sk: "Uzavrieť inventúru" },
  "provoz.uzavritInventuruQ": { cs: "Uzavřít inventuru?", sk: "Uzavrieť inventúru?" },
  "provoz.poUzavreni": { cs: "Po uzavření nelze editovat zadané stavy.", sk: "Po uzavretí nie je možné editovať zadané stavy." },
  "provoz.anoUzavrit": { cs: "Ano, uzavřít", sk: "Áno, uzavrieť" },
  "provoz.vse": { cs: "Vše ({n})", sk: "Všetko ({n})" },
  "provoz.zadnePolozkyKat": { cs: "Žádné položky v této kategorii", sk: "Žiadne položky v tejto kategórii" },
  "provoz.podMinimem": { cs: " — pod minimem!", sk: " — pod minimom!" },

  // ── Editace položky ──
  "provoz.upravitPolozku": { cs: "Upravit položku", sk: "Upraviť položku" },

  // ── Hlasový vstup ──
  "provoz.voice.nepodporovano": { cs: "Prohlížeč nepodporuje hlasové zadávání. Zkuste Chrome nebo Safari.", sk: "Prehliadač nepodporuje hlasové zadávanie. Skúste Chrome alebo Safari." },
  "provoz.voice.nerozumel": { cs: "Nerozuměl jsem. Zkuste to znovu.", sk: "Nerozumel som. Skúste to znova." },
  "provoz.voice.odmitnut": { cs: "Přístup k mikrofonu byl odmítnut.", sk: "Prístup k mikrofónu bol odmietnutý." },
  "provoz.voice.neslysel": { cs: "Nic jsem neslyšel. Zkuste znovu.", sk: "Nič som nepočul. Skúste znova." },
  "provoz.voice.poslouchamHint": { cs: "Poslouchám… např. „dvanáct lahví vína, pět kilo mouky\"", sk: "Počúvam… napr. „dvanásť fliaš vína, päť kíl múky\"" },
  "provoz.voice.aria": { cs: "Přidat položku hlasem", sk: "Pridať položku hlasom" },

  // ── Správa skladu ──
  "provoz.podMinZasobou": { cs: "{n} položek pod minimální zásobou!", sk: "{n} položiek pod minimálnou zásobou!" },
  "provoz.aDalsi": { cs: " a {n} další", sk: " a {n} ďalšie" },
  "provoz.hledatVeSkladu": { cs: "Hledat ve skladu...", sk: "Hľadať v sklade..." },
  "provoz.nicNenalezeno": { cs: "Nic nenalezeno pro „{q}“", sk: "Nič nenájdené pre „{q}“" },
  "provoz.skladPrazdny": { cs: "Sklad je prázdný", sk: "Sklad je prázdny" },
  "provoz.skladPrazdnyDesc": { cs: "Přidejte položky které chcete inventarizovat.", sk: "Pridajte položky, ktoré chcete inventarizovať." },
  "provoz.min": { cs: "Min.", sk: "Min." },
  "provoz.pridanoDoSkladu": { cs: "{n} přidáno do skladu", sk: "{n} pridané do skladu" },
  "provoz.polozkyPridany": { cs: "{n} položky přidány do skladu", sk: "{n} položky pridané do skladu" },

  // ── Dodavatelé ──
  "provoz.zadniDodavatele": { cs: "Žádní dodavatelé", sk: "Žiadni dodávatelia" },
  "provoz.dodavateleDesc": { cs: "Přidejte dodavatele pro rychlý přístup ke kontaktům.", sk: "Pridajte dodávateľov pre rýchly prístup ku kontaktom." },
  "provoz.pridatDodavatele": { cs: "Přidat dodavatele", sk: "Pridať dodávateľa" },
  "provoz.novyDodavatel": { cs: "Nový dodavatel", sk: "Nový dodávateľ" },
  "provoz.dod.nazev": { cs: "Název *", sk: "Názov *" },
  "provoz.dod.nazevPlaceholder": { cs: "Makro, Albert, řezník...", sk: "Makro, Albert, mäsiar..." },
  "provoz.dod.telefon": { cs: "Telefon", sk: "Telefón" },
  "provoz.dod.telefonPlaceholder": { cs: "+420 xxx xxx xxx", sk: "+421 xxx xxx xxx" },
  "provoz.dod.email": { cs: "Email", sk: "E-mail" },
  "provoz.dod.emailPlaceholder": { cs: "objednavky@...", sk: "objednavky@..." },
  "provoz.dod.poznamka": { cs: "Poznámka", sk: "Poznámka" },
  "provoz.dod.poznamkaPlaceholder": { cs: "Pondělí–Pátek do 10h...", sk: "Pondelok–Piatok do 10h..." },

  // ── Co dokoupit ──
  "provoz.coDokoupit": { cs: "🛒 Co dokoupit ({n})", sk: "🛒 Čo dokúpiť ({n})" },
  "provoz.minZasobaLabel": { cs: "Min. zásoba: {n} {j}", sk: "Min. zásoba: {n} {j}" },

  // ── Historie ──
  "provoz.zadnaUzavrena": { cs: "Zatím žádná uzavřená inventura", sk: "Zatiaľ žiadna uzavretá inventúra" },
  "provoz.polozekDatum": { cs: "{n} položek", sk: "{n} položiek" },
  "provoz.podMinimemBadge": { cs: "⚠️ {n} pod minimem", sk: "⚠️ {n} pod minimom" },
  "provoz.stahnoutCsv": { cs: "Stáhnout CSV (Excel)", sk: "Stiahnuť CSV (Excel)" },
  "provoz.stahnoutPdf": { cs: "Stáhnout PDF", sk: "Stiahnuť PDF" },
  "provoz.sdilet": { cs: "Sdílet", sk: "Zdieľať" },
  "provoz.zadneZaznamy": { cs: "Žádné záznamy", sk: "Žiadne záznamy" },

  // ── Hlavní view — onboarding / start ──
  "provoz.jakZacit": { cs: "Jak začít s Provozem?", sk: "Ako začať s Prevádzkou?" },
  "provoz.triKroky": { cs: "3 jednoduché kroky k první inventuře", sk: "3 jednoduché kroky k prvej inventúre" },
  "provoz.krok": { cs: "KROK {n}", sk: "KROK {n}" },
  "provoz.krok1.title": { cs: "Nastavte sklad", sk: "Nastavte sklad" },
  "provoz.krok1.desc": { cs: "Přidejte položky, které chcete sledovat — suroviny, nápoje, zásoby.", sk: "Pridajte položky, ktoré chcete sledovať — suroviny, nápoje, zásoby." },
  "provoz.krok1.btn": { cs: "Přejít na Sklad →", sk: "Prejsť na Sklad →" },
  "provoz.krok2.title": { cs: "Spusťte inventuru", sk: "Spustite inventúru" },
  "provoz.krok2.desc": { cs: "Projděte sklad a zadejte skutečné množství každé položky.", sk: "Prejdite sklad a zadajte skutočné množstvo každej položky." },
  "provoz.krok3.title": { cs: "Exportujte výsledky", sk: "Exportujte výsledky" },
  "provoz.krok3.desc": { cs: "Stáhněte PDF nebo Excel report pro evidenci nebo účetnictví.", sk: "Stiahnite PDF alebo Excel report pre evidenciu alebo účtovníctvo." },
  "provoz.spustitInventuru": { cs: "Spustit inventuru", sk: "Spustiť inventúru" },
  "provoz.projdetePolozek": { cs: "Projdete {n} položek a zadáte skutečné stavy.", sk: "Prejdete {n} položiek a zadáte skutočné stavy." },
  "provoz.zacitInventuru": { cs: "Začít inventuru", sk: "Začať inventúru" },
  "provoz.rozpracovane": { cs: "Rozpracované", sk: "Rozpracované" },
  "provoz.polozekZ": { cs: "{a}/{b} položek", sk: "{a}/{b} položiek" },
  "provoz.nazevInventury": { cs: "Název inventury", sk: "Názov inventúry" },
  "provoz.nazevInventuryPlaceholder": { cs: "např. Týdenní inventura, Inventura alkoholu...", sk: "napr. Týždenná inventúra, Inventúra alkoholu..." },
};
