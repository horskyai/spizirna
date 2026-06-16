import type { Translation } from "./dict";

// Přihlašovací / registrační obrazovka (AuthScreen).
export const auth: Record<string, Translation> = {
  // ── Logo / hlavička ──
  "auth.appName": { cs: "Spižírna", sk: "Špajza" },
  "auth.tagline": { cs: "Chytrá správa potravin", sk: "Inteligentná správa potravín" },

  // ── Přepínač login / registrace ──
  "auth.login": { cs: "Přihlásit se", sk: "Prihlásiť sa" },
  "auth.signup": { cs: "Registrace", sk: "Registrácia" },

  // ── Formulář ──
  "auth.namePlaceholder": { cs: "Jméno", sk: "Meno" },
  "auth.emailPlaceholder": { cs: "Email", sk: "E-mail" },
  "auth.passwordPlaceholder": { cs: "Heslo", sk: "Heslo" },

  // ── Tlačítka / stavy ──
  "auth.loading": { cs: "Načítám...", sk: "Načítavam..." },
  "auth.createAccount": { cs: "Vytvořit účet", sk: "Vytvoriť účet" },

  // ── Chybové hlášky ──
  "auth.errEnterName": { cs: "Zadejte jméno", sk: "Zadajte meno" },

  // ── Poznámka o zkušební době ──
  "auth.trialNote": { cs: "Po registraci máte", sk: "Po registrácii máte" },
  "auth.trialDays": { cs: "14 dní zdarma", sk: "14 dní zadarmo" },
  "auth.planNote": {
    cs: "Základní plán 99 Kč/měsíc, Rodinný 149 Kč/měsíc.",
    sk: "Základný plán 99 Kč/mesiac, Rodinný 149 Kč/mesiac.",
  },

  // ── Úspěšná registrace ──
  "auth.checkEmail": { cs: "Zkontrolujte email", sk: "Skontrolujte e-mail" },
  "auth.confirmSent": { cs: "Poslali jsme vám potvrzovací odkaz na", sk: "Poslali sme vám potvrdzovací odkaz na" },
  "auth.confirmThenLogin": { cs: "Po potvrzení se přihlaste.", sk: "Po potvrdení sa prihláste." },
};
