// Odhad kategorie nákupní položky podle názvu.
//
// V appce existují DVA systémy kategorií:
//   • ShoppingView  → 8 ID kategorií ("maso-ryby", "mlecne", … "ostatni")
//   • VoiceReviewModal → 14 názvů ("Maso", "Ryby", "Mléčné výrobky", … "Jiné")
//
// Aby se pravidla nepsala dvakrát, držíme jeden seznam s klíčovými slovy a
// u každého pravidla obě cílové kategorie. guessCategory() vrací ID (pro
// ShoppingView), guessVoiceCategory() vrací název (pro modal).
//
// Pravidla se vyhodnocují shora dolů — první shoda vyhrává, proto dávej
// specifičtější kategorie (Ryby) PŘED obecnější (Maso).

interface Rule {
  id: string; // kategorie pro ShoppingView
  name: string; // kategorie pro VoiceReviewModal
  keywords: string[];
}

const RULES: Rule[] = [
  {
    id: "maso-ryby",
    name: "Ryby",
    keywords: [
      "ryb", "losos", "tuňák", "tunak", "treska", "pstruh", "kapr", "makrel",
      "sleď", "sled", "sardin", "krevet", "krev", "filé", "file", "filet",
      "rybí prst", "rybi prst", "surimi", "kaviár", "kaviar",
    ],
  },
  {
    id: "maso-ryby",
    name: "Maso",
    keywords: [
      "maso", "kuř", "kur", "drůbež", "drubez", "kuřecí prs", "kureci prs",
      "prsa", "prsou", "stehn", "křídl", "kridl", "hověz", "hovez", "vepřov",
      "veprov", "šunk", "sunk", "salám", "salam", "klobás", "klobas", "párk",
      "park", "slanin", "mlet", "řízek", "rizek", "kýta", "kyta", "krkovic",
      "žebr", "zebr", "krůt", "krut", "kachn", "husa", "husy", "králík",
      "kralik", "jehněč", "jehnec", "guláš", "gulas", "paštik", "pastik",
      "špek", "spek", "bůček", "bucek",
    ],
  },
  {
    id: "mlecne",
    name: "Mléčné výrobky",
    keywords: [
      "mlék", "mlek", "másl", "masl", "sýr", "syr", "jogurt", "tvaroh",
      "smetan", "vejc", "vajíčk", "vajick", "vajec", "podmáslí", "podmasli",
      "kefír", "kefir", "zakys", "šlehač", "slehac", "cottage", "mozzarell",
      "eidam", "niva", "lučin", "lucin", "hermelín", "hermelin", "parmazán",
      "parmazan", "gouda", "ementál", "emental", "balkán", "balkan", "ricotta",
      "mascarpone", "tavený sýr", "taveny syr",
    ],
  },
  {
    id: "ovoce-zelenina",
    name: "Zelenina",
    keywords: [
      "brambor", "cibule", "cibul", "česnek", "cesnek", "rajč", "rajc",
      "paprik", "okurk", "mrkev", "mrkv", "salát", "salat", "špenát",
      "spenat", "zelí", "zeli", "květák", "kvetak", "brokol", "houb",
      "žampion", "zampion", "avokád", "avokad", "dýně", "dyne", "cuket",
      "lilek", "ředkv", "redkv", "pór", "celer", "petržel", "petrzel",
      "fazolk", "kukuřic", "kukuric", "rukol", "kapust", "řepa", "repa",
      "chřest", "chrest", "zelenin",
    ],
  },
  {
    id: "ovoce-zelenina",
    name: "Ovoce",
    keywords: [
      "jablk", "banán", "banan", "pomeranč", "pomeranc", "citron", "citrón",
      "hrušk", "hrozn", "jahod", "borůvk", "boruvk", "malin", "ostružin",
      "meloun", "ananas", "mango", "kiwi", "broskv", "meruňk", "merunk",
      "švestk", "svestk", "třešn", "tresn", "višn", "visn", "mandarink",
      "grep", "grapefruit", "datle", "fík", "fik", "ovoce",
    ],
  },
  {
    id: "pecivo",
    name: "Pekárenské výrobky",
    keywords: [
      "chléb", "chleb", "chleba", "rohlík", "rohlik", "housk", "baget",
      "pečiv", "peciv", "veka", "toust", "tousto", "kaiser", "croissant",
      "koblih", "buchta", "koláč", "kolac", "dort", "loupák", "loupak",
      "vánočk", "vanock", "mazanec", "preclík", "preclik",
    ],
  },
  {
    id: "suche",
    name: "Luštěniny",
    keywords: [
      "luštěn", "lusten", "čočk", "cock", "fazol", "hrách", "hrach", "cizrn",
      "sój", "soj", "tofu",
    ],
  },
  {
    id: "suche",
    name: "Obiloviny",
    keywords: [
      "mouk", "rýže", "ryze", "rýži", "ryzi", "těstovin", "testovin",
      "špaget", "spaget", "kroup", "ovesn", "müsli", "musli", "vločk",
      "vlock", "kuskus", "bulgur", "quinoa", "kinoa", "pohank", "krup",
      "obilovin", "cereál", "cereal",
    ],
  },
  {
    id: "napoje",
    name: "Nápoje",
    keywords: [
      "voda", "vody", "minerálk", "mineralk", "džus", "dzus", "juice",
      "limonád", "limonad", "kofol", "cola", "kola", "pivo", "víno", "vino",
      "sirup", "sodov", "tonic", "energ", "čaj", "caj", "káv", "kav",
      "kakao", "mošt", "most", "nápoj", "napoj",
    ],
  },
  {
    // Oleje a tuky — vlastní kategorie (musí být PŘED "Omáčky a koření",
    // aby "olej" chytlo sem a ne do koření).
    id: "oleje-tuky",
    name: "Oleje a tuky",
    keywords: [
      "olej", "olivov", "sádlo", "sadlo", "ghí", "ghi", "tuk ", "ztužen",
      "ztuzen", "margarín", "margarin", "rama", "hera",
    ],
  },
  {
    id: "suche",
    name: "Omáčky a koření",
    keywords: [
      "sůl", "sul", "pepř", "pepr", "koření", "koreni", "ocet",
      "kečup", "kecup", "hořčic", "horcic", "majonéz", "majonez", "omáčk",
      "omack", "dresink", "bujón", "bujon", "vývar", "vyvar", "skořic",
      "skoric", "vanil", "kmín", "kmin", "bobkov", "tymián", "tymian",
      "bazalk", "oregano", "kari", "kurkum", "zázvor", "zazvor", "worcester",
      "tatark",
    ],
  },
  {
    id: "suche",
    name: "Sladkosti",
    keywords: [
      "cukr", "med", "marmelád", "marmelad", "džem", "dzem", "čokolád",
      "cokolad", "sušenk", "susenk", "bonbón", "bonbon", "oplatk", "tyčink",
      "tycink", "lízátk", "lizatk", "želé", "zele", "nutel", "perník",
      "pernik", "piškot", "piskot", "ořech", "orech", "mandl", "rozinky",
    ],
  },
  {
    id: "mrazene",
    name: "Mražené",
    keywords: [
      "mražen", "mrazen", "zmrzlin", "nanuk", "hranolk", "led ",
    ],
  },
  {
    id: "suche",
    name: "Konzervy",
    keywords: [
      "konzerv", "kompot", "nakládan", "nakladan", "sterilovan", "zavařen",
      "zavaren", "lečo", "leco", "protlak",
    ],
  },
];

function matchRule(name: string): Rule | null {
  const n = name.toLowerCase().trim();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => n.includes(kw))) return rule;
  }
  return null;
}

// Pro ShoppingView — vrací ID kategorie, výchozí "ostatni".
export function guessCategory(name: string): string {
  return matchRule(name)?.id ?? "ostatni";
}

// Pro VoiceReviewModal — vrací název kategorie, výchozí "Jiné".
export function guessVoiceCategory(name: string): string {
  return matchRule(name)?.name ?? "Jiné";
}
