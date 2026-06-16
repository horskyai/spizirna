import type { Translation } from "./dict";

// Překlady pro obrazovku skenování (Scanner).
export const scanner: Record<string, Translation> = {
  // ── Open databáze (popisy) ──
  "scanner.dbFoodDesc": { cs: "Potraviny & nápoje", sk: "Potraviny & nápoje" },
  "scanner.dbBeautyDesc": { cs: "Kosmetika & drogerie", sk: "Kozmetika & drogéria" },
  "scanner.dbPetDesc": { cs: "Krmiva pro zvířata", sk: "Krmivá pre zvieratá" },
  "scanner.dbProductsDesc": { cs: "Ostatní produkty", sk: "Ostatné produkty" },

  // ── Chyby kamery ──
  "scanner.cameraDenied": {
    cs: "Přístup ke kameře byl zamítnut. Povolte kameru v nastavení prohlížeče nebo zadejte EAN ručně.",
    sk: "Prístup ku kamere bol zamietnutý. Povoľte kameru v nastaveniach prehliadača alebo zadajte EAN ručne.",
  },
  "scanner.cameraFailed": {
    cs: "Nepodařilo se spustit kameru. Povolte přístup ke kameře nebo zadejte EAN ručně.",
    sk: "Nepodarilo sa spustiť kameru. Povoľte prístup ku kamere alebo zadajte EAN ručne.",
  },

  // ── Stavy skenování ──
  "scanner.stateScanning": { cs: "Namiřte na čárový kód", sk: "Namierte na čiarový kód" },
  "scanner.stateInit": { cs: "Inicializace skeneru...", sk: "Inicializácia skenera..." },
  "scanner.stateLoading": { cs: "Načítám produkt...", sk: "Načítavam produkt..." },
  "scanner.stateFound": { cs: "Produkt nalezen!", sk: "Produkt nájdený!" },
  "scanner.stateNotFound": { cs: "Produkt nebyl nalezen v databázi", sk: "Produkt sa nenašiel v databáze" },

  // ── Ovládací prvky ──
  "scanner.scanAgainAria": { cs: "Skenovat znovu", sk: "Skenovať znova" },
  "scanner.enterManually": { cs: "Zadat ručně", sk: "Zadať ručne" },
  "scanner.enterEanManually": { cs: "Zadat EAN ručně", sk: "Zadať EAN ručne" },
  "scanner.closeTitle": { cs: "Zavřít", sk: "Zavrieť" },
  "scanner.howToScanAria": { cs: "Jak skenovat", sk: "Ako skenovať" },

  // ── Nápověda ke skenování ──
  "scanner.helpTitle": { cs: "Jak naskenovat produkt", sk: "Ako naskenovať produkt" },
  "scanner.helpStep1Title": { cs: "Namiřte na čárový kód", sk: "Namierte na čiarový kód" },
  "scanner.helpStep1Desc": {
    cs: "Podržte telefon nad čárovým kódem na obalu (najdete ho většinou na zadní straně). Kód udržte v zeleném rámečku.",
    sk: "Podržte telefón nad čiarovým kódom na obale (nájdete ho väčšinou na zadnej strane). Kód udržte v zelenom rámčeku.",
  },
  "scanner.helpStep2Title": { cs: "Počkejte na zaměření", sk: "Počkajte na zameranie" },
  "scanner.helpStep2Desc": {
    cs: "Aplikace kód přečte sama, nemusíte nic mačkat. Ve špatném světle si posviťte tlačítkem baterky vpravo nahoře.",
    sk: "Aplikácia kód prečíta sama, nemusíte nič stláčať. V zlom svetle si posvieťte tlačidlom baterky vpravo hore.",
  },
  "scanner.helpStep3Title": { cs: "Produkt se najde", sk: "Produkt sa nájde" },
  "scanner.helpStep3Desc": {
    cs: "Pokud je kód v databázi, načte se název i výživové hodnoty. Vše už máte předvyplněné — jen potvrdíte.",
    sk: "Ak je kód v databáze, načíta sa názov aj výživové hodnoty. Všetko už máte predvyplnené — len potvrdíte.",
  },
  "scanner.helpStep4Title": { cs: "Když se nenajde", sk: "Keď sa nenájde" },
  "scanner.helpStep4Desc": {
    cs: "Některé produkty v databázi nejsou. Pak ťukněte na „Zadat ručně“ dole a doplníte údaje (i s vlastní fotkou). Příště už si je aplikace pamatuje — nemusíte se nikam přihlašovat.",
    sk: "Niektoré produkty v databáze nie sú. Potom ťuknite na „Zadať ručne“ dole a doplníte údaje (aj s vlastnou fotkou). Nabudúce si ich už aplikácia pamätá — nemusíte sa nikam prihlasovať.",
  },
  "scanner.helpStepStarTitle": { cs: "Chcete pomoct ostatním?", sk: "Chcete pomôcť ostatným?" },
  "scanner.helpStepStarDesc": {
    cs: "U nenalezeného produktu můžete zvolit „Přidat do veřejné databáze“ — výrobek pak najdou i ostatní lidé na celém světě. K tomu je potřeba bezplatná registrace na webu Open Food Facts. Je to dobrovolné.",
    sk: "Pri nenájdenom produkte môžete zvoliť „Pridať do verejnej databázy“ — výrobok potom nájdu aj ostatní ľudia na celom svete. Na to je potrebná bezplatná registrácia na webe Open Food Facts. Je to dobrovoľné.",
  },
  "scanner.helpUnderstood": { cs: "Rozumím, jdu skenovat", sk: "Rozumiem, idem skenovať" },

  // ── Manuální zadání EAN ──
  "scanner.eanHint": {
    cs: "Zadejte 13-místný EAN kód z obalu produktu.",
    sk: "Zadajte 13-miestny EAN kód z obalu produktu.",
  },
  "scanner.eanLengthHint": {
    cs: "EAN kód má obvykle 13 číslic ({n}/13)",
    sk: "EAN kód má obvykle 13 číslic ({n}/13)",
  },
  "scanner.searchProduct": { cs: "Vyhledat produkt", sk: "Vyhľadať produkt" },

  // ── Produkt nenalezen — panel ──
  "scanner.notFoundTitle": { cs: "Produkt nenalezen", sk: "Produkt nenájdený" },
  "scanner.notFoundQuestion": {
    cs: "Produkt není v žádné databázi. Co chceš udělat?",
    sk: "Produkt nie je v žiadnej databáze. Čo chceš urobiť?",
  },
  "scanner.addManualToPantry": { cs: "Přidat ručně do Spižírny", sk: "Pridať ručne do Špajze" },
  "scanner.addManualToPantryDesc": { cs: "Jen pro tebe, uloženo lokálně", sk: "Len pre teba, uložené lokálne" },
  "scanner.addToPublicDb": { cs: "Přidat do veřejné databáze", sk: "Pridať do verejnej databázy" },
  "scanner.addToPublicDbDesc": { cs: "Otevře web — pomůže všem uživatelům", sk: "Otvorí web — pomôže všetkým používateľom" },
  "scanner.publicDbInfoBold": { cs: "Produkt chybí v databázi?", sk: "Produkt chýba v databáze?" },
  "scanner.publicDbInfo": {
    cs: "Přidáním do Open Food Facts pomůžeš ostatním uživatelům najít ho příště automaticky. Stačí vytvořit bezplatný účet na webu.",
    sk: "Pridaním do Open Food Facts pomôžeš ostatným používateľom nájsť ho nabudúce automaticky. Stačí vytvoriť bezplatný účet na webe.",
  },
  "scanner.scanAgain": { cs: "Skenovat znovu", sk: "Skenovať znova" },

  // ── Výběr databáze ──
  "scanner.pickDbTitle": { cs: "Vyberte databázi", sk: "Vyberte databázu" },
  "scanner.pickDbInfoBefore": { cs: "Otevře se web v prohlížeči — EAN ", sk: "Otvorí sa web v prehliadači — EAN " },
  "scanner.pickDbInfoAfter": {
    cs: " bude předvyplněný. Pro přidání je potřeba bezplatná registrace na daném webu.",
    sk: " bude predvyplnený. Na pridanie je potrebná bezplatná registrácia na danom webe.",
  },

  // ── Kamera tlačítko v ProductSheet ──
  "scanner.camera": { cs: "Kamera", sk: "Kamera" },
};
