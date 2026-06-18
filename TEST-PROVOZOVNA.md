# Testovací návod — Provozovna (od A do Z)

Projdi body popořadě a odškrtávej. U každého je co dělat a co očekávat.
Když něco nesedí, poznač si to.

> Tip: testuj na telefonu přes `spizirna-nine.vercel.app`. Po každé změně na
> webu dej tvrdý refresh (zavřít záložku a otevřít znovu), ať máš nejnovější verzi.

---

## 0) Příprava — účet v režimu provozovna

- [ ] Otevři appku. Pokud jsi přihlášený jako domácnost, **odhlas se** (Nastavení → Odhlásit).
- [ ] (Pro čistý test) můžeš smazat testovací účet v Supabase → Users a začít znovu.
- [ ] Vyber jazyk → vyber režim **Provozovna**.
- [ ] **Zaregistruj se** novým e-mailem (heslo min. 8 znaků).
- [ ] ✅ Po registraci jsi rovnou uvnitř (žádný potvrzovací e-mail).
- [ ] Mrkni do Supabase → Table Editor → `profiles`: tvůj řádek má `mode = provoz`.

---

## 1) Onboarding a vzhled

- [ ] V hlavičce nahoře je odznak **„Provozovna"** (oranžový).
- [ ] Dole je navigace: Spižírna · Recepty · Skenovat · Nákup · **Provoz** (ne „Opakování").
- [ ] Nahoře jsou tlačítka **„?"** (příručka) a **ozubené kolo** (nastavení).

---

## 2) Příručky (uvítací tipy)

- [ ] Při prvním otevření okna se sama ukáže příručka.
- [ ] V tabu **Spižírna** klepni na „?" → příručka mluví o **skladu** (ne o lednici/mrazáku).
- [ ] V tabu **Provoz** klepni na „?" → příručka o inventuře (naložení, inventura, export).

---

## 3) Naplnění skladu — 3 způsoby

### A) Ručně (tab Provoz)
- [ ] Jdi do tabu **Provoz** → přidej položku ručně.
- [ ] Vyplň: název (např. „Mouka hladká"), jednotku (kg), min. zásobu (5), cenu (15).
- [ ] ✅ Položka se objeví ve skladu.

### B) Hlasem
- [ ] Přidej položku **hlasem** — řekni např. „pět kilo cibule, deset litrů oleje".
- [ ] ✅ Položky se rozpoznají a přidají (zkontroluj množství a jednotky).

### C) Skenováním (balené zboží s EAN)
- [ ] Jdi do tabu **Skenovat** → naskenuj čárový kód (např. Dobrá voda, kečup).
- [ ] V detailu produktu klepni **„Přidat do skladu"** (NE „do spižírny").
- [ ] ✅ Položka se přidá do skladu i s fotkou (pokud ji databáze má).

---

## 4) Spižírna = sklad (propojení)

- [ ] Jdi do tabu **Spižírna**.
- [ ] ✅ Ukazuje **stejné položky** jako sklad v tabu Provoz (ne prázdnou domácí spižírnu).
- [ ] U položek vidíš: fotku (nebo emoji kategorie), název, min. zásobu, cenu.
- [ ] Vyzkoušej **hledání** ve skladu.
- [ ] Klepni na **„Otevřít inventuru →"** → přepne tě do tabu Provoz.

---

## 5) Fotky položek

- [ ] V tabu Provoz uprav položku (ikona tužky).
- [ ] Sekce **„Fotka položky"** → zkus **Fotit** (foťák) i **Galerie**.
- [ ] ✅ Náhled fotky se zobrazí, dá se smazat křížkem.
- [ ] Ulož → ✅ ve Spižírně (seznam skladu) se u položky ukáže fotka místo emoji.

---

## 6) Inventura ⭐ (hlavní funkce)

- [ ] V tabu Provoz založ **novou inventuru** (dej jí název, např. „Konec týdne").
- [ ] Projdi položky a u každé zadej **skutečný stav** (kolik fyzicky máš).
- [ ] ✅ Položky **pod minimem** se zvýrazní (oranžově / štítek „Pod minimem").
- [ ] ✅ Appka spočítá **celkovou hodnotu skladu** (stav × cena).
- [ ] Zkontroluj, že čísla sedí.

---

## 7) Export inventury

- [ ] U hotové inventury zkus **export do PDF**.
- [ ] ✅ PDF se stáhne, jde otevřít, tabulka sedí (název, množství, cena, hodnota, pod minimem).
- [ ] Zkus i **export do CSV/Excel**.
- [ ] ✅ CSV jde otevřít v Excelu, diakritika OK.

---

## 8) Dodavatelé (pokud používáš)

- [ ] V tabu Provoz přidej **dodavatele** (název, telefon, e-mail).
- [ ] ✅ Dodavatel se uloží a jde k němu přiřadit položka.

---

## 9) Recepty + „Co uvařím dnes?"

- [ ] Jdi do tabu **Recepty**.
- [ ] Nahoře je widget **„Co uvařím dnes?"** — počítá podle **skladu** provozovny.
- [ ] ✅ „Suroviny v spižírně X/Y" odpovídá tomu, co máš reálně ve skladu.
- [ ] Zkus filtry receptů (Vše, Česká klasika, Slovenská kuchyně...).
- [ ] U receptu zkus **„+X na seznam"** → chybějící suroviny se přidají do Nákupu.

---

## 10) Nákupní seznam

- [ ] Jdi do tabu **Nákup**.
- [ ] ✅ Jsou tam suroviny přidané z receptu (krok 9).
- [ ] Přidej položku **hlasem** i ručně.
- [ ] Odškrtni položku → ✅ přesune se mezi koupené.

---

## 11) Nastavení

- [ ] Otevři ozubené kolo. Zkontroluj sekce:
- [ ] **Účet** — tvé jméno + e-mail, tlačítko Odhlásit.
- [ ] **Plán** — ukazuje plán + zbývající zkušební dobu (2 týdny).
- [ ] ✅ **NENÍ** tam přepínač režimu (režim je pevný).
- [ ] ✅ **NENÍ** tam Denní cíl (ten je jen v domácnosti).
- [ ] **Notifikace** — přepínač upozornění na expiraci.
- [ ] **Odkazy** — Časté dotazy (/faq), Podpora (otevře e-mail), Soukromí, Podmínky.
- [ ] **Správa dat** — Vymazat všechna data.

---

## 12) Jeden e-mail = jeden režim

- [ ] Odhlas se. Zkus se přihlásit **stejným účtem** na zařízení nastaveném na domácnost.
- [ ] ✅ Appka tě přepne zpět na **provozovnu** (režim z účtu má přednost).

---

## 13) Obnova hesla

- [ ] Odhlas se → na přihlašovací obrazovce **„Zapomněli jste heslo?"**.
- [ ] Zadej e-mail → přijde odkaz (anglicky — CZ/SK bude až s doménou).
- [ ] Klikni na odkaz → ✅ pustí tě na stránku pro nové heslo (NE chyba „nepodařilo se připojit").

---

## Co poznačit, když něco nesedí
- Kde přesně (které okno / tlačítko)
- Co jsi čekal vs co se stalo
- Screenshot, pokud to jde

---

## Známá omezení (NEjsou chyby)
- E-maily (reset hesla) chodí **anglicky** — čeká na vlastní doménu + SMTP.
- Platby/předplatné jsou jen **šablona** — nejde reálně koupit (až s Google Play).
- Trial zatím **nic nezamyká** po vypršení (platby nejsou napojené).
- Notifikace nevyskakují mimo appku (až po zabalení do nativní appky).
