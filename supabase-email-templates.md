# Nastavení přihlášení a e-mailů (Supabase)

Přihlašování běží přes **Supabase Auth**. E-maily (potvrzení registrace, reset hesla)
posílá Supabase server podle šablon v dashboardu — **ne** kód aplikace. Proto se
jejich text mění v dashboardu, ne v repu.

---

## 1) Vypnout potvrzování e-mailem (po registraci rovnou přihlášen)

V aplikaci už je flow upravený: pokud Supabase nevyžaduje potvrzení, je uživatel
po registraci rovnou přihlášený. Zbývá to vypnout v dashboardu:

**Supabase Dashboard → Authentication → Providers → Email**
- Vypni přepínač **"Confirm email"** (Uložit).

Hotovo — registrace teď nepošle žádný e-mail a uživatel jde rovnou do aplikace.

---

## 1b) Reset hesla — Redirect URL

Obnova hesla je v aplikaci napojená: na přihlašovací obrazovce je odkaz
**„Zapomněli jste heslo?"**, který pošle e-mail s odkazem. Odkaz vede na stránku
`/reset`, kde uživatel zadá nové heslo.

Aby Supabase ten odkaz povolil, přidej `/reset` mezi povolené redirecty:

**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**
- Přidej `https://<tvoje-doména>/reset` (a pro vývoj `http://localhost:3000/reset`).

V šabloně **Reset password** níže musí být odkaz `{{ .ConfirmationURL }}` —
ten už na `/reset` ukazuje sám (řídí ho `redirectTo` v kódu).

---

## 2) Dvojjazyčné šablony e-mailů

Reset hesla používá šablonu níže. Confirm signup / Magic Link jsou volitelné
(potvrzování je teď vypnuté). Zkopíruj HTML do dashboardu:

**Supabase Dashboard → Authentication → Emails → Templates**

Supabase má jen jednu šablonu na typ e-mailu (nezná jazyk uživatele), proto jsou
šablony dvojjazyčné — čeština nahoře, slovenština dole.

### Confirm signup (Potvrzení registrace)

Subject: `Potvrďte registraci · Potvrďte registráciu — Spižírna`

```html
<h2>Vítejte ve Spižírně! 🥦</h2>
<p>Děkujeme za registraci. Pro dokončení potvrďte svůj e-mail kliknutím na tlačítko níže:</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 24px;background:#6B8F5E;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold">Potvrdit e-mail</a></p>
<p style="color:#888;font-size:13px">Pokud jste se neregistrovali, tento e-mail ignorujte.</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<h2>Vitajte v Špajze! 🥦</h2>
<p>Ďakujeme za registráciu. Na dokončenie potvrďte svoj e-mail kliknutím na tlačidlo nižšie:</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 24px;background:#6B8F5E;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold">Potvrdiť e-mail</a></p>
<p style="color:#888;font-size:13px">Ak ste sa neregistrovali, tento e-mail ignorujte.</p>
```

### Reset password (Obnova hesla)

Subject: `Obnova hesla · Obnova hesla — Spižírna`

```html
<h2>Obnova hesla</h2>
<p>Klikněte na tlačítko níže pro nastavení nového hesla:</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 24px;background:#6B8F5E;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold">Nastavit nové heslo</a></p>
<p style="color:#888;font-size:13px">Pokud jste o obnovu nežádali, tento e-mail ignorujte.</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<h2>Obnova hesla</h2>
<p>Kliknite na tlačidlo nižšie pre nastavenie nového hesla:</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 24px;background:#6B8F5E;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold">Nastaviť nové heslo</a></p>
<p style="color:#888;font-size:13px">Ak ste o obnovu nežiadali, tento e-mail ignorujte.</p>
```

### Magic Link (Přihlášení odkazem)

Subject: `Přihlášení · Prihlásenie — Spižírna`

```html
<h2>Přihlášení do Spižírny</h2>
<p>Klikněte na tlačítko pro přihlášení:</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 24px;background:#6B8F5E;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold">Přihlásit se</a></p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<h2>Prihlásenie do Špajze</h2>
<p>Kliknite na tlačidlo pre prihlásenie:</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 24px;background:#6B8F5E;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold">Prihlásiť sa</a></p>
```

---

## Pozn. k plně automatickému jazyku

Aby Čech dostal jen CS a Slovák jen SK e-mail, by se muselo přejít na vlastní
posílání (Supabase **Auth Hook** / vlastní SMTP s logikou podle jazyka). To je
výrazně víc práce na backendu — dvojjazyčná šablona výše je praktický kompromis.

---

## 3) Vlastní SMTP (Resend) — aby e-maily chodily česky/slovensky

**Proč:** Bez vlastního SMTP posílá Supabase e-maily ze sdíleného serveru — chodí
**anglicky** (nejde editovat šablonu) a s limitem pár e-mailů/hodinu. Vlastní SMTP
odemkne editaci šablon (vložíš dvojjazyčný text výše) a zruší limit.

**Čeká na:** vlastní doménu (např. spizirna.cz). Bez domény jde jen Resend test
režim (chodí z onboarding@resend.dev jen na tvůj ověřený e-mail — pro test, ne pro
reálné uživatele).

### Postup krok za krokem (až bude doména)

**A) Resend účet + doména**
1. Registrace na **resend.com** (free tier: 3 000 e-mailů/měsíc).
2. **Domains → Add Domain** → zadej svou doménu (např. `spizirna.cz`).
3. Resend ukáže pár **DNS záznamů** (SPF, DKIM, většinou TXT/CNAME). Ty přidej
   u svého registrátora domény (kde jsi doménu koupil → správa DNS).
4. Počkej na ověření (pár minut až hodin). Až je doména „Verified", pokračuj.

**B) SMTP údaje z Resendu**
5. V Resendu **API Keys → Create API Key** (nebo sekce SMTP) → získáš:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) nebo `587` (TLS)
   - User: `resend`
   - Password: tvůj **API klíč** (začíná `re_...`)

**C) Zapojení do Supabase**
6. **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**
   (nebo Authentication → Emails → SMTP).
7. Zapni **Custom SMTP** a vyplň:
   - Sender email: `noreply@spizirna.cz` (musí být na ověřené doméně!)
   - Sender name: `Spižírna`
   - Host / Port / User / Password z kroku 5.
8. Ulož.

**D) Vložit dvojjazyčné šablony**
9. Teď už **Authentication → Emails → Templates** dovolí editaci (Subject + Body).
   Vlož HTML šablony ze sekce 2 výše (Confirm signup / Reset password / Magic Link).

**E) Test**
10. V appce zkus „Zapomněli jste heslo?" → e-mail by měl dorazit z `noreply@spizirna.cz`,
    dvojjazyčně (CZ + SK), bez limitu.

> Pozn.: Sender email musí být na **ověřené doméně** v Resendu. Z Gmailu
> (`spizirnacz@gmail.com`) odesílat přes Resend NELZE — Gmail je jen kontaktní
> schránka, ne odesílací doména.
