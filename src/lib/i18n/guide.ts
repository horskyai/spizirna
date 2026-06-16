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
    cs: "Sklad a inventura pro restaurace a provozovny — s cenami, minimy a exportem.",
    sk: "Sklad a inventúra pre reštaurácie a prevádzky — s cenami, minimami a exportom.",
  },
  "guide.provoz.s1t": { cs: "Nalož sklad", sk: "Nalož sklad" },
  "guide.provoz.s1d": {
    cs: "Přidej položky — název, jednotku, minimální zásobu i cenu. Ručně, hlasem nebo skenem.",
    sk: "Pridaj položky — názov, jednotku, minimálnu zásobu aj cenu. Ručne, hlasom alebo skenom.",
  },
  "guide.provoz.s2t": { cs: "Udělej inventuru", sk: "Urob inventúru" },
  "guide.provoz.s2d": {
    cs: "Založ inventuru a u každé položky zadej skutečný stav. Co je pod minimem, se zvýrazní.",
    sk: "Založ inventúru a pri každej položke zadaj skutočný stav. Čo je pod minimom, sa zvýrazní.",
  },
  "guide.provoz.s3t": { cs: "Hodnota a export", sk: "Hodnota a export" },
  "guide.provoz.s3d": {
    cs: "Appka spočítá celkovou hodnotu skladu. Inventuru vyexportuješ do PDF nebo CSV (Excel).",
    sk: "Appka spočíta celkovú hodnotu skladu. Inventúru vyexportuješ do PDF alebo CSV (Excel).",
  },
};
