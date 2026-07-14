// Registrace push notifikací (FCM) — jen v nativní appce.
// Získá token zařízení a uloží ho do Supabase (push_tokens). Server (Edge
// Function) pak podle tokenu pošle push ostatním členům rodiny/provozovny,
// když se změní sdílená data. Web push neřeší.

import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";

let inicializovano = false;

// Zaregistruje zařízení pro push a uloží token do Supabase. Volá se po přihlášení.
export async function initPush(): Promise<void> {
  if (!Capacitor.isNativePlatform() || inicializovano) return;
  inicializovano = true;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Oprávnění
    const perm = await PushNotifications.checkPermissions();
    let stav = perm.receive;
    if (stav === "prompt" || stav === "prompt-with-rationale") {
      stav = (await PushNotifications.requestPermissions()).receive;
    }
    if (stav !== "granted") return;

    // Při úspěšné registraci přijde token → ulož ho do DB.
    await PushNotifications.addListener("registration", async (token: { value: string }) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid || !token?.value) return;
        await supabase.from("push_tokens").upsert(
          { user_id: uid, token: token.value, platform: "android", updated_at: new Date().toISOString() },
          { onConflict: "user_id,token" },
        );
      } catch { /* uložení tokenu není kritické */ }
    });

    // (chyby registrace jen ignorujeme — appka funguje i bez push)
    await PushNotifications.addListener("registrationError", () => {});

    // Spusť registraci u FCM
    await PushNotifications.register();
  } catch {
    // push plugin nedostupný / chyba → appka jede dál
  }
}
