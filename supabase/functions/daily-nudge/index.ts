// Edge Function: přátelský push uživatelům DOMÁCNOSTI (cron v 9:00 Praha).
// Spouští ji pg_cron — ne appka. Chráněno sdíleným tajemstvím v ?key=...
//
// Obsah: milé hlášky vybrané podle SKUTEČNÉ pražské denní doby (ráno/odpoledne/
// večer), ať nikdy nepřijde "Dobré ráno" odpoledne. Žádná osobní data.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   FIREBASE_SERVICE_ACCOUNT  – celý JSON klíč (už existuje)
//   DAILY_NUDGE_KEY           – náhodné tajemství, musí sedět s cronem

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Přátelské hlášky (CZ + SK) rozdělené podle denní doby ────────────────────
// Pozdrav se vybere podle SKUTEČNÉ pražské hodiny, ať nikdy nepřijde
// "Dobré ráno" odpoledne (kdyby se funkce spustila v jiný čas než 9:00).
type Msg = { cs: { t: string; b: string }; sk: { t: string; b: string } };

const RANO: Msg[] = [
  { cs: { t: "Dobré ráno! ☀️", b: "Podívala ses dnes do Spižírny?" },
    sk: { t: "Dobré ráno! ☀️", b: "Pozrela si sa dnes do Špajze?" } },
  { cs: { t: "Ahoj! 🍳", b: "Co dobrého dneska uvaříš? Mrkni do Spižírny." },
    sk: { t: "Ahoj! 🍳", b: "Čo dobré dnes uvaríš? Pozri sa do Špajze." } },
  { cs: { t: "Nový den 🫙", b: "Zkontroluj Spižírnu, ať máš přehled." },
    sk: { t: "Nový deň 🫙", b: "Skontroluj Špajzu, nech máš prehľad." } },
];
const ODPOLEDNE: Msg[] = [
  { cs: { t: "Co dneska na stůl? 😋", b: "Nech se inspirovat recepty ve Spižírně." },
    sk: { t: "Čo dnes na stôl? 😋", b: "Nechaj sa inšpirovať receptami v Špajzi." } },
  { cs: { t: "Už víš, co k večeři? 🍽️", b: "Koukni, co máš doma, a dej se do toho." },
    sk: { t: "Už vieš, čo na večeru? 🍽️", b: "Pozri, čo máš doma, a pusti sa do toho." } },
];
const VECER: Msg[] = [
  { cs: { t: "Dobrý večer 🌙", b: "Zkontroluj Spižírnu, ať zítra víš, co máš." },
    sk: { t: "Dobrý večer 🌙", b: "Skontroluj Špajzu, nech zajtra vieš, čo máš." } },
  { cs: { t: "Chybíš nám! 💚", b: "Jak to vypadá ve tvojí Spižírně?" },
    sk: { t: "Chýbaš nám! 💚", b: "Ako to vyzerá v tvojej Špajzi?" } },
];

// Aktuální hodina v Praze (bez závislosti na TZ serveru).
function prahaHodina(): number {
  const s = new Date().toLocaleString("en-US", { timeZone: "Europe/Prague", hour: "2-digit", hour12: false });
  return parseInt(s, 10);
}

// Sada podle denní doby: ráno 5–11, odpoledne 12–17, jinak večer.
function sadaProCas(): Msg[] {
  const h = prahaHodina();
  if (h >= 5 && h < 12) return RANO;
  if (h >= 12 && h < 18) return ODPOLEDNE;
  return VECER;
}

// Deterministický výběr podle dne (každý den jiná hláška ze sady, stabilně).
function pickByDay(len: number): number {
  const daySeed = Math.floor(Date.now() / 86_400_000);
  return Math.abs((daySeed * 1103515245 + 12345) >> 8) % len;
}

// ── FCM OAuth token ze service account klíče ──────────────────────────────────
async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  };
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = `${b64(header)}.${b64(claim)}`;
  const pem = sa.private_key.replace(/\\n/g, "\n");
  const der = pemToArrayBuffer(pem);
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwt = `${unsigned}.${sigB64}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  return (await res.json()).access_token;
}
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

Deno.serve(async (req: Request) => {
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Ochrana: jen s platným tajemstvím (cron ho pošle v ?key=...).
    // Klíč je uložený v privátní tabulce app_secrets (čte ho jen service role).
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const { data: secretRow } = await admin
      .from("app_secrets").select("value").eq("name", "daily_nudge_key").maybeSingle();
    if (!key || key !== secretRow?.value) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }

    // Načti push tokeny. Ranní přátelská hláška ("Co dneska uvaříš?") je jen pro
    // DOMÁCNOST — majitelům provozu nedává smysl (ti mají vlastní večerní lokální
    // notifikace: sklad/tržba/uzávěrka). Vyřadíme proto uživatele s mode='provoz'.
    const { data: tokens } = await admin.from("push_tokens").select("token, locale, user_id");
    let list = tokens ?? [];
    if (list.length > 0) {
      const { data: provozUsers } = await admin
        .from("profiles").select("id").eq("mode", "provoz");
      const provozSet = new Set((provozUsers ?? []).map((p: { id: string }) => p.id));
      list = list.filter((t: { user_id?: string }) => !t.user_id || !provozSet.has(t.user_id));
    }
    if (list.length === 0) return new Response(JSON.stringify({ sent: 0 }));

    const sada = sadaProCas();
    const msg = sada[pickByDay(sada.length)];

    const sa = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT")!);
    const accessToken = await getAccessToken(sa);

    let sent = 0, failed = 0;
    for (const row of list as { token: string; locale?: string }[]) {
      const loc = row.locale === "sk" ? "sk" : "cs";
      const m = msg[loc];
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token: row.token,
            notification: { title: m.t, body: m.b },
            android: { priority: "high", notification: { channel_id: "spizirna-daily" } },
          },
        }),
      });
      if (r.ok) sent++; else failed++;
    }
    return new Response(JSON.stringify({ sent, failed, msg: msg.cs.t }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
