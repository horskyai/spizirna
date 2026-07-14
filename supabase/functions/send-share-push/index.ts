// Edge Function: pošle push notifikaci ostatním členům rodiny/provozovny,
// když někdo změní sdílená data. Volá se z appky po přidání položky.
//
// Vstup (JSON): { scope: "family" | "provoz", groupId: string, title: string, body: string }
// - najde ostatní členy skupiny (kromě volajícího)
// - načte jejich FCM push tokeny
// - pošle push přes FCM HTTP v1 API
//
// Secret FIREBASE_SERVICE_ACCOUNT (celý JSON klíč) nastav v Supabase:
//   Dashboard → Project Settings → Edge Functions → Secrets.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── FCM OAuth token z service account klíče (bez externí knihovny) ──────────
async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = `${b64(header)}.${b64(claim)}`;

  // Naimportuj PEM privátní klíč a podepiš JWT (RS256).
  const pem = sa.private_key.replace(/\\n/g, "\n");
  const der = pemToArrayBuffer(pem);
  const key = await crypto.subtle.importKey(
    "pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwt = `${unsigned}.${sigB64}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const json = await res.json();
  return json.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

Deno.serve(async (req: Request) => {
  try {
    const { scope, groupId, title, body } = await req.json();
    if (!scope || !groupId) {
      return new Response(JSON.stringify({ error: "missing scope/groupId" }), { status: 400 });
    }

    // Kdo volá (z JWT) — jemu push neposíláme (je to jeho vlastní změna).
    const authHeader = req.headers.get("Authorization") ?? "";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: caller } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    const callerId = caller?.user?.id ?? null;

    // Najdi členy skupiny (rodina / provozovna)
    const memberTable = scope === "provoz" ? "provozovna_members" : "family_members";
    const groupCol = scope === "provoz" ? "provozovna_id" : "family_id";
    const { data: members } = await admin
      .from(memberTable).select("user_id").eq(groupCol, groupId);
    const otherIds = (members ?? []).map((m: { user_id: string }) => m.user_id).filter((id) => id !== callerId);
    if (otherIds.length === 0) return new Response(JSON.stringify({ sent: 0 }));

    // Načti jejich push tokeny
    const { data: tokens } = await admin
      .from("push_tokens").select("token").in("user_id", otherIds);
    const tokenList = (tokens ?? []).map((t: { token: string }) => t.token);
    if (tokenList.length === 0) return new Response(JSON.stringify({ sent: 0 }));

    // FCM
    const sa = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT")!);
    const accessToken = await getAccessToken(sa);
    let sent = 0;
    for (const token of tokenList) {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: title || "Spižírna", body: body || "Něco se změnilo" },
            android: { priority: "high" },
          },
        }),
      });
      if (r.ok) sent++;
    }
    return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
