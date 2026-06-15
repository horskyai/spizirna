// Odhad kategorie nákupní položky podle názvu.
// Vrací id kategorie z CATEGORIES (ShoppingView), výchozí "ostatni".

const RULES: { category: string; keywords: string[] }[] = [
  {
    category: "ovoce-zelenina",
    keywords: [
      "brambor", "cibule", "česnek", "cesnek", "rajč", "rajc", "paprik", "okurk",
      "mrkev", "mrkv", "jablk", "banán", "banan", "pomeranč", "pomeranc", "citron",
      "citrón", "salát", "salat", "špenát", "spenat", "zelí", "zeli", "květák",
      "kvetak", "brokol", "houb", "žampion", "zampion", "hrušk", "hrozn", "jahod",
      "borůvk", "boruvk", "malin", "avokád", "avokad", "dýně", "dyne", "cuket",
      "lilek", "ředkv", "redkv", "pór", "celer", "petržel", "petrzel", "ovoce", "zelenin",
    ],
  },
  {
    category: "maso-ryby",
    keywords: [
      "maso", "kuř", "kur", "hověz", "hovez", "vepřov", "veprov", "šunk", "sunk",
      "salám", "salam", "klobás", "klobas", "párk", "park", "slanin", "ryb",
      "losos", "tuňák", "tunak", "treska", "pstruh", "krev", "mlet", "řízek", "rizek",
      "filet", "kýta", "kyta", "krkovic", "žebr", "zebr",
    ],
  },
  {
    category: "mlecne",
    keywords: [
      "mlék", "mlek", "másl", "masl", "sýr", "syr", "jogurt", "tvaroh", "smetan",
      "vejc", "vajíčk", "vajick", "podmáslí", "podmasli", "kefír", "kefir",
      "zakys", "šlehač", "slehac", "cottage", "mozzarell", "eidam", "niva", "lučin", "lucin",
    ],
  },
  {
    category: "pecivo",
    keywords: [
      "chléb", "chleb", "chleba", "rohlík", "rohlik", "housk", "baget",
      "pečiv", "peciv", "veka", "toust", "tousto", "kaiser", "croissant", "koblih",
      "buchta", "koláč", "kolac", "dort", "sušenk", "susenk", "knäck", "knack",
    ],
  },
  {
    category: "suche",
    keywords: [
      "mouk", "cukr", "sůl", "sul", "rýže", "ryze", "rýži", "ryzi", "těstovin",
      "testovin", "špaget", "spaget", "luštěn", "lusten", "čočk", "cock", "fazol",
      "hrách", "hrach", "kroup", "ovesn", "müsli", "musli", "vločk", "vlock",
      "konzerv", "olej", "ocet", "kečup", "kecup", "hořčic", "horcic", "koření",
      "koreni", "čaj", "caj", "káv", "kav", "kakao", "med", "marmelád", "marmelad",
      "džem", "dzem", "ořech", "orech", "mandl", "rozinky",
    ],
  },
  {
    category: "napoje",
    keywords: [
      "voda", "vody", "minerálk", "mineralk", "džus", "dzus", "juice", "limonád",
      "limonad", "kofol", "cola", "kola", "pivo", "víno", "vino", "sirup",
      "sodov", "tonic", "energ",
    ],
  },
  {
    category: "mrazene",
    keywords: [
      "mražen", "mrazen", "zmrzlin", "nanuk", "led ", "hranolk",
    ],
  },
];

export function guessCategory(name: string): string {
  const n = name.toLowerCase().trim();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => n.includes(kw))) {
      return rule.category;
    }
  }
  return "ostatni";
}
