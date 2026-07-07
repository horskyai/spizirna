import type { Translation } from "./dict";

// Příručky k jednotlivým oknům aplikace. Každé okno má titulek (guide.<okno>.title),
// krátký podtitulek (guide.<okno>.intro) a sadu kroků (guide.<okno>.s1t/s1d ...).
// Zobrazuje je komponenta ScreenGuide — poprvé sama, pak na vyžádání přes "?".
export const guide: Record<string, Translation> = {
  "guide.understood": { cs: "Rozumím, jdeme na to", sk: "Rozumiem, ideme na to" },

  // ── Spižírna (sklad doma) ──
  "guide.pantry.title": { cs: "Spižírna", sk: "Špajza" },
  "guide.pantry.intro": {
    cs: "Tvůj domácí sklad potravin — přehled, co máš doma a čemu končí trvanlivost.",
    sk: "Tvoj domáci sklad potravín — prehľad, čo máš doma a čomu končí trvanlivosť.",
  },
  "guide.pantry.s1t": { cs: "Přidávej potraviny", sk: "Pridávaj potraviny" },
  "guide.pantry.s1d": {
    cs: "Naskenuj čárový kód, zadej ručně nebo nadiktuj hlasem. Vše se objeví ve skladu.",
    sk: "Naskenuj čiarový kód, zadaj ručne alebo nadiktuj hlasom. Všetko sa objaví v sklade.",
  },
  "guide.pantry.s2t": { cs: "Hlídá trvanlivost", sk: "Stráži trvanlivosť" },
  "guide.pantry.s2d": {
    cs: "Potraviny, kterým brzy končí spotřeba, se zvýrazní nahoře — ať nic nevyhodíš zbytečně.",
    sk: "Potraviny, ktorým čoskoro končí spotreba, sa zvýraznia hore — aby si nič nevyhodil zbytočne.",
  },
  "guide.pantry.s3t": { cs: "Klepni na položku", sk: "Klepni na položku" },
  "guide.pantry.s3d": {
    cs: "Uprav množství, datum spotřeby nebo potravinu odeber, když ji spotřebuješ.",
    sk: "Uprav množstvo, dátum spotreby alebo potravinu odober, keď ju spotrebuješ.",
  },
  "guide.pantry.s4t": { cs: "Statistiky & úspory", sk: "Štatistiky & úspory" },
  "guide.pantry.s4d": {
    cs: "V Nastavení najdeš statistiky: hodnotu spížírny, kolik jsi ušetřil i vyhodil v Kč, a svůj herní pokrok (úrovně a odznaky).",
    sk: "V Nastaveniach nájdeš štatistiky: hodnotu špajze, koľko si ušetril aj vyhodil v €, a svoj herný pokrok (úrovne a odznaky).",
  },

  // ── Deník jídla (kalorie) — jen když je zapnuté sledování kalorií ──
  "guide.jidlo.title": { cs: "Deník jídla", sk: "Denník jedla" },
  "guide.jidlo.intro": {
    cs: "Zapisuj, co jíš, a sleduj kalorie a živiny. Zapíná se v Nastavení („Sledování kalorií“).",
    sk: "Zapisuj, čo ješ, a sleduj kalórie a živiny. Zapína sa v Nastaveniach („Sledovanie kalórií“).",
  },
  "guide.jidlo.s1t": { cs: "Zapiš, co jíš", sk: "Zapíš, čo ješ" },
  "guide.jidlo.s1d": {
    cs: "Přidej jídlo naskenováním, hlasem nebo ručně. Aplikace dopočítá kalorie a živiny z databáze.",
    sk: "Pridaj jedlo naskenovaním, hlasom alebo ručne. Aplikácia dopočíta kalórie a živiny z databázy.",
  },
  "guide.jidlo.s2t": { cs: "Denní cíl", sk: "Denný cieľ" },
  "guide.jidlo.s2d": {
    cs: "Nastav si denní cíl kalorií a bílkovin. Vidíš, kolik jsi snědl a kolik ještě zbývá.",
    sk: "Nastav si denný cieľ kalórií a bielkovín. Vidíš, koľko si zjedol a koľko ešte zostáva.",
  },
  "guide.jidlo.s3t": { cs: "Z receptu i spížírny", sk: "Z receptu aj špajze" },
  "guide.jidlo.s3d": {
    cs: "Uvařený recept přidáš do deníku jedním klepnutím. Sledování kalorií můžeš kdykoli vypnout v Nastavení.",
    sk: "Uvarený recept pridáš do denníka jedným klepnutím. Sledovanie kalórií môžeš kedykoľvek vypnúť v Nastaveniach.",
  },

  // ── Skenovat ──
  "guide.scan.title": { cs: "Skenování", sk: "Skenovanie" },
  "guide.scan.intro": {
    cs: "Namiř foťák na čárový kód a produkt se sám dohledá a přidá.",
    sk: "Namier foťák na čiarový kód a produkt sa sám dohľadá a pridá.",
  },
  "guide.scan.s1t": { cs: "Namiř na kód", sk: "Namier na kód" },
  "guide.scan.s1d": {
    cs: "Drž telefon klidně nad čárovým kódem (EAN). Sken proběhne automaticky.",
    sk: "Drž telefón pokojne nad čiarovým kódom (EAN). Sken prebehne automaticky.",
  },
  "guide.scan.s2t": { cs: "Nenašel se?", sk: "Nenašiel sa?" },
  "guide.scan.s2d": {
    cs: "Zadej kód ručně nebo přidej produkt celý ručně — uloží se do databáze.",
    sk: "Zadaj kód ručne alebo pridaj produkt celý ručne — uloží sa do databázy.",
  },
  "guide.scan.s3t": { cs: "Pomáháš ostatním", sk: "Pomáhaš ostatným" },
  "guide.scan.s3d": {
    cs: "Když dobrovolně doplníš chybějící produkt, pomůžeš zlepšit databázi pro všechny.",
    sk: "Keď dobrovoľne doplníš chýbajúci produkt, pomôžeš zlepšiť databázu pre všetkých.",
  },

  // ── Recepty ──
  "guide.recipes.title": { cs: "Recepty", sk: "Recepty" },
  "guide.recipes.intro": {
    cs: "Stovky receptů — najdi inspiraci podle toho, co máš doma.",
    sk: "Stovky receptov — nájdi inšpiráciu podľa toho, čo máš doma.",
  },
  "guide.recipes.s1t": { cs: "Hledej a filtruj", sk: "Hľadaj a filtruj" },
  "guide.recipes.s1d": {
    cs: "Procházej recepty, hledej podle názvu nebo si zobraz ty, na které máš suroviny.",
    sk: "Prechádzaj recepty, hľadaj podľa názvu alebo si zobraz tie, na ktoré máš suroviny.",
  },
  "guide.recipes.s2t": { cs: "Přidej vlastní", sk: "Pridaj vlastný" },
  "guide.recipes.s2d": {
    cs: "Vlož svůj recept — suroviny, postup i počet porcí. Najdeš ho pak mezi ostatními.",
    sk: "Vlož svoj recept — suroviny, postup aj počet porcií. Nájdeš ho potom medzi ostatnými.",
  },
  "guide.recipes.s3t": { cs: "Chybí suroviny?", sk: "Chýbajú suroviny?" },
  "guide.recipes.s3d": {
    cs: "Co ti k receptu chybí, přidáš jedním klepnutím rovnou do nákupního seznamu.",
    sk: "Čo ti k receptu chýba, pridáš jedným klepnutím rovno do nákupného zoznamu.",
  },

  // ── Nákup ──
  "guide.shopping.title": { cs: "Nákupní seznam", sk: "Nákupný zoznam" },
  "guide.shopping.intro": {
    cs: "Seznam toho, co potřebuješ koupit — přidáš ručně i hlasem.",
    sk: "Zoznam toho, čo potrebuješ kúpiť — pridáš ručne aj hlasom.",
  },
  "guide.shopping.s1t": { cs: "Diktuj hlasem", sk: "Diktuj hlasom" },
  "guide.shopping.s1d": {
    cs: "Řekni např. „dvě kila brambor, litr mléka\" a položky se rozpoznají a přidají naráz.",
    sk: "Povedz napr. „dve kilá zemiakov, liter mlieka\" a položky sa rozpoznajú a pridajú naraz.",
  },
  "guide.shopping.s2t": { cs: "Odškrtávej v obchodě", sk: "Odškrtávaj v obchode" },
  "guide.shopping.s2d": {
    cs: "Co hodíš do košíku, odškrtni klepnutím. Seznam se přehledně rozdělí na koupené a zbývající.",
    sk: "Čo hodíš do košíka, odškrtni klepnutím. Zoznam sa prehľadne rozdelí na kúpené a zostávajúce.",
  },
  "guide.shopping.s3t": { cs: "Přesun do spižírny", sk: "Presun do špajze" },
  "guide.shopping.s3d": {
    cs: "Po nákupu můžeš koupené položky rovnou přesunout do spižírny.",
    sk: "Po nákupe môžeš kúpené položky rovno presunúť do špajze.",
  },

  // ── Opakování ──
  "guide.recurring.title": { cs: "Opakované nákupy", sk: "Opakované nákupy" },
  "guide.recurring.intro": {
    cs: "Věci, co kupuješ pořád dokola — ať na ně nezapomeneš.",
    sk: "Veci, čo kupuješ stále dokola — aby si na ne nezabudol.",
  },
  "guide.recurring.s1t": { cs: "Ulož pravidelné položky", sk: "Ulož pravidelné položky" },
  "guide.recurring.s1d": {
    cs: "Mléko, pečivo, prací prášek… Vytvoř si seznam toho, co kupuješ opakovaně.",
    sk: "Mlieko, pečivo, prací prášok… Vytvor si zoznam toho, čo kupuješ opakovane.",
  },
  "guide.recurring.s2t": { cs: "Přidej do nákupu", sk: "Pridaj do nákupu" },
  "guide.recurring.s2d": {
    cs: "Jedním klepnutím hodíš pravidelnou položku do nákupního seznamu, když dochází.",
    sk: "Jedným klepnutím hodíš pravidelnú položku do nákupného zoznamu, keď dochádza.",
  },

  // ── Provozovna (inventura) ──
  "guide.provoz.title": { cs: "Provozovna", sk: "Prevádzka" },
  "guide.provoz.intro": {
    cs: "Kasa, sklad, inventura a účetnictví na jednom místě — pro obchod i restauraci. Dole přepínáš Kasa · Sklad · Inventura · Účto · Víc.",
    sk: "Pokladňa, sklad, inventúra a účtovníctvo na jednom mieste — pre obchod aj reštauráciu. Dole prepínáš Pokladňa · Sklad · Inventúra · Účto · Viac.",
  },
  "guide.provoz.s1t": { cs: "Kasa — prodej", sk: "Pokladňa — predaj" },
  "guide.provoz.s1d": {
    cs: "Klepni na zboží/jídlo → dole košík → Hotově nebo Kartou. Prodej se automaticky odečte ze skladu. U hotovosti zadáš „přijato\" a spočítá se, kolik vrátit.",
    sk: "Klepni na tovar/jedlo → dole košík → Hotovo alebo Kartou. Predaj sa automaticky odčíta zo skladu. Pri hotovosti zadáš „prijaté\" a spočíta sa, koľko vrátiť.",
  },
  "guide.provoz.s2t": { cs: "Sklad & denní porce", sk: "Sklad & denné porcie" },
  "guide.provoz.s2d": {
    cs: "Obchod: naskladníš zboží a rovnou ho prodáváš. Restaurace: ráno navaříš porce (guláš 20×) a kasa hlídá, kolik zbývá. Suroviny lze skrýt z prodeje.",
    sk: "Obchod: naskladníš tovar a rovno ho predávaš. Reštaurácia: ráno navaríš porcie (guláš 20×) a pokladňa stráži, koľko zostáva. Suroviny možno skryť z predaja.",
  },
  "guide.provoz.s3t": { cs: "Inventura", sk: "Inventúra" },
  "guide.provoz.s3d": {
    cs: "Založ inventuru, zadej skutečné stavy — appka porovná s tím, co kasa napočítala, a ukáže manka/přebytky. Export do PDF i Excelu.",
    sk: "Založ inventúru, zadaj skutočné stavy — appka porovná s tým, čo pokladňa napočítala, a ukáže manká/prebytky. Export do PDF aj Excelu.",
  },
  "guide.provoz.s4t": { cs: "Účetnictví", sk: "Účtovníctvo" },
  "guide.provoz.s4d": {
    cs: "Uzávěrka za den/týden/měsíc/rok i vlastní období: tržby hotově/kartou, zisk, marže, rozpad DPH a nejprodávanější zboží. Export pro účetní.",
    sk: "Uzávierka za deň/týždeň/mesiac/rok aj vlastné obdobie: tržby hotovo/kartou, zisk, marža, rozpad DPH a najpredávanejšie. Export pre účtovníka.",
  },
  "guide.provoz.s5t": { cs: "Režim zaměstnance", sk: "Režim zamestnanca" },
  "guide.provoz.s5d": {
    cs: "V Nastavení zapneš PIN. Zaměstnanec pak vidí jen Kasu, ceny a účetnictví jsou skryté. Majitel odemkne PINem.",
    sk: "V Nastaveniach zapneš PIN. Zamestnanec potom vidí len Pokladňu, ceny a účtovníctvo sú skryté. Majiteľ odomkne PINom.",
  },

  // ── Sklad v provozu (tab Spižírna ukazuje sklad) ──
  "guide.sklad.title": { cs: "Sklad", sk: "Sklad" },
  "guide.sklad.intro": {
    cs: "Rychlý přehled toho, co máš ve skladu provozovny.",
    sk: "Rýchly prehľad toho, čo máš v sklade prevádzky.",
  },
  "guide.sklad.s1t": { cs: "Přehled skladu", sk: "Prehľad skladu" },
  "guide.sklad.s1d": {
    cs: "Vidíš všechny položky skladu s množstvím, minimem a cenou. Co je pod minimem, se zvýrazní.",
    sk: "Vidíš všetky položky skladu s množstvom, minimom a cenou. Čo je pod minimom, sa zvýrazní.",
  },
  "guide.sklad.s2t": { cs: "Přidávej položky", sk: "Pridávaj položky" },
  "guide.sklad.s2d": {
    cs: "Nové položky přidáš naskenováním, ručně nebo hlasem v sekci Provoz.",
    sk: "Nové položky pridáš naskenovaním, ručne alebo hlasom v sekcii Prevádzka.",
  },
  "guide.sklad.s3t": { cs: "Inventura", sk: "Inventúra" },
  "guide.sklad.s3d": {
    cs: "Pro plnou inventuru a export přejdi do sekce Provoz.",
    sk: "Pre plnú inventúru a export prejdi do sekcie Prevádzka.",
  },
};
