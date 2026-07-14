// Lokální notifikace (jen v nativní appce přes Capacitor).
//
// DĚLBA PRÁCE:
// - Obecné přátelské ranní hlášky ("Ahoj! Co dneska uvaříš?") posílá SERVER
//   přes push (Firebase, edge funkce daily-nudge + pg_cron, 9:00 Praha) —
//   spolehlivě i při zavřené appce. (viz supabase/functions/daily-nudge)
// - Tady lokálně plánujeme JEN jmenovité připomínky ze "Zásoby a připomínky"
//   (dueReminders) — ty server nezná, jsou jen na zařízení.
//
// Web (prohlížeč) tohle NEpoužívá — Capacitor plugin funguje jen v appce.

import { Capacitor } from "@capacitor/core";
import { getCurrentLocale } from "@/store/localeStore";

const CHANNEL_ID = "spizirna-daily";
const NOTIF_ID_BASE = 4200; // pevný rozsah ID pro naše denní notifikace
const DAYS_AHEAD = 7;       // kolik ID rušit při úklidu (kvůli starým verzím)

// Zapnuto? (přepínač v Nastavení ukládá do localStorage EXPIRY_NOTIF_KEY)
function isEnabled(): boolean {
  try {
    return localStorage.getItem("expiry-notifications") !== "off";
  } catch {
    return true;
  }
}

// Naplánuje lokální jmenovitou připomínku "Zásoby a připomínky" na 9:00.
// Obecné ranní hlášky řeší server push (viz komentář nahoře), tady se plánuje
// jen konkrétní "Dnes kup: …" podle dueReminders. Volá se při startu appky.
// Parametry expiringCount/shoppingCount/lastOpenedDaysAgo zůstávají pro zpětnou
// kompatibilitu volajících, ale obsah notifikace už neovlivňují.
export async function scheduleDailyNudges(opts: {
  expiringCount?: number;
  shoppingCount?: number;
  lastOpenedDaysAgo?: number;
  // Názvy položek ze "Zásoby a připomínky", kterým právě nadešel čas koupit.
  dueReminders?: string[];
}): Promise<void> {
  // Jen v nativní appce — web notifikace neplánuje.
  if (!Capacitor.isNativePlatform()) return;
  if (!isEnabled()) {
    await cancelDailyNudges();
    return;
  }

  const { LocalNotifications } = await import("@capacitor/local-notifications");

  // Oprávnění
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") {
    const req = await LocalNotifications.requestPermissions();
    if (req.display !== "granted") return;
  }

  // Android kanál (povinné od Androidu 8) — ať notifikace mají jméno/zvuk.
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: getCurrentLocale() === "sk" ? "Špajza – pripomienky" : "Spižírna – připomínky",
      importance: 3,
      visibility: 1,
    });
  } catch {}

  // Zruš předchozí naplánované (ať se nehromadí)
  await cancelDailyNudges();

  const locale = getCurrentLocale() === "sk" ? "sk" : "cs";
  const now = new Date();

  // POZN.: Obecné přátelské ranní hlášky ("Ahoj! Co dneska uvaříš?") teď posílá
  // SERVER přes push (Firebase, edge funkce daily-nudge + pg_cron v 9:00 Praha) —
  // spolehlivě i při zavřené appce, bez nutnosti appku otevírat. Lokálně proto
  // plánujeme JEN jmenovité připomínky ze "Zásoby a připomínky" (dueReminders) —
  // ty server nezná (jsou jen na zařízení). Tím se vyhneme dvojí ranní notifikaci.
  const due = opts.dueReminders ?? [];
  if (due.length === 0) return; // není co jmenovitě připomenout → server se postará o zbytek

  // Jmenovitá připomínka na nejbližší 9:00 (dnešní, nebo zítřejší, když už bylo po).
  const at = new Date(now);
  at.setHours(9, 0, 0, 0);
  if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);

  const seznam = due.slice(0, 3).join(", ") + (due.length > 3 ? "…" : "");
  const title = locale === "sk" ? "Čas doplniť zásoby 🛒" : "Čas doplnit zásoby 🛒";
  const body = locale === "sk"
    ? `Dnes je čas kúpiť: ${seznam}. Hoď to do nákupného zoznamu.`
    : `Dnes je čas koupit: ${seznam}. Hoď to do nákupního seznamu.`;

  await LocalNotifications.schedule({
    notifications: [{
      id: NOTIF_ID_BASE,
      channelId: CHANNEL_ID,
      title,
      body,
      schedule: { at, allowWhileIdle: true },
      smallIcon: "ic_launcher_foreground",
    }],
  });
}

// Zruší všechny naše naplánované denní notifikace.
export async function cancelDailyNudges(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const ids = [];
    for (let d = 0; d < DAYS_AHEAD; d++) ids.push({ id: NOTIF_ID_BASE + d });
    await LocalNotifications.cancel({ notifications: ids });
  } catch {}
}
