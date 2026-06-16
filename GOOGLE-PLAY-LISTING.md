# Google Play — texty a podklady pro obchod (Store listing)

Připravené texty k vložení do Google Play Console → Store listing.
Zkontroluj/uprav podle sebe. Limity Googlu jsou dodrženy.

---

## Název aplikace
**(max 30 znaků)**

```
Spižírna – sklad a recepty
```
*(26 znaků. Alternativy: „Spižírna – domácí sklad" / „Spižírna")*

---

## Krátký popis
**(max 80 znaků — zobrazuje se v seznamu výsledků)**

```
Měj přehled, co máš doma. Sklad potravin, recepty, nákup i inventura.
```
*(69 znaků)*

---

## Dlouhý popis
**(max 4000 znaků — hlavní popis na stránce appky)**

```
Spižírna ti dá přehled o tom, co máš doma — ať už vaříš pro rodinu, nebo
řídíš provozovnu. Konec zbytečného plýtvání jídlem a nakupování věcí,
které už máš.

🥦 PŘEHLEDNÁ SPIŽÍRNA
Měj na jednom místě, co máš v lednici, mrazáku, spíži i na lince. U každé
potraviny vidíš množství i datum spotřeby.

⏰ HLÍDÁNÍ TRVANLIVOSTI
Aplikace tě upozorní na potraviny, kterým brzy končí spotřeba — ať nic
nevyhodíš zbytečně.

📷 SKENOVÁNÍ ČÁROVÝCH KÓDŮ
Naskenuj EAN a produkt se sám dohledá a přidá. Rychle a bez psaní.

🎤 ZADÁVÁNÍ HLASEM
Řekni „dvě kila brambor, litr mléka" a položky se rozpoznají a přidají
naráz. Funguje česky i slovensky.

🍳 TISÍCE RECEPTŮ
Najdi inspiraci podle toho, co máš doma. Co ti k receptu chybí, přidáš
jedním klepnutím do nákupního seznamu.

🛒 NÁKUPNÍ SEZNAM
Vše, co potřebuješ koupit, přehledně na jednom místě. Odškrtávej v obchodě
a po nákupu přesuň rovnou do spižírny.

🔄 OPAKOVANÉ NÁKUPY
Věci, co kupuješ pořád dokola. Aplikace odhadne, kdy ti dochází, a připomene je.

📊 DENÍK JÍDLA A KALORIE
Zapisuj, co jíš, a sleduj kalorie i makra proti svému dennímu cíli.

🏪 REŽIM PROVOZOVNA (pro restaurace a bary)
Sklad s cenami a minimy, inventura s výpočtem hodnoty skladu a export do
PDF nebo Excelu — pošli rovnou účetní.

🇨🇿 🇸🇰 ČESKY I SLOVENSKY
Celá aplikace, recepty i hlasové zadávání ve tvém jazyce.

Vyzkoušej Spižírnu zdarma na 2 týdny.
```

---

## Kategorie a štítky
- **Kategorie:** Jídlo a pití (Food & Drink) — nebo Produktivita
- **Štítky/tagy:** spižírna, potraviny, recepty, nákupní seznam, inventura

---

## Povinné odkazy
- **Zásady ochrany soukromí:** `https://spizirna-nine.vercel.app/soukromi`
- (volitelně) Web: později vlastní doména

---

## Grafika — co je potřeba vytvořit

| Podklad | Rozměr | Stav |
|---|---|---|
| **Ikona aplikace** | 512 × 512 px (PNG) | ✅ máme (oranžové logo) |
| **Feature graphic** (banner navrch) | 1024 × 500 px | ✅ máme (feature-graphic-1024x500.png) |
| **Screenshoty telefonu** (6 ks) | 1146 × 2048 px | ✅ máme (složka screenshots/) |

**Screenshoty (hotové, ve složce `mobilní aplikace/screenshots/`):**
EAN, Hlavní stránka, Nákupní seznam, Provoz a Inventura, Recepty, Zásoby a připomínky.
Doporučené pořadí v obchodě (nejlepší první): Recepty → Hlavní stránka → EAN →
Nákup → Provoz → Zásoby. (Pozn.: Hlavní stránka je prázdná — kdyžtak časem přefotit s daty.)

### Tipy na screenshoty (co vyfotit z appky)
1. Spižírna s položkami (hlavní obrazovka)
2. Detail receptu / seznam receptů
3. Skenování čárového kódu
4. Nákupní seznam
5. Provozovna – inventura (pro „business" dojem)
6. (volitelně) hlasové zadávání

> Tip: screenshoty se dají „ozdobit" rámečkem telefonu a krátkým popiskem
> (např. „Měj přehled, co máš doma"). Dělá se to v Canvě nebo podobném nástroji.

### Feature graphic (1024×500)
Banner s logem Spižírny, sloganem („Chytrá správa potravin") na zeleném
gradientu v duchu Kitchen Harmony. Lze vytvořit v Canvě.

---

## Data safety dotazník (vyplníš v konzoli)
Co appka sbírá — připrav si tyto odpovědi:
- **E-mailová adresa** — ano (registrace), kvůli přihlášení účtu
- **Jméno** — ano (registrace)
- **Obsah uživatele** (položky, recepty) — primárně lokálně v zařízení
- **Kamera** — ano, jen pro skenování kódů (neukládá se)
- **Mikrofon** — ano, jen pro hlasové zadávání
- Data se NEsdílí s třetími stranami pro reklamu.

---

## Věkové hodnocení
- Dotazník v konzoli → appka nemá násilí, hazard ani nevhodný obsah →
  pravděpodobně **PEGI 3 / pro všechny**.
