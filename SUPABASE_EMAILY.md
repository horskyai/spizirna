# Dvojjazyčné e-mailové šablony pro Supabase (CZ + SK)

**Kam to patří:** Supabase dashboard → projekt → **Authentication → Emails → Templates**.
Pro každou šablonu níže přepiš pole **Subject** a **Message body (HTML)**.

Supabase do těla dosazuje proměnné ve dvojitých složených závorkách — hlavně
`{{ .ConfirmationURL }}` (odkaz, na který uživatel klikne). Ty nech přesně tak,
jak jsou, jinak odkaz přestane fungovat.

---

## 1) Reset hesla (Reset Password) — TOHLE ŘEŠÍME TEĎ

**Subject:**
```
Obnovení hesla · Obnovenie hesla — Spižírna
```

**Message body (HTML):**
```html
<h2>Obnovení hesla</h2>
<p>Ahoj, dostali jsme žádost o obnovení hesla k tvému účtu ve Spižírně.</p>
<p>Klikni na tlačítko níže a nastav si nové heslo:</p>
<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#4CAF82;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;">
    Nastavit nové heslo
  </a>
</p>
<p style="color:#888;font-size:13px;">Pokud jsi o obnovení hesla nežádal, tento e-mail můžeš ignorovat — heslo zůstane beze změny.</p>

<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">

<h2>Obnovenie hesla</h2>
<p>Ahoj, dostali sme žiadosť o obnovenie hesla k tvojmu účtu v Špajze.</p>
<p>Klikni na tlačidlo nižšie a nastav si nové heslo:</p>
<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#4CAF82;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;">
    Nastaviť nové heslo
  </a>
</p>
<p style="color:#888;font-size:13px;">Ak si o obnovenie hesla nežiadal, tento e-mail môžeš ignorovať — heslo zostane bez zmeny.</p>
```

---

## 2) Potvrzení registrace (Confirm signup)

**Subject:**
```
Potvrď svůj e-mail · Potvrď svoj e-mail — Spižírna
```

**Message body (HTML):**
```html
<h2>Vítej ve Spižírně!</h2>
<p>Děkujeme za registraci. Potvrď prosím svůj e-mail kliknutím na tlačítko:</p>
<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#4CAF82;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;">
    Potvrdit e-mail
  </a>
</p>
<p style="color:#888;font-size:13px;">Pokud sis účet nezakládal, tento e-mail můžeš ignorovat.</p>

<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">

<h2>Vitaj v Špajze!</h2>
<p>Ďakujeme za registráciu. Potvrď prosím svoj e-mail kliknutím na tlačidlo:</p>
<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#4CAF82;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;">
    Potvrdiť e-mail
  </a>
</p>
<p style="color:#888;font-size:13px;">Ak si si účet nezakladal, tento e-mail môžeš ignorovať.</p>
```

---

## 3) Změna e-mailu (Change Email Address) — volitelné

**Subject:**
```
Potvrď změnu e-mailu · Potvrď zmenu e-mailu — Spižírna
```

**Message body (HTML):**
```html
<h2>Změna e-mailu</h2>
<p>Potvrď prosím změnu e-mailové adresy u svého účtu ve Spižírně:</p>
<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#4CAF82;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;">
    Potvrdit změnu
  </a>
</p>

<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">

<h2>Zmena e-mailu</h2>
<p>Potvrď prosím zmenu e-mailovej adresy pri svojom účte v Špajze:</p>
<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#4CAF82;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;">
    Potvrdiť zmenu
  </a>
</p>
```

---

## Poznámky
- **Barva `#4CAF82`** je zelená appky — kdyžtak uprav podle značky.
- `{{ .ConfirmationURL }}` = odkaz, na který uživatel klikne (u resetu vede na
  `/reset` v appce, kde si nastaví nové heslo). NEMĚNIT.
- Šablona je **jedna pro všechny jazyky**, proto CZ i SK pod sebou. Kdo mluví česky,
  přečte si horní část; Slovák spodní.
- Odesílatel/„from" adresu a SMTP nastavíš zvlášť v **Authentication → Emails → SMTP Settings**
  (bez vlastního SMTP posílá Supabase z obecné adresy s limitem ~3–4 e-maily/hodinu —
  na test stačí, pro ostrý provoz doporučuji vlastní SMTP/službu).
```
