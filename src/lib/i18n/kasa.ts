import type { Translation } from "./dict";

// Kasa (pokladna / POS) v tabu Provoz. Prodej automaticky odečítá ze skladu.
export const kasa: Record<string, Translation> = {
  "provoz.tab.kasa": { cs: "Kasa", sk: "Pokladňa" },

  // Denní přehled tržby
  "kasa.trzbaDnes": { cs: "Dnešní tržba", sk: "Dnešná tržba" },
  "kasa.uctenek": { cs: "{n} účtenek", sk: "{n} účteniek" },
  "kasa.uctenka1": { cs: "1 účtenka", sk: "1 účtenka" },

  // Pult / košík
  "kasa.pult": { cs: "Prodej", sk: "Predaj" },
  "kasa.kosik": { cs: "Košík", sk: "Košík" },
  "kasa.kosikPrazdny": { cs: "Klepni na položku a přidáš ji na účtenku", sk: "Klepni na položku a pridáš ju na účtenku" },
  "kasa.celkem": { cs: "Celkem", sk: "Spolu" },
  "kasa.zaplatit": { cs: "Zaplatit", sk: "Zaplatiť" },
  "kasa.hotove": { cs: "Hotově", sk: "Hotovo" },
  "kasa.kartou": { cs: "Kartou", sk: "Kartou" },
  "kasa.vyprazdnit": { cs: "Vyprázdnit", sk: "Vyprázdniť" },
  "kasa.zaplaceno": { cs: "Zaplaceno · {n} Kč", sk: "Zaplatené · {n} €" },
  "kasa.odectenoZeSkladu": { cs: "Odečteno ze skladu ✓", sk: "Odčítané zo skladu ✓" },

  // Prázdné menu
  "kasa.menuPrazdne": { cs: "Zatím žádné položky na prodej", sk: "Zatiaľ žiadne položky na predaj" },
  "kasa.menuPrazdneDesc": {
    cs: "Přidej, co prodáváš — jídla z receptů (odečtou ingredience) nebo kusové zboží (odečte kusy ze skladu).",
    sk: "Pridaj, čo predávaš — jedlá z receptov (odčítajú ingrediencie) alebo kusový tovar (odčíta kusy zo skladu).",
  },
  "kasa.pridatPrvni": { cs: "Přidat první položku", sk: "Pridať prvú položku" },

  // Správa menu
  "kasa.spravaMenu": { cs: "Upravit nabídku", sk: "Upraviť ponuku" },
  "kasa.zpetNaProdej": { cs: "Zpět na prodej", sk: "Späť na predaj" },
  "kasa.novaMenuPolozka": { cs: "Nová položka nabídky", sk: "Nová položka ponuky" },
  "kasa.upravitMenuPolozku": { cs: "Upravit položku", sk: "Upraviť položku" },
  "kasa.nazev": { cs: "Název", sk: "Názov" },
  "kasa.nazevPlaceholder": { cs: "např. Guláš, Pepsi 0,5 l", sk: "napr. Guláš, Pepsi 0,5 l" },
  "kasa.cena": { cs: "Prodejní cena (Kč)", sk: "Predajná cena (€)" },
  "kasa.kategorie": { cs: "Skupina (volitelně)", sk: "Skupina (voliteľne)" },
  "kasa.kategoriePlaceholder": { cs: "např. Jídla, Nápoje", sk: "napr. Jedlá, Nápoje" },
  "kasa.volitelneKod": { cs: "volitelné", sk: "voliteľné" },
  "kasa.skupinaVlastni": { cs: "Vlastní…", sk: "Vlastné…" },
  // Přednastavené skupiny jídel pro restauraci (klik místo psaní)
  "kasa.skup.polevky": { cs: "Polévky", sk: "Polievky" },
  "kasa.skup.predkrmy": { cs: "Předkrmy", sk: "Predjedlá" },
  "kasa.skup.hlavni": { cs: "Hlavní jídla", sk: "Hlavné jedlá" },
  "kasa.skup.priloha": { cs: "Přílohy", sk: "Prílohy" },
  "kasa.skup.dezerty": { cs: "Dezerty", sk: "Dezerty" },
  "kasa.skup.napoje": { cs: "Nápoje", sk: "Nápoje" },
  "kasa.skup.alkohol": { cs: "Alkohol", sk: "Alkohol" },
  "kasa.pridat": { cs: "Přidat do nabídky", sk: "Pridať do ponuky" },
  "kasa.ulozit": { cs: "Uložit", sk: "Uložiť" },
  "kasa.smazat": { cs: "Smazat z nabídky", sk: "Zmazať z ponuky" },
  "kasa.aktivni": { cs: "V nabídce", sk: "V ponuke" },

  // Vazba na sklad
  "kasa.jakOdecist": { cs: "Jak odečítat ze skladu?", sk: "Ako odčítať zo skladu?" },
  "kasa.vazba.sklad": { cs: "Kusové zboží", sk: "Kusový tovar" },
  "kasa.vazba.skladDesc": { cs: "Prodej odečte kusy jedné skladové položky (Pepsi → −1 ks)", sk: "Predaj odčíta kusy jednej skladovej položky (Pepsi → −1 ks)" },
  "kasa.vazba.recept": { cs: "Jídlo z receptu", sk: "Jedlo z receptu" },
  "kasa.vazba.receptDesc": { cs: "Prodej odečte ingredience receptu (1 porce)", sk: "Predaj odčíta ingrediencie receptu (1 porcia)" },
  "kasa.vazba.zadna": { cs: "Neodečítat", sk: "Neodčítať" },
  "kasa.vazba.zadnaDesc": { cs: "Jen zaznamená tržbu, sklad nechá být", sk: "Len zaznamená tržbu, sklad nechá byť" },

  "kasa.vyberSklad": { cs: "Skladová položka", sk: "Skladová položka" },
  "kasa.vyberSkladPrazdno": { cs: "— vyber ze skladu —", sk: "— vyber zo skladu —" },
  "kasa.odbet": { cs: "Kolik odečíst za 1 prodej", sk: "Koľko odčítať za 1 predaj" },
  "kasa.vyberRecept": { cs: "Recept", sk: "Recept" },
  "kasa.vyberReceptPrazdno": { cs: "— vyber recept —", sk: "— vyber recept —" },
  "kasa.receptInfo": { cs: "Odečte se {n} surovin na 1 porci (z {s} porcí receptu)", sk: "Odčíta sa {n} surovín na 1 porciu (z {s} porcií receptu)" },
  "kasa.nesparovano": { cs: "⚠ Surovina „{n}“ není ve skladu — nebude se odečítat", sk: "⚠ Surovina „{n}“ nie je v sklade — nebude sa odčítať" },
  "kasa.bezVazby": { cs: "Bez napojení na sklad", sk: "Bez napojenia na sklad" },

  // Dva zdroje dlaždic + kategorie
  "kasa.sekce.sklad": { cs: "Ze skladu", sk: "Zo skladu" },
  "kasa.sekce.menu": { cs: "Nabídka (jídla)", sk: "Ponuka (jedlá)" },
  "kasa.bezKategorie": { cs: "Ostatní", sk: "Ostatné" },
  "kasa.skladPrazdny": { cs: "Sklad je prázdný", sk: "Sklad je prázdny" },
  "kasa.skladPrazdnyDesc": {
    cs: "Přidej zboží do skladu (tab Sklad) — objeví se tu automaticky k prodeji. Jídla z receptů přidáš přes „Upravit nabídku“.",
    sk: "Pridaj tovar do skladu (tab Sklad) — objaví sa tu automaticky na predaj. Jedlá z receptov pridáš cez „Upraviť ponuku“.",
  },
  "kasa.doSkladu": { cs: "Přejít do skladu", sk: "Prejsť do skladu" },

  // Skrytí skladové položky z prodeje (suroviny)
  "kasa.skryt": { cs: "Skrýt z prodeje", sk: "Skryť z predaja" },
  "kasa.zobrazit": { cs: "Zobrazit v prodeji", sk: "Zobraziť v predaji" },
  "kasa.skrytoInfo": { cs: "{n} skryto z prodeje", sk: "{n} skrytých z predaja" },
  "kasa.spravovatSkryte": { cs: "Skryté položky", sk: "Skryté položky" },
  "kasa.bezCeny": { cs: "Bez ceny — doplň prodejní cenu ve skladu", sk: "Bez ceny — doplň predajnú cenu v sklade" },

  // Numpad (číselná klávesnice)
  "kasa.numpad": { cs: "Klávesnice", sk: "Klávesnica" },
  "kasa.numpadTitul": { cs: "Rychlé markování", sk: "Rýchle markovanie" },
  "kasa.mnozstviNasobic": { cs: "Množství (×)", sk: "Množstvo (×)" },
  "kasa.pluNajit": { cs: "Najít podle kódu", sk: "Nájsť podľa kódu" },
  "kasa.pluNenalezen": { cs: "Kód {n} nenalezen", sk: "Kód {n} nenájdený" },
  "kasa.volnaPolozka": { cs: "Volná položka", sk: "Voľná položka" },
  "kasa.volnaNazev": { cs: "Různé", sk: "Rôzne" },
  "kasa.pridatVolnou": { cs: "Přidat {n} Kč", sk: "Pridať {n} €" },
  "kasa.zadejKod": { cs: "Zadej kód nebo částku", sk: "Zadaj kód alebo sumu" },
  "kasa.smazat1": { cs: "Smazat", sk: "Zmazať" },
  "kasa.nasobicAktivni": { cs: "Další zboží se přidá {n}×", sk: "Ďalší tovar sa pridá {n}×" },

  // Sken v kase
  "kasa.skenovat": { cs: "Naskenovat kód", sk: "Naskenovať kód" },
  "kasa.skenNenalezen": { cs: "Kód {n} není ve skladu", sk: "Kód {n} nie je v sklade" },
  "kasa.skenPridano": { cs: "{n} přidáno do košíku", sk: "{n} pridané do košíka" },

  // Historie prodejů
  "kasa.historieDnes": { cs: "Dnešní prodeje", sk: "Dnešné predaje" },
  "kasa.zadneProdeje": { cs: "Dnes zatím žádný prodej", sk: "Dnes zatiaľ žiadny predaj" },
  "kasa.storno": { cs: "Storno", sk: "Storno" },
  "kasa.stornoQ": { cs: "Stornovat účtenku a vrátit zboží na sklad?", sk: "Stornovať účtenku a vrátiť tovar na sklad?" },
  "kasa.polozek": { cs: "{n} položek", sk: "{n} položiek" },
};
