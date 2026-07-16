import type { Translation } from "./dict";

// Překlady pro Nákup (ShoppingView).
export const shopping: Record<string, Translation> = {
  // Kategorie
  "shopping.cat.ovoce-zelenina": { cs: "Ovoce a zelenina", sk: "Ovocie a zelenina" },
  "shopping.cat.maso-ryby": { cs: "Maso a ryby", sk: "Mäso a ryby" },
  "shopping.cat.mlecne": { cs: "Mléčné výrobky", sk: "Mliečne výrobky" },
  "shopping.cat.pecivo": { cs: "Pečivo", sk: "Pečivo" },
  "shopping.cat.suche": { cs: "Suché potraviny", sk: "Suché potraviny" },
  "shopping.cat.oleje-tuky": { cs: "Oleje a tuky", sk: "Oleje a tuky" },
  "shopping.cat.napoje": { cs: "Nápoje", sk: "Nápoje" },
  "shopping.cat.mrazene": { cs: "Mražené", sk: "Mrazené" },
  "shopping.cat.ostatni": { cs: "Ostatní", sk: "Ostatné" },

  // Modaly (přidat / upravit položku)
  "shopping.add.title": { cs: "Přidat položku", sk: "Pridať položku" },
  "shopping.edit.title": { cs: "Upravit položku", sk: "Upraviť položku" },
  "shopping.namePlaceholder": { cs: "Název produktu...", sk: "Názov produktu..." },
  "shopping.category": { cs: "KATEGORIE", sk: "KATEGÓRIA" },
  "shopping.voiceLabel": { cs: "Nadiktovat více položek", sk: "Nadiktovať viac položiek" },

  // Hlasové zadávání
  "shopping.voice.unsupported": {
    cs: "Prohlížeč nepodporuje hlasové zadávání. Zkuste Chrome nebo Safari.",
    sk: "Prehliadač nepodporuje hlasové zadávanie. Skúste Chrome alebo Safari.",
  },
  "shopping.voice.notUnderstood": { cs: "Nerozuměl jsem. Zkuste to znovu.", sk: "Nerozumel som. Skúste to znova." },
  "shopping.voice.notAllowed": { cs: "Přístup k mikrofonu byl odmítnut.", sk: "Prístup k mikrofónu bol odmietnutý." },
  "shopping.voice.nothingHeard": { cs: "Nic jsem neslyšel. Zkuste znovu.", sk: "Nič som nepočul. Skúste znova." },
  "shopping.voice.listening": {
    cs: "Poslouchám… řekněte např. „2 kila brambor a mléko\"",
    sk: "Počúvam… povedzte napr. „2 kilá zemiakov a mlieko\"",
  },
  "shopping.voice.aria": { cs: "Přidat hlasem", sk: "Pridať hlasom" },

  // Chytré návrhy
  "shopping.suggest.title": { cs: "Chytré návrhy ({n})", sk: "Šikovné návrhy ({n})" },
  "shopping.suggest.outOfStock": { cs: "Zásoby došly", sk: "Zásoby sa minuli" },
  "shopping.suggest.soon": { cs: "Brzy dojde", sk: "Čoskoro sa minie" },
  "shopping.suggest.remaining": { cs: "Zbývá jen {q} {u}", sk: "Zostáva len {q} {u}" },
  "shopping.suggest.willRunOut": { cs: "Dojde za ~{n} dní", sk: "Dôjde za ~{n} dní" },
  "shopping.suggest.willRunOutToday": { cs: "Dnes dojde", sk: "Dnes dôjde" },
  "shopping.suggest.missingForRecipes": { cs: "Chybí k receptům", sk: "Chýba k receptom" },
  "shopping.suggest.added": { cs: "✓ Přidáno", sk: "✓ Pridané" },
  "shopping.suggest.addAll": { cs: "+ Přidat vše ({n} položek)", sk: "+ Pridať všetko ({n} položiek)" },

  // Toasty
  "shopping.toast.toPantry": { cs: "{name} přidáno do spižírny", sk: "{name} pridané do špajze" },
  "shopping.toast.toSklad": { cs: "{name} naskladněno", sk: "{name} naskladnené" },
  "shopping.toast.oneToList": { cs: "{name} přidáno na seznam", sk: "{name} pridané na zoznam" },
  "shopping.toast.manyToList": { cs: "{n} položky přidány na seznam", sk: "{n} položky pridané na zoznam" },

  // Prázdný stav
  "shopping.empty.title": { cs: "Seznam je prázdný", sk: "Zoznam je prázdny" },
  "shopping.empty.subtitle": {
    cs: "Přidejte položky ručně nebo je importujte z receptů.",
    sk: "Pridajte položky ručne alebo ich importujte z receptov.",
  },
  "shopping.empty.tip": {
    cs: "Tip: Po zaškrtnutí položky se automaticky přidá do spižírny.",
    sk: "Tip: Po zaškrtnutí položky sa automaticky pridá do špajze.",
  },

  // Hledání a přepínač
  "shopping.searchPlaceholder": { cs: "Hledat v seznamu...", sk: "Hľadať v zozname..." },
  "shopping.view.all": { cs: "Vše", sk: "Všetko" },
  "shopping.view.category": { cs: "Kategorie", sk: "Kategória" },

  // Seznam
  "shopping.remaining": { cs: "{n} položek zbývá", sk: "{n} položiek zostáva" },
  "shopping.removeChecked": { cs: "Odebrat hotové ({n})", sk: "Odobrať hotové ({n})" },
  "shopping.addedManually": { cs: "Přidáno ručně", sk: "Pridané ručne" },
  "shopping.editHint": { cs: "upravit", sk: "upraviť" },
  "shopping.done": { cs: "Hotovo ({n})", sk: "Hotovo ({n})" },

  // Tlačítka a sdílení
  "shopping.saveChanges": { cs: "Uložit změny", sk: "Uložiť zmeny" },
  "shopping.share": { cs: "Sdílet", sk: "Zdieľať" },
  "shopping.clearAll": { cs: "Vymazat celý seznam", sk: "Vymazať celý zoznam" },
  "shopping.shareTitle": { cs: "Nákupní seznam", sk: "Nákupný zoznam" },
  "shopping.shareHeader": { cs: "🛒 Nákupní seznam ze Spižírny", sk: "🛒 Nákupný zoznam zo Špajze" },
};
