import type { Translation } from "./dict";

// Základní texty: výběr jazyka, onboarding, navigace, obecná tlačítka.
export const core: Record<string, Translation> = {
  // ── Výběr jazyka (úvodní obrazovka) ──
  "lang.title": { cs: "Vyber si jazyk", sk: "Vyber si jazyk" },
  "lang.subtitle": { cs: "Language · Jazyk", sk: "Language · Jazyk" },
  "lang.czech": { cs: "Čeština", sk: "Čeština" },
  "lang.slovak": { cs: "Slovenčina", sk: "Slovenčina" },
  "lang.continue": { cs: "Pokračovat", sk: "Pokračovať" },

  // ── Onboarding (ModeSelect) ──
  "onb.next": { cs: "Další", sk: "Ďalej" },
  "onb.choosePlan": { cs: "Vybrat plán →", sk: "Vybrať plán →" },
  "onb.skipToPlan": { cs: "Přeskočit na výběr plánu", sk: "Preskočiť na výber plánu" },
  "onb.choosePlanTitle": { cs: "Vyberte svůj plán", sk: "Vyberte si svoj plán" },
  "onb.freeTrial": { cs: "Testovací verze · Zdarma", sk: "Testovacia verzia · Zadarmo" },
  "onb.free": { cs: "Zdarma", sk: "Zadarmo" },
  "onb.trial": { cs: "testovací", sk: "testovacia" },
  "onb.select": { cs: "Vybrat", sk: "Vybrať" },
  "onb.planNote": {
    cs: "Testovací verze je zdarma. Plán lze změnit v nastavení.",
    sk: "Testovacia verzia je zadarmo. Plán je možné zmeniť v nastaveniach.",
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
