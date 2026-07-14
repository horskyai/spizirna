import type { Translation } from "./dict";

// Přihlašovací / registrační obrazovka (AuthScreen).
export const auth: Record<string, Translation> = {
  // ── Logo / hlavička ──
  "auth.appName": { cs: "Spižírna", sk: "Špajza" },
  "auth.tagline": { cs: "Chytrá správa potravin", sk: "Inteligentná správa potravín" },
  // Tři výhody v hlavičce přihlašovací obrazovky
  "auth.benefitScan": { cs: "Sken kódu", sk: "Sken kódu" },
  "auth.benefitRecipes": { cs: "Recepty", sk: "Recepty" },
  "auth.benefitExpiry": { cs: "Hlídá data", sk: "Stráži dátumy" },

  // ── Přepínač login / registrace ──
  "auth.login": { cs: "Přihlásit se", sk: "Prihlásiť sa" },
  "auth.signup": { cs: "Registrace", sk: "Registrácia" },
  "auth.or": { cs: "nebo", sk: "alebo" },
  "auth.google": { cs: "Pokračovat přes Google", sk: "Pokračovať cez Google" },

  // ── Formulář ──
  "auth.namePlaceholder": { cs: "Jméno", sk: "Meno" },
  "auth.emailPlaceholder": { cs: "Email", sk: "E-mail" },
  "auth.passwordPlaceholder": { cs: "Heslo", sk: "Heslo" },
  "auth.passwordHint": { cs: "Alespoň 8 znaků", sk: "Aspoň 8 znakov" },

  // ── Tlačítka / stavy ──
  "auth.loading": { cs: "Načítám...", sk: "Načítavam..." },
  "auth.createAccount": { cs: "Vytvořit účet", sk: "Vytvoriť účet" },

  // ── Chybové hlášky ──
  "auth.errEnterName": { cs: "Zadejte jméno", sk: "Zadajte meno" },
  "auth.errEmail": { cs: "Zadejte platný e-mail", sk: "Zadajte platný e-mail" },
  "auth.errPassword": {
    cs: "Heslo musí mít alespoň 8 znaků",
    sk: "Heslo musí mať aspoň 8 znakov",
  },
  "auth.errInvalidLogin": {
    cs: "Nesprávný e-mail nebo heslo",
    sk: "Nesprávny e-mail alebo heslo",
  },
  "auth.errEmailTaken": {
    cs: "Tento e-mail je už zaregistrovaný",
    sk: "Tento e-mail je už zaregistrovaný",
  },

  // ── Poznámka o zkušební době ──
  "auth.trialNote": { cs: "Po registraci máte", sk: "Po registrácii máte" },
  "auth.trialDays": { cs: "14 dní zdarma", sk: "14 dní zadarmo" },
  // planNote se liší podle režimu (domácnost má limit zdarma, provoz je placený).
  "auth.planNoteDomacnost": {
    cs: "Domácnost je zdarma do 50 položek, poté 149 Kč/měsíc.",
    sk: "Domácnosť je zadarmo do 50 položiek, potom 6,90 €/mesiac.",
  },
  "auth.planNoteProvoz": {
    cs: "Provozovna 299 Kč/měsíc.",
    sk: "Prevádzka 13,90 €/mesiac.",
  },

  // ── Úspěšná registrace ──
  "auth.checkEmail": { cs: "Zkontrolujte email", sk: "Skontrolujte e-mail" },
  "auth.confirmSent": { cs: "Poslali jsme vám potvrzovací odkaz na", sk: "Poslali sme vám potvrdzovací odkaz na" },
  "auth.confirmThenLogin": { cs: "Po potvrzení se přihlaste.", sk: "Po potvrdení sa prihláste." },

  // ── Zapomenuté heslo ──
  "auth.forgotPassword": { cs: "Zapomněli jste heslo?", sk: "Zabudli ste heslo?" },
  "auth.resetTitle": { cs: "Obnova hesla", sk: "Obnova hesla" },
  "auth.resetHint": {
    cs: "Zadejte e-mail a pošleme vám odkaz pro nastavení nového hesla.",
    sk: "Zadajte e-mail a pošleme vám odkaz na nastavenie nového hesla.",
  },
  "auth.resetSend": { cs: "Odeslat odkaz", sk: "Odoslať odkaz" },
  "auth.resetBack": { cs: "Zpět na přihlášení", sk: "Späť na prihlásenie" },
  "auth.resetSentTitle": { cs: "Odkaz odeslán", sk: "Odkaz odoslaný" },
  "auth.resetSent": {
    cs: "Pokud k tomuto e-mailu existuje účet, poslali jsme na",
    sk: "Ak k tomuto e-mailu existuje účet, poslali sme na",
  },
  "auth.resetSentTail": {
    cs: "odkaz pro obnovu hesla.",
    sk: "odkaz na obnovu hesla.",
  },

  // ── Nastavení nového hesla (stránka /reset) ──
  "auth.newPasswordTitle": { cs: "Nové heslo", sk: "Nové heslo" },
  "auth.newPasswordHint": { cs: "Zadejte nové heslo k vašemu účtu.", sk: "Zadajte nové heslo k vášmu účtu." },
  "auth.newPasswordPlaceholder": { cs: "Nové heslo", sk: "Nové heslo" },
  "auth.newPasswordConfirm": { cs: "Heslo znovu", sk: "Heslo znova" },
  "auth.newPasswordSave": { cs: "Uložit heslo", sk: "Uložiť heslo" },
  "auth.errPasswordMatch": { cs: "Hesla se neshodují", sk: "Heslá sa nezhodujú" },
  "auth.newPasswordDone": { cs: "Heslo bylo změněno", sk: "Heslo bolo zmenené" },
  "auth.newPasswordDoneHint": { cs: "Nyní se můžete přihlásit novým heslem.", sk: "Teraz sa môžete prihlásiť novým heslom." },
  "auth.resetLinkInvalid": {
    cs: "Odkaz pro obnovu je neplatný nebo vypršel. Požádejte o nový.",
    sk: "Odkaz na obnovu je neplatný alebo vypršal. Požiadajte o nový.",
  },
  "auth.goToApp": { cs: "Pokračovat do aplikace", sk: "Pokračovať do aplikácie" },
};
