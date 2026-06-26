import type { Translation } from "./dict";

// Překlady pro Spižírnu (PantryView).
export const pantry: Record<string, Translation> = {
  // Umístění / filtry
  "pantry.location.lednice": { cs: "Lednice", sk: "Chladnička" },
  "pantry.location.mrazak": { cs: "Mrazák", sk: "Mraznička" },
  "pantry.location.spiz": { cs: "Spíž", sk: "Špajza" },
  "pantry.location.linka": { cs: "Skříňka", sk: "Skrinka" },
  "pantry.filter.vse": { cs: "Vše", sk: "Všetko" },

  // Expirační badge
  "pantry.expiry.expired": { cs: "Prošlé", sk: "Prešlé" },
  "pantry.expiry.today": { cs: "Spotřebujte dnes", sk: "Spotrebujte dnes" },
  "pantry.expiry.tomorrow": { cs: "Spotřebujte zítra", sk: "Spotrebujte zajtra" },
  "pantry.expiry.days": { cs: "Spotřebujte do {n} dní", sk: "Spotrebujte do {n} dní" },

  // Edit modal
  "pantry.edit.title": { cs: "Upravit položku", sk: "Upraviť položku" },
  "pantry.edit.quantity": { cs: "Množství", sk: "Množstvo" },
  "pantry.edit.unit": { cs: "Jednotka", sk: "Jednotka" },
  "pantry.edit.location": { cs: "Umístění", sk: "Umiestnenie" },
  "pantry.edit.expiry": { cs: "Datum expirace", sk: "Dátum spotreby" },

  // Karta položky
  "pantry.item.consumeOne": { cs: "Spotřebovat 1", sk: "Spotrebovať 1" },
  "pantry.item.price": { cs: "Cena", sk: "Cena" },
  "pantry.item.expires": { cs: "Expiruje", sk: "Spotrebovať do" },

  // Prázdný stav
  "pantry.empty.title": { cs: "Spižírna je prázdná", sk: "Špajza je prázdna" },
  "pantry.empty.subtitle": {
    cs: "Naskenujte čárový kód z obalu potravin nebo přidejte produkty ručně.",
    sk: "Naskenujte čiarový kód z obalu potravín alebo pridajte produkty ručne.",
  },
  "pantry.empty.scanFirst": { cs: "Naskenovat první produkt", sk: "Naskenovať prvý produkt" },
  "pantry.empty.addManual": { cs: "Přidat ručně", sk: "Pridať ručne" },
  "pantry.empty.tip": {
    cs: "Tip: Naskenujte kód ze zadní strany obalu. Většina potravin se najde automaticky.",
    sk: "Tip: Naskenujte kód zo zadnej strany obalu. Väčšina potravín sa nájde automaticky.",
  },

  // Freemium limit (jen domácnost)
  "pantry.limit.nearTitle": { cs: "Blížíš se limitu", sk: "Blížiš sa limitu" },
  "pantry.limit.near": {
    cs: "Máš {n} z {max} položek zdarma. Po překročení tě požádáme o předplatné za 149 Kč/měs.",
    sk: "Máš {n} z {max} položiek zadarmo. Po prekročení ťa požiadame o predplatné za 6,90 €/mes.",
  },
  "pantry.limit.overTitle": { cs: "Překročil jsi limit zdarma", sk: "Prekročil si limit zadarmo" },
  "pantry.limit.over": {
    cs: "Máš {n} položek — bezplatně jich je {max}. Odemkni neomezenou spižírnu za 149 Kč/měs.",
    sk: "Máš {n} položiek — zadarmo ich je {max}. Odomkni neobmedzenú špajzu za 6,90 €/mes.",
  },
  "pantry.limit.upgrade": { cs: "Odemknout neomezeně", sk: "Odomknúť neobmedzene" },
  "pantry.limit.discount": { cs: "🎁 Máš odemčený roční plán za {n} Kč (běžně 1 490 Kč)", sk: "🎁 Máš odomknutý ročný plán za {n} € (bežne 59,90 €)" },

  // Hledání a seznam
  "pantry.search.placeholder": { cs: "Hledat potraviny...", sk: "Hľadať potraviny..." },
  "pantry.list.empty": { cs: "Žádné produkty v této kategorii", sk: "Žiadne produkty v tejto kategórii" },

  // Rychlý filtr z karet „Dnešní přehled"
  "pantry.quickFilter.expiring": { cs: "Zobrazuji jen potraviny, které brzy expirují", sk: "Zobrazujem len potraviny, ktoré čoskoro expirujú" },
  "pantry.quickFilter.lowStock": { cs: "Zobrazuji jen potraviny, které docházejí", sk: "Zobrazujem len potraviny, ktoré dochádzajú" },
  "pantry.quickFilter.clear": { cs: "Zrušit", sk: "Zrušiť" },

  // Dnešní přehled (karta navrch spížírny)
  "pantry.summary.title": { cs: "Dnešní přehled", sk: "Dnešný prehľad" },
  "pantry.summary.allClear": {
    cs: "Vše v pořádku — nic nekončí ani nedochází 🎉",
    sk: "Všetko v poriadku — nič nekončí ani nedochádza 🎉",
  },
  "pantry.summary.expiring": { cs: "Brzy expiruje", sk: "Čoskoro expiruje" },
  "pantry.summary.expiringItems": { cs: "{n} potravin končí do 3 dnů", sk: "{n} potravín končí do 3 dní" },
  "pantry.summary.expiringOne": { cs: "1 potravina končí do 3 dnů", sk: "1 potravina končí do 3 dní" },
  "pantry.summary.lowStock": { cs: "Dochází", sk: "Dochádza" },
  "pantry.summary.lowStockItems": { cs: "{n} potravin už skoro došlo", sk: "{n} potravín už takmer došlo" },
  "pantry.summary.lowStockOne": { cs: "1 potravina už skoro došla", sk: "1 potravina už takmer došla" },
  "pantry.summary.shopping": { cs: "K nákupu", sk: "Na nákup" },
  "pantry.summary.shoppingItems": { cs: "{n} položek na nákupním seznamu", sk: "{n} položiek na nákupnom zozname" },
  "pantry.summary.shoppingOne": { cs: "1 položka na nákupním seznamu", sk: "1 položka na nákupnom zozname" },
  "pantry.summary.recurring": { cs: "Čas doplnit", sk: "Čas doplniť" },
  "pantry.summary.recurringItems": { cs: "{n} pravidelných nákupů je na řadě", sk: "{n} pravidelných nákupov je na rade" },
  "pantry.summary.recurringOne": { cs: "1 pravidelný nákup je na řadě", sk: "1 pravidelný nákup je na rade" },
};
