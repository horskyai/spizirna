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

## 2) (Volitelné) Dvojjazyčné šablony e-mailů

Pokud někdy potvrzování zapneš zpět, nebo chceš lokalizovat reset hesla,
zkopíruj níže uvedené HTML do dashboardu:

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
