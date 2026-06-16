# Jak dostat Spižírnu na Google Play — kompletní postup

Tenhle dokument popisuje cestu od současného stavu (webová aplikace na Vercelu)
k vydané Android aplikaci na Google Play, včetně placeného předplatného.

> **Současný stav:** Spižírna je webová aplikace (Next.js) běžící na Vercelu.
> Funguje v prohlížeči i jako PWA (přidat na plochu). Aby šla na Google Play,
> musí se "zabalit" do Android aplikace. Kód appky se nepřepisuje — webovka
> zůstává, jen dostane nativní obal.

---

## Přehled kroků (hrubě)

1. Rozhodnout způsob zabalení (TWA vs Capacitor) — **kvůli platbám doporučeno Capacitor**
2. Založit účet Google Play Developer (jednorázový poplatek 25 USD)
3. Zabalit webovku do Android aplikace
4. Připravit grafiku a texty pro obchod (ikona, screenshoty, popis)
5. Nastavit předplatné (produkty + platby přes Google Play Billing)
6. Napojit backend, který po zaplacení odemkne placené funkce
7. Nahrát, otestovat (interní test) a vydat

---

## 1) Způsob zabalení — TWA vs Capacitor

| | TWA | Capacitor (doporučeno) |
|---|---|---|
| Složitost zabalení | nejnižší | střední |
| Předplatné přes Google Play | krkolomné (Digital Goods API) | spolehlivé (plugin) |
| Funguje i na iOS / App Store | ❌ ne | ✅ ano |
| Přístup k nativním funkcím | omezený | plný (foťák, notifikace…) |

**Protože je předplatné priorita (a možná i iOS), doporučení = Capacitor + RevenueCat.**
RevenueCat je služba, která sjednotí Google Play Billing i Apple IAP a hlídá,
kdo má aktivní předplatné.

---

## 2) Účet Google Play Developer

- Jdi na **play.google.com/console**
- Zaregistruj se jako vývojář — **jednorázový poplatek 25 USD**
- Ověření identity (osobní/firemní). Může trvat pár dní.
- Pro placené appky/předplatné navíc nastavit **Payments profile** (bankovní účet,
  daňové údaje) — Google ti pak posílá výplaty z tržeb.

---

## 3) Zabalení do Android aplikace (Capacitor)

> Tohle je technická část — udělá se v projektu. Hrubý postup:

1. Přidat Capacitor do projektu (`@capacitor/core`, `@capacitor/android`).
2. Nastavit `capacitor.config` — **applicationId** (např. `ai.horsky.spizirna`),
   název appky, ikonu, splash screen.
3. Vygenerovat Android projekt (`npx cap add android`).
4. Buď appka načítá web z Vercelu (jednodušší údržba), nebo se buildne staticky
   dovnitř (funguje offline). Pro Spižírnu nejspíš načítání z Vercelu + cache.
5. Otestovat na reálném telefonu / emulátoru.

**Potřebné položky, které už máme:**
- ✅ Ikona aplikace (`public/icon-512.png` — oranžová sklenice)
- ✅ Název, barvy, manifest (`public/manifest.json`)

**Co bude potřeba dořešit:**
- **Podpisový klíč** (keystore) — Android appka musí být podepsaná. Klíč si
  pečlivě ulož, bez něj nepůjde vydat aktualizace! (Doporučeno: Play App Signing.)

---

## 4) Grafika a texty pro obchod (Store listing)

Google vyžaduje:
- **Ikona** 512×512 (máme)
- **Feature graphic** 1024×500 (banner navrch listingu) — nutno vytvořit
- **Screenshoty** telefonu (min. 2, ideál 4–8) — z reálné appky
- **Krátký popis** (max 80 znaků) + **dlouhý popis** (max 4000 znaků), CZ i SK
- **Kategorie** (např. Jídlo a pití / Produktivita)
- **Zásady ochrany soukromí** — odkaz na veřejnou stránku (POVINNÉ)
- Vyplnit dotazník **Data safety** (jaká data sbíráš — e-mail, atd.)
- Věkové hodnocení (dotazník)

> Pozn.: tady se hodí ty "Odkazy" v nastavení (Soukromí, Podmínky) — pro Google
> budeš muset mít reálnou stránku se zásadami ochrany soukromí.

---

## 5) Předplatné (Google Play Billing)

1. V **Play Console → Monetize → Subscriptions** vytvořit produkty:
   - `basic_monthly` — Základní, 99 Kč/měsíc
   - `family_monthly` — Rodinný, 149 Kč/měsíc
   (ceny, zkušební období, atd.)
2. Propojit s **RevenueCat** (nadefinovat tam "entitlements" = co plán odemyká).
3. V appce nahradit dnešní šablonová tlačítka **"Změnit plán" / "Zrušit
   předplatné"** za reálné volání RevenueCat SDK:
   - tlačítko → vyvolá Google platební okno
   - po zaplacení RevenueCat potvrdí a appka odemkne placené funkce
4. **Důležité pravidlo Googlu:** digitální předplatné MUSÍ jít přes Google Play
   Billing. Stripe ani externí brána pro to v appce nejsou povolené (jinak Google
   appku zamítne).
5. **Provize Googlu:** 15 % z předplatného (po prvním roce u trvajících odběratelů;
   první rok / drobní vývojáři mívají 15 %). Počítej s tím v ceně.

---

## 6) Backend — odemčení po zaplacení

Dnes se v Supabase pole `plan` jen zobrazuje, **nemění se podle platby.** Bude
potřeba:
- Po úspěšné platbě přepnout uživateli v Supabase `plan` na `basic`/`family`.
- Ověřit platnost nákupu (RevenueCat tohle z velké části řeší za tebe —
  pošle webhook, podle kterého se profil aktualizuje).
- Ošetřit zrušení / vypršení předplatného (vrátit na `free`).

---

## 7) Vydání

1. **Interní test** — nahraješ první build, přidáš pár testerů (e-maily), vyzkouší
   se instalace i platby v testovacím režimu (Google má sandbox pro nákupy).
2. **Uzavřený / otevřený test** (volitelně) — větší skupina.
3. **Produkční vydání** — Google appku zkontroluje (recenze trvá hodiny až dny).
4. Po schválení je appka na Google Play ke stažení.

---

## 8) Push notifikace (připomínky, návrat do appky)

> Cíl: aby měl uživatel appku v podvědomí a vracel se. Notifikace vyskočí na
> telefonu, i když je appka zavřená.

**Důležité:** plnohodnotné push notifikace fungují **jen z nativní appky**
(po zabalení do Capacitoru). Webovka v prohlížeči to umí jen omezeně, na iOS
skoro vůbec. → Notifikace se řeší AŽ po kroku 3 (Capacitor).

**Dva typy připomínek:**

**A) Naplánované podle dat (lokální notifikace)** — appka si je sama naplánuje
v telefonu, nepotřebuje server:
- "Mléku končí trvanlivost zítra — ať nepřijde nazmar 🥛"
- upozornění X dní před expirací (X dle nastavení uživatele)
- připomínka pravidelného nákupu ("Docházejí ti vajíčka?")
- → Capacitor plugin **@capacitor/local-notifications**

**B) Návykové / motivační (push z serveru)** — posílá server, drží aktivitu:
- "Už jsi dnes aktualizoval spížírnu?" (např. večer)
- "Mrkni na nové recepty" / "Odškrtni si dnešní nákup"
- → Capacitor plugin **@capacitor/push-notifications** + **Firebase Cloud
  Messaging (FCM)** (zdarma) + malý backend, který rozhoduje komu a kdy poslat

**Co bude potřeba:**
- ⬜ Capacitor pluginy (local + push notifications)
- ⬜ Firebase projekt + FCM (pro typ B)
- ⬜ Požádat uživatele o povolení notifikací (Android 13+ to vyžaduje explicitně)
- ⬜ V nastavení appky přepínače: které připomínky chce / nechce + čas
- ⬜ Logika plánování (kdy co poslat) — část v appce (A), část na serveru (B)
- ⬜ Respektovat, když uživatel notifikace vypne (už máme přepínač "expiry-notifications")

**Pozn.:** v appce už je v Nastavení přepínač upozornění na expiraci — ten se
napojí na reálné notifikace, až bude Capacitor.

---

## Co máme hotové vs co zbývá

**Hotové (appka samotná):**
- ✅ Funkční aplikace (spižírna, recepty, nákup, provozovna/inventura, skener)
- ✅ Přihlášení + registrace (Supabase)
- ✅ Dvojjazyčnost CZ/SK vč. hlasového zadávání
- ✅ Ikona, manifest, barvy
- ✅ Šablona plánů v nastavení (čeká na napojení plateb)

**Zbývá k vydání na Google Play:**
- ⬜ Rozhodnout a provést zabalení (Capacitor)
- ⬜ Účet Google Play Developer (25 USD)
- ⬜ Podpisový klíč (keystore)
- ⬜ Vlastní SMTP (Resend) — aby e-maily chodily CZ/SK
- ⬜ Veřejná stránka Zásady ochrany soukromí (povinné pro Google)
- ⬜ Grafika obchodu (feature graphic, screenshoty) + popisy
- ⬜ Předplatné: produkty v Play Console + RevenueCat + tlačítka v appce
- ⬜ Backend: po zaplacení přepnout `plan` v Supabase
- ⬜ Push notifikace (připomínky expirace + návykové) — viz sekce 8
- ⬜ Interní test → produkční vydání

---

## Doporučené pořadí

1. **Nejdřív zpětná vazba od Markétky** (funguje appka v praxi?)
2. **Zabalit do Capacitoru** a vyzkoušet jako reálnou appku na telefonu
3. **Účet Google Play + podpisový klíč + privacy policy**
4. **Předplatné** (RevenueCat + tlačítka + backend)
5. **Push notifikace** (připomínky + návykové) — viz sekce 8
6. **Interní test → vydání**
