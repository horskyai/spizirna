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
  // Domácnost — freemium: zdarma do 20 položek, pak měsíčně/ročně.
  "onb.domFreeLimit": { cs: "do 20 položek", sk: "do 20 položiek" },
  "onb.domPaid": { cs: "poté 149 Kč/měs", sk: "potom 6,90 €/mes" },
  "onb.domYearly": { cs: "nebo 1 490 Kč/rok", sk: "alebo 59,90 €/rok" },
  // Cena provozovny — měsíčně i ročně. Roční = 2 měsíce zdarma.
  "onb.provozPrice": { cs: "299 Kč", sk: "13,90 €" },
  "onb.provozPriceMonth": { cs: "/měs", sk: "/mes" },
  "onb.provozTrial": { cs: "14 dní zdarma", sk: "14 dní zadarmo" },
  "onb.provozYearly": { cs: "nebo 2 990 Kč/rok (2 měsíce zdarma)", sk: "alebo 139 €/rok (2 mesiace zadarmo)" },
  "onb.forever": { cs: "navždy", sk: "navždy" },
  "onb.select": { cs: "Vybrat", sk: "Vybrať" },
  "onb.planNote": {
    cs: "Domácnost je zdarma do 20 položek, pak 149 Kč/měs (nebo 1 490 Kč/rok). Provoz má 14 dní zdarma, pak 299 Kč/měs. Plán lze změnit v nastavení.",
    sk: "Domácnosť je zadarmo do 20 položiek, potom 6,90 €/mes (alebo 59,90 €/rok). Prevádzka má 14 dní zadarmo, potom 13,90 €/mes. Plán je možné zmeniť v nastaveniach.",
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
  "tab.jidlo": { cs: "Jídlo", sk: "Jedlo" },
  "tab.kasa": { cs: "Kasa", sk: "Pokladňa" },
  "tab.sklad": { cs: "Sklad", sk: "Sklad" },
  "tab.skladZbozi": { cs: "Zboží", sk: "Tovar" },
  "tab.skladSurovin": { cs: "Suroviny", sk: "Suroviny" },
  "tab.inventura": { cs: "Inventura", sk: "Inventúra" },
  "tab.ucto": { cs: "Účto", sk: "Účto" },
  "tab.vic": { cs: "Víc", sk: "Viac" },

  // ── Limit zařízení ──
  "device.limitTitle": { cs: "Dosažen limit zařízení", sk: "Dosiahnutý limit zariadení" },
  "device.limitDesc": { cs: "Tvůj účet je přihlášený na {n} zařízeních. Odhlas některé, nebo si přidej další zařízení.", sk: "Tvoj účet je prihlásený na {n} zariadeniach. Odhlás niektoré, alebo si pridaj ďalšie zariadenie." },
  "device.yourDevices": { cs: "Přihlášená zařízení", sk: "Prihlásené zariadenia" },
  "device.unknownDevice": { cs: "Neznámé zařízení", sk: "Neznáme zariadenie" },
  "device.lastSeen": { cs: "Naposledy: {date}", sk: "Naposledy: {date}" },
  "device.logout": { cs: "Odhlásit", sk: "Odhlásiť" },
  "device.addSlot": { cs: "Přidat zařízení (59 Kč)", sk: "Pridať zariadenie (59 Kč)" },
  "device.addSlotHint": { cs: "Testovací režim — platba se zatím nestrhává.", sk: "Testovací režim — platba sa zatiaľ nestrháva." },
  "device.signOut": { cs: "Odhlásit se z tohoto účtu", sk: "Odhlásiť sa z tohto účtu" },
  "device.settingsTitle": { cs: "Moje zařízení", sk: "Moje zariadenia" },
  "device.thisDevice": { cs: "Toto zařízení", sk: "Toto zariadenie" },
  "device.slotsUsed": { cs: "{used} z {limit} zařízení", sk: "{used} z {limit} zariadení" },

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
