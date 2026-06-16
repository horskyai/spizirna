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

  // Hledání a seznam
  "pantry.search.placeholder": { cs: "Hledat potraviny...", sk: "Hľadať potraviny..." },
  "pantry.list.empty": { cs: "Žádné produkty v této kategorii", sk: "Žiadne produkty v tejto kategórii" },
};
