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
  "kasa.prijato": { cs: "Přijato (hotovost)", sk: "Prijaté (hotovosť)" },
  "kasa.vratit": { cs: "Vrátit", sk: "Vrátiť" },
  "kasa.chybi": { cs: "Chybí", sk: "Chýba" },
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
  "kasa.jakOdecistHint": {
    cs: "Nastav u KAŽDÉ položky — jídla, nápoje i vše ostatní. Určuje, co se při prodeji stane se skladem. Bez správné volby se sklad neodečítá.",
    sk: "Nastav pri KAŽDEJ položke — jedlá, nápoje aj všetko ostatné. Určuje, čo sa pri predaji stane so skladom. Bez správnej voľby sa sklad neodčíta.",
  },
  "kasa.vazba.sklad": { cs: "Kusové zboží", sk: "Kusový tovar" },
  "kasa.vazba.skladDesc": { cs: "Prodej odečte kusy jedné skladové položky (Pepsi → −1 ks)", sk: "Predaj odčíta kusy jednej skladovej položky (Pepsi → −1 ks)" },
  "kasa.vazba.recept": { cs: "Jídlo z receptu", sk: "Jedlo z receptu" },
  "kasa.vazba.receptDesc": { cs: "Prodej odečte ingredience receptu (1 porce)", sk: "Predaj odčíta ingrediencie receptu (1 porcia)" },
  "kasa.vazba.zadna": { cs: "Neodečítat", sk: "Neodčítať" },
  "kasa.vazba.zadnaDesc": { cs: "Jen zaznamená tržbu, sklad nechá být", sk: "Len zaznamená tržbu, sklad nechá byť" },
  "kasa.vazba.porce": { cs: "Denní porce", sk: "Denné porcie" },
  "kasa.vazba.porceDesc": { cs: "Kuchař ráno zadá navařeno, číšník vidí zbývá X", sk: "Kuchár ráno zadá navarené, čašník vidí zostáva X" },

  // Denní porce
  "kasa.navareno": { cs: "Navařeno dnes", sk: "Navarené dnes" },
  "kasa.navarenoHint": { cs: "Nech prázdné = neomezeno (jen počítá prodej)", sk: "Nechaj prázdne = neobmedzené (len počíta predaj)" },
  "kasa.zbyva": { cs: "zbývá {n}", sk: "zostáva {n}" },
  "kasa.prodanoDnes": { cs: "prodáno {n}", sk: "predané {n}" },
  "kasa.vyprodano": { cs: "Vyprodáno", sk: "Vypredané" },
  "kasa.porciDnes": { cs: "Porce dnes", sk: "Porcie dnes" },

  "kasa.vyberSklad": { cs: "Skladová položka", sk: "Skladová položka" },
  "kasa.vyberSkladPrazdno": { cs: "— vyber ze skladu —", sk: "— vyber zo skladu —" },
  "kasa.skladPrazdnyVazba": { cs: "Sklad je zatím prázdný", sk: "Sklad je zatiaľ prázdny" },
  "kasa.skladPrazdnyVazbaHint": { cs: "Nejdřív přidej zboží/surovinu v sekci Zboží (obchod) nebo Suroviny (restaurace) v levém menu. Pak ji tady napojíš.", sk: "Najprv pridaj tovar/surovinu v sekcii Tovar (obchod) alebo Suroviny (reštaurácia) v ľavom menu. Potom ju tu napojíš." },
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

  // Tréninkový režim — nácvik prodeje bez zápisu do tržby a skladu
  "kasa.trenink": { cs: "Trénink", sk: "Tréning" },
  "kasa.treninkBanner": { cs: "Tréninkový režim — nácvik", sk: "Tréningový režim — nácvik" },
  "kasa.treninkBannerDesc": { cs: "Nic se nezapíše do tržby ani neodečte ze skladu. Můžeš klidně zkoušet.", sk: "Nič sa nezapíše do tržby ani neodčíta zo skladu. Môžeš pokojne skúšať." },
  "kasa.treninkKonec": { cs: "Ukončit", sk: "Ukončiť" },
  "kasa.treninkProdej": { cs: "Nácvik: „prodej“ {n} Kč (nezapsáno)", sk: "Nácvik: „predaj“ {n} € (nezapísané)" },
  "kasa.treninkZbozi": { cs: "Nácvik: {n} přidáno do košíku (bez skladu)", sk: "Nácvik: {n} pridané do košíka (bez skladu)" },

  // Rychlé bankovky u platby hotově
  "kasa.presne": { cs: "Přesně", sk: "Presne" },

  // Objednávka na přípravu — bar / kuchyně (restaurace)
  "kasa.ticket.odeslat": { cs: "Odeslat na přípravu", sk: "Odoslať na prípravu" },
  "kasa.ticket.odeslanoBtn": { cs: "Odesláno na bar / kuchyni ✓", sk: "Odoslané na bar / kuchyňu ✓" },
  "kasa.ticket.odeslano": { cs: "Objednávka odeslána: pití na bar, jídlo do kuchyně", sk: "Objednávka odoslaná: pitie na bar, jedlo do kuchyne" },

  // Dělení účtu (restaurace)
  "kasa.rozdelit.titul": { cs: "Rozdělit účet", sk: "Rozdeliť účet" },
  "kasa.rozdelit.naOsoby": { cs: "Rozpočítat na osoby", sk: "Rozpočítať na osoby" },
  "kasa.rozdelit.kazdy": { cs: "Každý zaplatí", sk: "Každý zaplatí" },
  "kasa.rozdelit.platba": { cs: "Rozdělit platbu", sk: "Rozdeliť platbu" },
  "kasa.rozdelit.zbytekKartou": { cs: "Zbytek kartou", sk: "Zvyšok kartou" },
  "kasa.rozdelit.zaplatit": { cs: "Zaplatit rozděleně", sk: "Zaplatiť rozdelene" },

  // Obsluha na směně (odpovědnost — jméno u účtenky/storna)
  "kasa.obsluha.prihlasit": { cs: "Obsluha", sk: "Obsluha" },
  "kasa.obsluha.titul": { cs: "Obsluha na směně", sk: "Obsluha na zmene" },
  "kasa.obsluha.popis": { cs: "Kdo je přihlášený, ten se zapíše ke každé účtence i stornu. Majitel pak vidí, kdo co udělal.", sk: "Kto je prihlásený, ten sa zapíše ku každej účtenke aj stornu. Majiteľ potom vidí, kto čo urobil." },
  "kasa.obsluha.zadni": { cs: "Zatím žádní zaměstnanci. Přidej prvního níže.", sk: "Zatiaľ žiadni zamestnanci. Pridaj prvého nižšie." },
  "kasa.obsluha.prihlasitBtn": { cs: "Přihlásit", sk: "Prihlásiť" },
  "kasa.obsluha.odhlasit": { cs: "Odhlásit", sk: "Odhlásiť" },
  "kasa.obsluha.zadejPin": { cs: "PIN pro {n}:", sk: "PIN pre {n}:" },
  "kasa.obsluha.spatnyPin": { cs: "Špatný PIN", sk: "Nesprávny PIN" },
  "kasa.obsluha.pridat": { cs: "Přidat zaměstnance", sk: "Pridať zamestnanca" },
  "kasa.obsluha.jmenoPlaceholder": { cs: "Jméno (např. Kačka)", sk: "Meno (napr. Kačka)" },
  "kasa.obsluha.pinPlaceholder": { cs: "PIN (min. 4 číslice)", sk: "PIN (min. 4 číslice)" },
  "kasa.obsluha.zrusit": { cs: "Zrušit", sk: "Zrušiť" },
  "kasa.obsluha.ulozit": { cs: "Uložit", sk: "Uložiť" },
  "kasa.obsluha.smazatQ": { cs: "Smazat zaměstnance {n}?", sk: "Zmazať zamestnanca {n}?" },
  "kasa.obsluha.stitek": { cs: "Obsluha", sk: "Obsluha" },

  // „To samé znovu" — zopakování poslední účtenky do košíku
  "kasa.opakovatPosledni": { cs: "Poslední účet znovu", sk: "Posledný účet znova" },
  "kasa.opakovanoToast": { cs: "Poslední účet vložen do košíku", sk: "Posledný účet vložený do košíka" },

  // Rychlé založení nového zboží přímo z kasy (když kód/PLU není ve skladu)
  "kasa.nove.titul": { cs: "Založit nové zboží", sk: "Založiť nový tovar" },
  "kasa.nove.popis": { cs: "Není ve skladu. Vyplň a rovnou se přidá do skladu i na účtenku.", sk: "Nie je v sklade. Vyplň a rovno sa pridá do skladu aj na účtenku." },
  "kasa.nove.nazev": { cs: "Název zboží", sk: "Názov tovaru" },
  "kasa.nove.nazevPlaceholder": { cs: "např. Pepsi 0,5l", sk: "napr. Pepsi 0,5l" },
  "kasa.nove.cena": { cs: "Prodejní cena", sk: "Predajná cena" },
  "kasa.nove.pocet": { cs: "Počet na skladě", sk: "Počet na sklade" },
  "kasa.nove.kategorie": { cs: "Kategorie", sk: "Kategória" },
  "kasa.nove.ulozit": { cs: "Založit a přidat na účtenku", sk: "Založiť a pridať na účtenku" },
  "kasa.nove.zalozeno": { cs: "{n} založeno do skladu", sk: "{n} založené do skladu" },
  "kasa.nove.zalozitTlac": { cs: "Založit nové zboží", sk: "Založiť nový tovar" },

  // Historie prodejů
  "kasa.historieDnes": { cs: "Dnešní prodeje", sk: "Dnešné predaje" },
  "kasa.zadneProdeje": { cs: "Dnes zatím žádný prodej", sk: "Dnes zatiaľ žiadny predaj" },
  "kasa.storno": { cs: "Storno", sk: "Storno" },
  "kasa.stornoQ": { cs: "Stornovat účtenku a vrátit zboží na sklad?", sk: "Stornovať účtenku a vrátiť tovar na sklad?" },
  "kasa.polozek": { cs: "{n} položek", sk: "{n} položiek" },

  // Tisk účtenky (BETA — Bluetooth termotiskárna)
  "kasa.tiskTitul": { cs: "Vytisknout účtenku", sk: "Vytlačiť účtenku" },
  "kasa.tiskBetaHint": { cs: "Tisk účtenky — Bluetooth, WiFi/síťová tiskárna, nebo na papír (PDF). Vyber, co máš. Ve zkušebním provozu.", sk: "Tlač účtenky — Bluetooth, WiFi/sieťová tlačiareň, alebo na papier (PDF). Vyber, čo máš. V skúšobnej prevádzke." },
  "kasa.tiskNajdi": { cs: "Najít tiskárnu (Bluetooth)", sk: "Nájsť tlačiareň (Bluetooth)" },
  "kasa.tiskHledam": { cs: "Hledám tiskárny…", sk: "Hľadám tlačiarne…" },
  "kasa.tiskHledejZnovu": { cs: "Hledat znovu", sk: "Hľadať znova" },
  "kasa.tiskTisknu": { cs: "Tisknu účtenku…", sk: "Tlačím účtenku…" },
  "kasa.tiskHotovo": { cs: "Účtenka vytištěna ✓", sk: "Účtenka vytlačená ✓" },
  "kasa.tiskChyba": { cs: "Tisk se nezdařil. Zkontroluj tiskárnu.", sk: "Tlač sa nepodarila. Skontroluj tlačiareň." },
  "kasa.tiskZavrit": { cs: "Zavřít", sk: "Zavrieť" },
  // Typy tiskáren + WiFi/PDF ovládání
  "kasa.tiskTypBt": { cs: "Bluetooth", sk: "Bluetooth" },
  "kasa.tiskTypWifi": { cs: "WiFi/síť", sk: "WiFi/sieť" },
  "kasa.tiskTypPdf": { cs: "Papír (PDF)", sk: "Papier (PDF)" },
  "kasa.tiskPdfBtn": { cs: "Vytisknout na papír", sk: "Vytlačiť na papier" },
  "kasa.tiskVytisknout": { cs: "Vytisknout", sk: "Vytlačiť" },
  "kasa.tiskNajdiSit": { cs: "Vyhledat tiskárny v síti", sk: "Vyhľadať tlačiarne v sieti" },
};
