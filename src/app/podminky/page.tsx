"use client";

import { useLocale } from "@/lib/i18n";
import { LegalPage } from "@/components/LegalPage";

// Podmínky použití (CZ/SK). Statický text.
// POZN.: není to právní rada; před vydáním doporučeno zkontrolovat s právníkem.
export default function TermsPage() {
  const locale = useLocale();
  const cs = locale !== "sk";

  return (
    <LegalPage title={cs ? "Podmínky použití" : "Podmienky používania"} updated={cs ? "Naposledy aktualizováno: 16. 6. 2026" : "Naposledy aktualizované: 16. 6. 2026"}>
      {cs ? (
        <>
          <p>
            Vítejte v aplikaci <b>Spižírna</b>. Používáním aplikace souhlasíte s těmito podmínkami.
            Provozovatelem je <b>Jiří Horský</b>. Kontakt: <b>spizirnacz@seznam.cz</b>.
          </p>

          <h2>1. Popis služby</h2>
          <p>Spižírna je aplikace pro správu potravin, receptů, nákupních seznamů a inventury
            (pro domácnosti i provozovny). Funkce se mohou v čase měnit a vyvíjet.</p>

          <h2>2. Účet</h2>
          <p>Pro používání je potřeba účet. Jste odpovědni za své přihlašovací údaje a za aktivitu
            na svém účtu. Údaje musí být pravdivé.</p>

          <h2>3. Předplatné a platby</h2>
          <p>Aplikace nabízí bezplatnou verzi a placené plány. Platby probíhají přes obchod, ze
            kterého jste aplikaci nainstalovali (např. Google Play). Podmínky obnovy a zrušení
            předplatného se řídí pravidly daného obchodu.</p>

          <h2>4. Správné používání</h2>
          <p>Zavazujete se aplikaci nezneužívat, nenarušovat její provoz ani se nepokoušet o
            neoprávněný přístup.</p>

          <h2>5. Obsah uživatele</h2>
          <p>Obsah, který do aplikace zadáte (položky, recepty, poznámky), zůstává váš. Odpovídáte
            za jeho správnost.</p>

          <h2>6. Omezení odpovědnosti</h2>
          <p>Aplikace je poskytována „tak jak je". Údaje o produktech a nutričních hodnotách pocházejí
            z veřejných databází a nemusí být vždy přesné — neslouží jako lékařská ani výživová rada.
            Provozovatel neodpovídá za škody vzniklé používáním aplikace v rozsahu povoleném zákonem.</p>

          <h2>7. Ukončení</h2>
          <p>Účet můžete kdykoliv zrušit. Provozovatel může ukončit přístup při porušení těchto
            podmínek.</p>

          <h2>8. Změny podmínek</h2>
          <p>Podmínky můžeme aktualizovat. O podstatných změnách vás budeme informovat v aplikaci.</p>

          <h2>9. Rozhodné právo</h2>
          <p>Tyto podmínky se řídí právním řádem České republiky.</p>
        </>
      ) : (
        <>
          <p>
            Vitajte v aplikácii <b>Špajza</b>. Používaním aplikácie súhlasíte s týmito podmienkami.
            Prevádzkovateľom je <b>Jiří Horský</b>. Kontakt: <b>spizirnacz@seznam.cz</b>.
          </p>

          <h2>1. Popis služby</h2>
          <p>Špajza je aplikácia na správu potravín, receptov, nákupných zoznamov a inventúry
            (pre domácnosti aj prevádzky). Funkcie sa môžu v čase meniť a vyvíjať.</p>

          <h2>2. Účet</h2>
          <p>Na používanie je potrebný účet. Ste zodpovední za svoje prihlasovacie údaje a za aktivitu
            na svojom účte. Údaje musia byť pravdivé.</p>

          <h2>3. Predplatné a platby</h2>
          <p>Aplikácia ponúka bezplatnú verziu a platené plány. Platby prebiehajú cez obchod, z
            ktorého ste aplikáciu nainštalovali (napr. Google Play). Podmienky obnovy a zrušenia
            predplatného sa riadia pravidlami daného obchodu.</p>

          <h2>4. Správne používanie</h2>
          <p>Zaväzujete sa aplikáciu nezneužívať, nenarúšať jej prevádzku ani sa nepokúšať o
            neoprávnený prístup.</p>

          <h2>5. Obsah používateľa</h2>
          <p>Obsah, ktorý do aplikácie zadáte (položky, recepty, poznámky), zostáva váš. Zodpovedáte
            za jeho správnosť.</p>

          <h2>6. Obmedzenie zodpovednosti</h2>
          <p>Aplikácia je poskytovaná „tak ako je". Údaje o produktoch a nutričných hodnotách pochádzajú
            z verejných databáz a nemusia byť vždy presné — neslúžia ako lekárska ani výživová rada.
            Prevádzkovateľ nezodpovedá za škody vzniknuté používaním aplikácie v rozsahu povolenom zákonom.</p>

          <h2>7. Ukončenie</h2>
          <p>Účet môžete kedykoľvek zrušiť. Prevádzkovateľ môže ukončiť prístup pri porušení týchto
            podmienok.</p>

          <h2>8. Zmeny podmienok</h2>
          <p>Podmienky môžeme aktualizovať. O podstatných zmenách vás budeme informovať v aplikácii.</p>

          <h2>9. Rozhodné právo</h2>
          <p>Tieto podmienky sa riadia právnym poriadkom Slovenskej republiky / Českej republiky.</p>
        </>
      )}
    </LegalPage>
  );
}
