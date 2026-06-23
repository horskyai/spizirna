import type { Translation } from "./dict";

// Základní texty: výběr jazyka, onboarding, navigace, obecná tlačítka.
export const core: Record<string, Translation> = {
  // ── Výběr země (úvodní obrazovka) ──
  "lang.title": { cs: "Odkud jsi?", sk: "Odkiaľ si?" },
  "lang.subtitle": { cs: "Podle země nastavíme jazyk aplikace", sk: "Podľa krajiny nastavíme jazyk aplikácie" },
  "lang.czech": { cs: "Česko", sk: "Česko" },
  "lang.slovak": { cs: "Slovensko", sk: "Slovensko" },
  "lang.czechLang": { cs: "Čeština", sk: "Čeština" },
  "lang.slovakLang": { cs: "Slovenčina", sk: "Slovenčina" },
  "lang.continue": { cs: "Pokračovat", sk: "Pokračovať" },

  // ── Onboarding (ModeSelect) ──
  "onb.next": { cs: "Další", sk: "Ďalej" },
  "onb.choosePlan": { cs: "Vybrat plán →", sk: "Vybrať plán →" },
  "onb.skipToPlan": { cs: "Přeskočit na výběr plánu", sk: "Preskočiť na výber plánu" },
  "onb.choosePlanTitle": { cs: "Vyberte svůj plán", sk: "Vyberte si svoj plán" },
  "onb.freeTrial": { cs: "Domácnost zdarma · provoz s 14denní zkušební verzí", sk: "Domácnosť zadarmo · prevádzka s 14-dňovou skúšobnou verziou" },
  "onb.free": { cs: "Zdarma", sk: "Zadarmo" },
  "onb.trial": { cs: "testovací", sk: "testovacia" },
  // Cena provozovny — měsíčně i ročně. Roční = 2 měsíce zdarma.
  "onb.provozPrice": { cs: "299 Kč", sk: "13,90 €" },
  "onb.provozPriceMonth": { cs: "/měs", sk: "/mes" },
  "onb.provozTrial": { cs: "14 dní zdarma", sk: "14 dní zadarmo" },
  "onb.provozYearly": { cs: "nebo 2 990 Kč/rok (2 měsíce zdarma)", sk: "alebo 139 €/rok (2 mesiace zadarmo)" },
  "onb.forever": { cs: "navždy", sk: "navždy" },
  "onb.select": { cs: "Vybrat", sk: "Vybrať" },
  "onb.planNote": {
    cs: "Domácnost je zdarma napořád. Provoz má 14 dní zdarma, pak 299 Kč/měs. Plán lze změnit v nastavení.",
    sk: "Domácnosť je zadarmo navždy. Prevádzka má 14 dní zadarmo, potom 13,90 €/mes. Plán je možné zmeniť v nastaveniach.",
  },
  "onb.forFamilies": { cs: "Pro rodiny", sk: "Pre rodiny" },
  "onb.forBusiness": { cs: "PRO FIRMY", sk: "PRE FIRMY" },
  "onb.restaurants": { cs: "Restaurace & bary", sk: "Reštaurácie & bary" },
  "plan.domacnost": { cs: "Domácnost", sk: "Domácnosť" },
  "plan.provoz": { cs: "Provozovna", sk: "Prevádzka" },

  // ── Navigace (TabBar) ──
  "tab.spizirna": { cs: "Spižírna", sk: "Špajza" },
  "tab.recepty": { cs: "Recepty", sk: "Recepty" },
  "tab.skenovat": { cs: "Skenovat", sk: "Skenovať" },
  "tab.nakup": { cs: "Nákup", sk: "Nákup" },
  "tab.opakujici": { cs: "Opakování", sk: "Opakovanie" },
  "tab.provoz": { cs: "Provoz", sk: "Prevádzka" },

  // ── Obecná tlačítka / akce (sdílené napříč appkou) ──
  "common.cancel": { cs: "Zrušit", sk: "Zrušiť" },
  "common.save": { cs: "Uložit", sk: "Uložiť" },
  "common.saveChanges": { cs: "Uložit změny", sk: "Uložiť zmeny" },
  "common.delete": { cs: "Smazat", sk: "Vymazať" },
  "common.edit": { cs: "Upravit", sk: "Upraviť" },
  "common.remove": { cs: "Odebrat", sk: "Odobrať" },
  "common.add": { cs: "Přidat", sk: "Pridať" },
  "common.close": { cs: "Zavřít", sk: "Zavrieť" },
  "common.back": { cs: "Zpět", sk: "Späť" },
  "common.done": { cs: "Hotovo", sk: "Hotovo" },
  "common.search": { cs: "Hledat", sk: "Hľadať" },
};
