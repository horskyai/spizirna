import type { Translation } from "./dict";

// Texty obrazovky Nastavení.
export const settings: Record<string, Translation> = {
  "settings.title": { cs: "Nastavení", sk: "Nastavenia" },

  // ── Účet ──
  "settings.account": { cs: "Účet", sk: "Účet" },
  "settings.signedInAs": { cs: "Přihlášen jako", sk: "Prihlásený ako" },
  "settings.signOut": { cs: "Odhlásit se", sk: "Odhlásiť sa" },
  "settings.signOutConfirm": {
    cs: "Opravdu se chcete odhlásit?",
    sk: "Naozaj sa chcete odhlásiť?",
  },

  // ── Plán / předplatné ──
  "settings.plan": { cs: "Plán", sk: "Plán" },
  // Plán odpovídá režimu: domácnost je zdarma, provoz je placený.
  "settings.planDomacnostFree": { cs: "Domácnost · Zdarma", sk: "Domácnosť · Zadarmo" },
  "settings.planProvozPaid": { cs: "Provozovna · 299 Kč/měs", sk: "Prevádzka · 13,90 €/mes" },
  "settings.trialActive": { cs: "Zkušební verze aktivní", sk: "Skúšobná verzia aktívna" },
  "settings.trialEnds": { cs: "Zkušební verze končí {date}", sk: "Skúšobná verzia končí {date}" },
  // Tlačítka plánu — zatím šablona (bez napojení na platby).
  "settings.changePlan": { cs: "Změnit plán", sk: "Zmeniť plán" },
  "settings.cancelPlan": { cs: "Zrušit předplatné", sk: "Zrušiť predplatné" },

  // ── Režim ──
  "settings.mode": { cs: "Režim", sk: "Režim" },
  "settings.modeHint": {
    cs: "Přepnutím se aplikace restartuje a načte data daného režimu.",
    sk: "Prepnutím sa aplikácia reštartuje a načíta dáta daného režimu.",
  },

  // ── Název provozovny (jen provoz) ──
  "settings.businessName": { cs: "Název provozovny", sk: "Názov prevádzky" },
  "settings.businessNamePlaceholder": { cs: "Např. Kavárna U Lípy", sk: "Napr. Kaviareň U Lipy" },
  // Údaje firmy pro účtenku / doklady
  "settings.firma": { cs: "Údaje firmy (na účtenku)", sk: "Údaje firmy (na účtenku)" },
  "settings.firmaHint": { cs: "Vyplň jednou — objeví se na účtence a dokladech. Nepovinné.", sk: "Vyplň raz — objaví sa na účtenke a dokladoch. Nepovinné." },
  "settings.firmaLogo": { cs: "Logo", sk: "Logo" },
  "settings.firmaLogoNahrat": { cs: "Nahrát logo", sk: "Nahrať logo" },
  "settings.firmaLogoZmenit": { cs: "Změnit logo", sk: "Zmeniť logo" },
  "settings.firmaLogoOdebrat": { cs: "Odebrat", sk: "Odobrať" },
  "settings.firmaIco": { cs: "IČO", sk: "IČO" },
  "settings.firmaDic": { cs: "DIČ", sk: "DIČ" },
  "settings.firmaAdresa": { cs: "Adresa", sk: "Adresa" },
  "settings.firmaAdresaPh": { cs: "Ulice, město, PSČ", sk: "Ulica, mesto, PSČ" },
  "settings.firmaTelefon": { cs: "Telefon", sk: "Telefón" },
  "settings.firmaEmail": { cs: "E-mail", sk: "E-mail" },
  "settings.firmaPaticka": { cs: "Text dole na účtence", sk: "Text dole na účtenke" },
  "settings.firmaPatickaPh": { cs: "např. Děkujeme za návštěvu", sk: "napr. Ďakujeme za návštevu" },
  "settings.typProvozu": { cs: "Typ provozu", sk: "Typ prevádzky" },
  "settings.typObchod": { cs: "Obchod s potravinami", sk: "Obchod s potravinami" },
  "settings.typRestaurace": { cs: "Restaurace / jídelna", sk: "Reštaurácia / jedáleň" },
  "settings.typZmenit": { cs: "Změnit", sk: "Zmeniť" },
  "settings.typZmenaQ": { cs: "Opravdu změnit typ provozu na „{typ}“? Změní se nabídka, názvy a záložky.", sk: "Naozaj zmeniť typ prevádzky na „{typ}“? Zmení sa ponuka, názvy a záložky." },
  "settings.typHint": { cs: "Typ provozu určuje, jak kasa a sklad fungují. Měň jen když je to opravdu potřeba.", sk: "Typ prevádzky určuje, ako pokladňa a sklad fungujú. Meň len keď je to naozaj potrebné." },

  // Režim zaměstnance (PIN-zámek)
  "settings.empMode": { cs: "Režim zaměstnance", sk: "Režim zamestnanca" },
  "settings.empDesc": { cs: "Zaměstnanec uvidí jen Kasu. Sklad, ceny, účetnictví a nastavení odemkne majitel PINem.", sk: "Zamestnanec uvidí len Pokladňu. Sklad, ceny, účtovníctvo a nastavenia odomkne majiteľ PINom." },
  "settings.empPinPlaceholder": { cs: "PIN (4–6 číslic)", sk: "PIN (4–6 číslic)" },
  "settings.empEnable": { cs: "Zapnout", sk: "Zapnúť" },
  "settings.empOn": { cs: "Režim zaměstnance je zapnutý", sk: "Režim zamestnanca je zapnutý" },
  "settings.empDisable": { cs: "Vypnout ochranu", sk: "Vypnúť ochranu" },
  "settings.empDisableQ": { cs: "Vypnout režim zaměstnance? Vše bude zase přístupné bez PINu.", sk: "Vypnúť režim zamestnanca? Všetko bude zase prístupné bez PINu." },
  "settings.empHint": { cs: "Zámek platí jen na tomto zařízení. Zapamatuj si PIN — bez něj se plný přístup neodemkne.", sk: "Zámok platí len na tomto zariadení. Zapamätaj si PIN — bez neho sa plný prístup neodomkne." },

  // Odemykací obrazovka
  "emp.zamek": { cs: "Režim zaměstnance", sk: "Režim zamestnanca" },
  "emp.jenKasa": { cs: "Máš přístup jen k pokladně.", sk: "Máš prístup len k pokladni." },
  "emp.zadejPin": { cs: "Majitel: zadej PIN pro plný přístup", sk: "Majiteľ: zadaj PIN pre plný prístup" },
  "emp.odemknout": { cs: "Odemknout", sk: "Odomknúť" },
  "emp.spatnyPin": { cs: "Špatný PIN", sk: "Nesprávny PIN" },
  "emp.zamknout": { cs: "Zamknout (režim zaměstnance)", sk: "Zamknúť (režim zamestnanca)" },

  // ── Denní cíl ──
  "settings.goal": { cs: "Denní cíl", sk: "Denný cieľ" },
  "settings.calorieTracking": { cs: "Sledování kalorií", sk: "Sledovanie kalórií" },
  "settings.calorieTrackingLabel": { cs: "Zapnout deník jídla a kalorie", sk: "Zapnúť denník jedla a kalórie" },
  "settings.calorieTrackingHint": { cs: "Přidá záložku Jídlo, počítání kalorií u produktů a denní cíl. Když nehlídáš jídlo, nech vypnuté.", sk: "Pridá záložku Jedlo, počítanie kalórií pri produktoch a denný cieľ. Keď nesleduješ jedlo, nechaj vypnuté." },
  "settings.goalCalories": { cs: "Kalorie", sk: "Kalórie" },
  "settings.goalProtein": { cs: "Bílkoviny", sk: "Bielkoviny" },
  "settings.goalCarbs": { cs: "Sacharidy", sk: "Sacharidy" },
  "settings.goalFat": { cs: "Tuky", sk: "Tuky" },

  // ── Notifikace ──
  "settings.notifications": { cs: "Notifikace", sk: "Notifikácie" },
  "settings.expiryAlerts": { cs: "Upozornění na blížící se spotřebu", sk: "Upozornenia na blížiacu sa spotrebu" },
  "settings.expiryAlertsHint": {
    cs: "Aplikace upozorní na potraviny, kterým brzy končí trvanlivost.",
    sk: "Aplikácia upozorní na potraviny, ktorým čoskoro končí trvanlivosť.",
  },

  // ── Správa dat ──
  "settings.data": { cs: "Správa dat", sk: "Správa dát" },
  "settings.resetData": { cs: "Vymazat všechna data", sk: "Vymazať všetky dáta" },
  "settings.resetDataConfirm": {
    cs: "Opravdu smazat všechna data? Spižírna, recepty i nastavení budou nenávratně odstraněny.",
    sk: "Naozaj vymazať všetky dáta? Špajza, recepty aj nastavenia budú nenávratne odstránené.",
  },
  "settings.dataHint": {
    cs: "Smaže lokální data v tomto zařízení a restartuje aplikaci.",
    sk: "Vymaže lokálne dáta v tomto zariadení a reštartuje aplikáciu.",
  },

  // ── Export dat (GDPR — přenositelnost) ──
  "settings.export": { cs: "Export mých dat", sk: "Export mojich dát" },
  "settings.exportJson": { cs: "Stáhnout vše (záloha .json)", sk: "Stiahnuť všetko (záloha .json)" },
  "settings.exportCsv": { cs: "Stáhnout spižírnu (.csv)", sk: "Stiahnuť špajzu (.csv)" },
  "settings.exportHint": {
    cs: "Stáhne tvoje data do souboru — záloha nebo přenos jinam. Máš na to právo (GDPR).",
    sk: "Stiahne tvoje dáta do súboru — záloha alebo prenos inam. Máš na to právo (GDPR).",
  },
  // CSV hlavičky spižírny
  "settings.export.name": { cs: "Název", sk: "Názov" },
  "settings.export.brand": { cs: "Značka", sk: "Značka" },
  "settings.export.quantity": { cs: "Množství", sk: "Množstvo" },
  "settings.export.unit": { cs: "Jednotka", sk: "Jednotka" },
  "settings.export.location": { cs: "Uložení", sk: "Uloženie" },
  "settings.export.purchased": { cs: "Koupeno", sk: "Kúpené" },
  "settings.export.expires": { cs: "Spotřebovat do", sk: "Spotrebovať do" },
  "settings.export.price": { cs: "Cena", sk: "Cena" },
  "settings.export.store": { cs: "Obchod", sk: "Obchod" },
  "settings.deleteAccount": { cs: "Smazat účet", sk: "Zmazať účet" },
  "settings.deleteAccountConfirm": {
    cs: "Opravdu nevratně smazat účet? Tvůj profil i všechna data na serveru budou trvale odstraněny. Tuto akci nelze vrátit.",
    sk: "Naozaj nenávratne zmazať účet? Tvoj profil aj všetky dáta na serveri budú trvalo odstránené. Túto akciu nie je možné vrátiť.",
  },
  "settings.deleteAccountConfirmBtn": { cs: "Smazat účet", sk: "Zmazať účet" },
  "settings.deleteAccountBusy": { cs: "Mažu…", sk: "Mažem…" },
  "settings.deleteAccountHint": {
    cs: "Trvale smaže tvůj účet a všechna data ze serveru (GDPR).",
    sk: "Trvalo zmaže tvoj účet a všetky dáta zo servera (GDPR).",
  },

  // ── Odkazy (zatím šablona — doplnit cílové URL) ──
  "settings.links": { cs: "Odkazy", sk: "Odkazy" },
  "settings.faq": { cs: "Časté dotazy", sk: "Časté otázky" },
  "settings.support": { cs: "Podpora a kontakt", sk: "Podpora a kontakt" },
  "settings.privacy": { cs: "Ochrana soukromí", sk: "Ochrana súkromia" },
  "settings.terms": { cs: "Podmínky použití", sk: "Podmienky používania" },

  // ── O aplikaci ──
  "settings.about": { cs: "O aplikaci", sk: "O aplikácii" },
  "settings.version": { cs: "Verze", sk: "Verzia" },

  // ── Statistiky domácnosti ──
  "settings.stats": { cs: "Moje statistiky", sk: "Moje štatistiky" },
  "settings.statsToggle": { cs: "Sledovat statistiky", sk: "Sledovať štatistiky" },
  "settings.statsOpen": { cs: "Zobrazit statistiky", sk: "Zobraziť štatistiky" },
  "settings.statsHint": {
    cs: "Hodnota spižírny, kolik jsi vyhodil/ušetřil v Kč a herní pokrok. Když tě čísla nezajímají, vypni to.",
    sk: "Hodnota špajze, koľko si vyhodil/ušetril v € a herný pokrok. Keď ťa čísla nezaujímajú, vypni to.",
  },
  "stats.title": { cs: "Moje statistiky", sk: "Moje štatistiky" },
  "stats.pantryValue": { cs: "Hodnota spižírny", sk: "Hodnota špajze" },
  "stats.pantryValueHint": { cs: "z {n} položek s cenou", sk: "z {n} položiek s cenou" },
  "stats.noPrices": { cs: "zadej ceny u položek", sk: "zadaj ceny pri položkách" },
  "stats.itemCount": { cs: "Položek", sk: "Položiek" },
  "stats.inPantry": { cs: "aktuálně ve spižírně", sk: "aktuálne v špajzi" },
  "stats.wasteTitle": { cs: "Plýtvání vs. záchrana", sk: "Plytvanie vs. záchrana" },
  "stats.saved": { cs: "Zachráněno", sk: "Zachránené" },
  "stats.wasted": { cs: "Vyhozeno", sk: "Vyhodené" },
  "stats.savedKc": { cs: "Ušetřeno", sk: "Ušetrené" },
  "stats.wastedKc": { cs: "Vyhozeno za", sk: "Vyhodené za" },
  "stats.kcEstimate": { cs: "Částky bez zadané ceny jsou odhad z průměru tvé spižírny.", sk: "Sumy bez zadanej ceny sú odhad z priemeru tvojej špajze." },
  "stats.saveRate": { cs: "Zachránil jsi {n} % potravin, které měly brzy projít. 💚", sk: "Zachránil si {n} % potravín, ktoré mali čoskoro prejsť. 💚" },
  "stats.byLocation": { cs: "Kde máš zásoby", sk: "Kde máš zásoby" },
  "stats.priciest": { cs: "Nejdražší položky", sk: "Najdrahšie položky" },
  "stats.gameTitle": { cs: "Herní pokrok", sk: "Herný pokrok" },
  "stats.level": { cs: "Úroveň", sk: "Úroveň" },
  "stats.score": { cs: "Skóre", sk: "Skóre" },
  "stats.streak": { cs: "Série dní", sk: "Séria dní" },
};
