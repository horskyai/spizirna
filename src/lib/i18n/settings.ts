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
  "settings.planFree": { cs: "Zdarma", sk: "Zadarmo" },
  "settings.planBasic": { cs: "Basic", sk: "Basic" },
  "settings.planFamily": { cs: "Rodina", sk: "Rodina" },
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

  // ── Denní cíl ──
  "settings.goal": { cs: "Denní cíl", sk: "Denný cieľ" },
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

  // ── Odkazy (zatím šablona — doplnit cílové URL) ──
  "settings.links": { cs: "Odkazy", sk: "Odkazy" },
  "settings.support": { cs: "Podpora a kontakt", sk: "Podpora a kontakt" },
  "settings.privacy": { cs: "Ochrana soukromí", sk: "Ochrana súkromia" },
  "settings.terms": { cs: "Podmínky použití", sk: "Podmienky používania" },

  // ── O aplikaci ──
  "settings.about": { cs: "O aplikaci", sk: "O aplikácii" },
  "settings.version": { cs: "Verze", sk: "Verzia" },
};
