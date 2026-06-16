"use client";

import { useLocale } from "@/lib/i18n";
import { LegalPage } from "@/components/LegalPage";

// Časté dotazy (FAQ). Dvojjazyčné CZ/SK. Otázky vychází z reálných funkcí appky.
type QA = { q: string; a: string };

const FAQ_CS: QA[] = [
  { q: "Jak přidám potravinu do spižírny?", a: "Třemi způsoby: naskenuj čárový kód (EAN), zadej ručně, nebo nadiktuj hlasem. Vše se objeví ve skladu s množstvím a datem spotřeby." },
  { q: "Funguje hlasové zadávání i slovensky?", a: "Ano. Pokud máš appku ve slovenštině, mluvíš slovensky a appka rozumí (čísla, jednotky i názvy potravin). V češtině zase česky." },
  { q: "Co když se produkt po naskenování nenajde?", a: "Můžeš zadat kód ručně nebo přidat produkt celý ručně. Doplněním pomůžeš zlepšit databázi pro ostatní uživatele." },
  { q: "Jak mě appka upozorní na končící trvanlivost?", a: "Potraviny, kterým brzy končí spotřeba, se zvýrazní a uvidíš upozornění. Upozornění lze zapnout/vypnout v Nastavení." },
  { q: "Jak fungují recepty?", a: "Procházej tisíce receptů a appka ti ukáže, na které máš doma suroviny. Co ti chybí, přidáš jedním klepnutím do nákupního seznamu." },
  { q: "K čemu je režim Provozovna?", a: "Je pro restaurace a provozovny — sklad s cenami a minimy, inventura s výpočtem hodnoty skladu a export do PDF nebo Excelu (CSV)." },
  { q: "Jsou moje data v bezpečí?", a: "Většina tvého obsahu je uložená lokálně ve tvém zařízení. Přihlášení a registrační údaje řeší Supabase. Více v Zásadách ochrany soukromí." },
  { q: "Jak změním nebo zruším předplatné?", a: "Plán spravuješ v Nastavení → Plán. Platby a zrušení předplatného se řídí pravidly obchodu, ze kterého jsi appku stáhl (např. Google Play)." },
  { q: "Zapomněl jsem heslo, co teď?", a: "Na přihlašovací obrazovce klepni na „Zapomněli jste heslo?“, zadej e-mail a přijde ti odkaz pro nastavení nového hesla." },
  { q: "Jak smažu všechna data?", a: "V Nastavení → Vymazat všechna data. Tím se smažou lokální data v tomto zařízení." },
  { q: "Mám další dotaz.", a: "Napiš nám na spizirnacz@gmail.com — rádi pomůžeme." },
];

const FAQ_SK: QA[] = [
  { q: "Ako pridám potravinu do špajze?", a: "Tromi spôsobmi: naskenuj čiarový kód (EAN), zadaj ručne, alebo nadiktuj hlasom. Všetko sa objaví v sklade s množstvom a dátumom spotreby." },
  { q: "Funguje hlasové zadávanie aj slovensky?", a: "Áno. Ak máš appku v slovenčine, hovoríš slovensky a appka rozumie (čísla, jednotky aj názvy potravín). V češtine zase česky." },
  { q: "Čo keď sa produkt po naskenovaní nenájde?", a: "Môžeš zadať kód ručne alebo pridať produkt celý ručne. Doplnením pomôžeš zlepšiť databázu pre ostatných používateľov." },
  { q: "Ako ma appka upozorní na končiacu trvanlivosť?", a: "Potraviny, ktorým čoskoro končí spotreba, sa zvýraznia a uvidíš upozornenie. Upozornenia sa dajú zapnúť/vypnúť v Nastaveniach." },
  { q: "Ako fungujú recepty?", a: "Prechádzaj tisíce receptov a appka ti ukáže, na ktoré máš doma suroviny. Čo ti chýba, pridáš jedným klepnutím do nákupného zoznamu." },
  { q: "Na čo je režim Prevádzka?", a: "Je pre reštaurácie a prevádzky — sklad s cenami a minimami, inventúra s výpočtom hodnoty skladu a export do PDF alebo Excelu (CSV)." },
  { q: "Sú moje dáta v bezpečí?", a: "Väčšina tvojho obsahu je uložená lokálne v tvojom zariadení. Prihlásenie a registračné údaje rieši Supabase. Viac v Zásadách ochrany súkromia." },
  { q: "Ako zmením alebo zruším predplatné?", a: "Plán spravuješ v Nastaveniach → Plán. Platby a zrušenie predplatného sa riadia pravidlami obchodu, z ktorého si appku stiahol (napr. Google Play)." },
  { q: "Zabudol som heslo, čo teraz?", a: "Na prihlasovacej obrazovke klepni na „Zabudli ste heslo?“, zadaj e-mail a príde ti odkaz na nastavenie nového hesla." },
  { q: "Ako zmažem všetky dáta?", a: "V Nastaveniach → Vymazať všetky dáta. Tým sa zmažú lokálne dáta v tomto zariadení." },
  { q: "Mám ďalšiu otázku.", a: "Napíš nám na spizirnacz@gmail.com — radi pomôžeme." },
];

export default function FaqPage() {
  const locale = useLocale();
  const cs = locale !== "sk";
  const items = cs ? FAQ_CS : FAQ_SK;

  return (
    <LegalPage title={cs ? "Časté dotazy" : "Časté otázky"} updated={cs ? "Nenašli jste odpověď? Napište na spizirnacz@gmail.com" : "Nenašli ste odpoveď? Napíšte na spizirnacz@gmail.com"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, i) => (
          <details key={i} style={{ background: "white", borderRadius: 14, border: "1.5px solid var(--border)", padding: "12px 16px" }}>
            <summary style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", cursor: "pointer", listStyle: "none" }}>
              {item.q}
            </summary>
            <p style={{ marginTop: 8, marginBottom: 0, color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </LegalPage>
  );
}
