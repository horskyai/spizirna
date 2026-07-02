"use client";

import { useLocale } from "@/lib/i18n";
import { LegalPage } from "@/components/LegalPage";

// Zásady ochrany soukromí (CZ/SK). Statický text — povinné pro Google Play.
// POZN.: není to právní rada; před vydáním doporučeno zkontrolovat s právníkem.
export default function PrivacyPage() {
  const locale = useLocale();
  const cs = locale !== "sk";

  return (
    <LegalPage title={cs ? "Zásady ochrany soukromí" : "Zásady ochrany súkromia"} updated={cs ? "Naposledy aktualizováno: 16. 6. 2026" : "Naposledy aktualizované: 16. 6. 2026"}>
      {cs ? (
        <>
          <p>
            Tyto zásady popisují, jak aplikace <b>Spižírna</b> nakládá s vašimi údaji.
            Provozovatelem a správcem osobních údajů je <b>Jiří Horský</b> (dále „provozovatel").
            Kontakt: <b>spizirnacz@gmail.com</b>.
          </p>

          <h2>1. Jaké údaje zpracováváme</h2>
          <ul>
            <li><b>Registrační údaje:</b> e-mailová adresa a jméno (zadané při registraci).</li>
            <li><b>Obsah, který sami zadáte:</b> položky spižírny, nákupní seznamy, recepty,
              záznamy inventury, deník jídla. Tato data jsou primárně uložena <b>lokálně ve vašem
              zařízení</b>.</li>
            <li><b>Čárové kódy (EAN):</b> při skenování produktu se kód dohledává v databázích
              (viz třetí strany níže).</li>
          </ul>

          <h2>2. Přístup k zařízení</h2>
          <ul>
            <li><b>Kamera</b> — slouží výhradně ke skenování čárových kódů. Záběry se neukládají
              ani neodesílají.</li>
            <li><b>Mikrofon</b> — slouží k hlasovému zadávání položek. Rozpoznávání řeči zajišťuje
              váš prohlížeč/operační systém.</li>
          </ul>

          <h2>3. Účel zpracování</h2>
          <p>Údaje zpracováváme, abychom vám umožnili přihlášení, ukládání a synchronizaci vašeho
            obsahu a poskytování funkcí aplikace.</p>

          <h2>4. Třetí strany</h2>
          <ul>
            <li><b>Supabase</b> — zajišťuje přihlášení a ukládá registrační údaje a sdílený katalog
              produktů.</li>
            <li><b>Open Food Facts</b> — veřejná databáze, ve které se dohledávají produkty podle
              čárového kódu.</li>
          </ul>

          <h2>5. Uložení a doba zpracování</h2>
          <p>Většina vašeho obsahu je uložena lokálně ve vašem zařízení. Registrační údaje
            uchováváme po dobu trvání vašeho účtu. Účet i s daty můžete kdykoliv smazat.</p>

          <h2>6. Vaše práva</h2>
          <p>Máte právo na přístup k údajům, jejich opravu, výmaz a přenositelnost. Pro uplatnění
            práv nás kontaktujte na <b>spizirnacz@gmail.com</b>.</p>

          <h2>7. Smazání dat</h2>
          <p>Lokální data smažete v aplikaci v Nastavení → Vymazat všechna data. Pro smazání účtu
            nás kontaktujte.</p>

          <h2>8. Změny zásad</h2>
          <p>Tyto zásady můžeme aktualizovat. O podstatných změnách vás budeme informovat
            v aplikaci.</p>
        </>
      ) : (
        <>
          <p>
            Tieto zásady popisujú, ako aplikácia <b>Špajza</b> nakladá s vašimi údajmi.
            Prevádzkovateľom a správcom osobných údajov je <b>Jiří Horský</b> (ďalej „prevádzkovateľ").
            Kontakt: <b>spizirnacz@gmail.com</b>.
          </p>

          <h2>1. Aké údaje spracúvame</h2>
          <ul>
            <li><b>Registračné údaje:</b> e-mailová adresa a meno (zadané pri registrácii).</li>
            <li><b>Obsah, ktorý sami zadáte:</b> položky špajze, nákupné zoznamy, recepty,
              záznamy inventúry, denník jedla. Tieto dáta sú primárne uložené <b>lokálne vo vašom
              zariadení</b>.</li>
            <li><b>Čiarové kódy (EAN):</b> pri skenovaní produktu sa kód dohľadáva v databázach
              (viď tretie strany nižšie).</li>
          </ul>

          <h2>2. Prístup k zariadeniu</h2>
          <ul>
            <li><b>Kamera</b> — slúži výhradne na skenovanie čiarových kódov. Zábery sa neukladajú
              ani neodosielajú.</li>
            <li><b>Mikrofón</b> — slúži na hlasové zadávanie položiek. Rozpoznávanie reči zaisťuje
              váš prehliadač/operačný systém.</li>
          </ul>

          <h2>3. Účel spracovania</h2>
          <p>Údaje spracúvame, aby sme vám umožnili prihlásenie, ukladanie a synchronizáciu vášho
            obsahu a poskytovanie funkcií aplikácie.</p>

          <h2>4. Tretie strany</h2>
          <ul>
            <li><b>Supabase</b> — zaisťuje prihlásenie a ukladá registračné údaje a zdieľaný katalóg
              produktov.</li>
            <li><b>Open Food Facts</b> — verejná databáza, v ktorej sa dohľadávajú produkty podľa
              čiarového kódu.</li>
          </ul>

          <h2>5. Uloženie a doba spracovania</h2>
          <p>Väčšina vášho obsahu je uložená lokálne vo vašom zariadení. Registračné údaje
            uchovávame počas trvania vášho účtu. Účet aj s dátami môžete kedykoľvek zmazať.</p>

          <h2>6. Vaše práva</h2>
          <p>Máte právo na prístup k údajom, ich opravu, výmaz a prenositeľnosť. Na uplatnenie
            práv nás kontaktujte na <b>spizirnacz@gmail.com</b>.</p>

          <h2>7. Zmazanie dát</h2>
          <p>Lokálne dáta zmažete v aplikácii v Nastaveniach → Vymazať všetky dáta. Na zmazanie účtu
            nás kontaktujte.</p>

          <h2>8. Zmeny zásad</h2>
          <p>Tieto zásady môžeme aktualizovať. O podstatných zmenách vás budeme informovať
            v aplikácii.</p>
        </>
      )}
    </LegalPage>
  );
}
