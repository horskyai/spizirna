# Plán: Varianta 2 — sdílená inventura přes cloud (majitel + zaměstnanec, každý svůj telefon)

> Volitelná funkce. Zaměstnavatel u inventury vybere: **„sám / půjčím telefon"** (jako teď)
> NEBO **„poslat zaměstnanci na jeho telefon"** (nové, přes cloud).

## Kde je dnes problém
Celý provozní sklad (`provozStore`) je **jen v localStorage jednoho telefonu**. Nic není
v cloudu. Aby zaměstnanec viděl inventuru na svém zařízení, musí se sklad + inventura
přesunout/synchronizovat přes Supabase.

---

## Co se musí udělat (5 částí)

### 1. Databáze v Supabase (sklad do cloudu)
Nové tabulky (zrcadlí dnešní lokální `provozStore`):
- `provoz_sklad` — položky skladu (nazev, kategorie, jednotka, aktualniStav, minZasoba, cena, dodavatelId, foto)
- `provoz_inventury` — inventury (nazev, datum, zavrena, slepa)
- `provoz_zaznamy` — zápisy inventury (inventura_id, polozka_id, skutecnyStav, ocekavanyStav)
- `provoz_dodavatele`, `provoz_odpisy`
- Vše navázané na `provozovna_id` (viz bod 2) + RLS podle role.

### 2. Provozovna + role (kdo je majitel, kdo zaměstnanec)
- Využít existující `families` / `family_members` (už v DB!) NEBO nová `provozovny` + `provoz_clenove`.
- Role: **majitel** (vidí vše, ceny, marže, spravuje) vs. **zaměstnanec** (jen přiřazená inventura, slepý režim).
- **Pozvánka zaměstnance:** majitel vygeneruje kód / pošle e-mail → zaměstnanec se přidá k provozovně.

### 3. Přepis provozStore (lokální → cloud sync)
- Dnes zustand+localStorage → nově číst/zapisovat do Supabase.
- **Živá synchronizace** (Supabase Realtime): zaměstnanec zapíše stav → majitel to vidí u sebe.
- **Offline fallback:** ve skladu bývá slabý signál → zápisy cachovat lokálně a poslat po připojení.

### 4. Volba u inventury (to, cos chtěl)
- Při zakládání inventury přepínač: **„Dělám sám (jeden telefon)"** vs. **„Poslat zaměstnanci"**.
- U „poslat zaměstnanci" → vybere zaměstnance z týmu, inventura se mu objeví na jeho telefonu (slepě).
- Zaměstnanec **neví**, že je slepá — prostě jen počítá a zadává.

### 5. Zabezpečení (RLS)
- Zaměstnanec nesmí přes API vytáhnout ceny/očekávané stavy (slepost musí platit i na úrovni databáze, ne jen skrytím v UI — jinak by to šlo obejít).

---

## Rizika / dopady
- **Velká změna základu** appky (lokální → cloud). Riziko rozbití toho, co teď funguje.
- **Náklady:** Supabase free tier zatím stačí, ale Realtime + víc dat = blíž k placenému.
- **Souvisí s „rodinou/sdílením"**, kterou má appka rozjetou, ale nedodělanou — dá se to spojit.
- **Nejlépe dělat ve fázi Google Play** (spolu s cloud syncem domácnosti, platbami, notifikacemi).

## Odhad rozsahu
Největší jednotlivá feature v projektu — realisticky několik samostatných kroků
(DB → role/pozvánky → přepis storu → realtime → UI volba → RLS test).

## Doporučení
Nechat kamarádku dotestovat **Variantu 1 (jeden telefon, slepá inventura funguje)**.
Do Varianty 2 jít až se rozhodne pro Google Play — je to logická součást „appka jde do světa",
ne fáze „testuju na Vercelu".
