// Přátelské lokální notifikace (jen v nativní appce přes Capacitor).
// Cíl: vtáhnout uživatele zpět do Spižírny — ne suché "expiruje mléko", ale
// milé pošťouchnutí ("Ahoj! Co dneska uvaříš?"). Jednou denně ráno v 9:00.
//
// Web (prohlížeč) tohle NEpoužívá — Capacitor plugin funguje jen v appce.

import { Capacitor } from "@capacitor/core";
import { getCurrentLocale } from "@/store/localeStore";

// ── Sady zpráv ──────────────────────────────────────────────────────────────
// Každá zpráva má titulek + tělo, CZ i SK. Appka náhodně vybírá; když něco
// reálně brzy končí, dá přednost skupině "expiring".

type Msg = { title: { cs: string; sk: string }; body: { cs: string; sk: string } };

// Běžné ranní vtáhnutí (většina dnů)
const GENERAL: Msg[] = [
  { title: { cs: "Ahoj! 🍳", sk: "Ahoj! 🍳" }, body: { cs: "Co dobrého dneska uvaříš? Mrkni do Spižírny.", sk: "Čo dobré dnes uvaríš? Pozri sa do Špajze." } },
  { title: { cs: "Dobré ráno! ☀️", sk: "Dobré ráno! ☀️" }, body: { cs: "Podívala ses dnes do Spižírny?", sk: "Pozrela si sa dnes do Špajze?" } },
  { title: { cs: "Co dneska na stůl? 😋", sk: "Čo dnes na stôl? 😋" }, body: { cs: "Nech se inspirovat recepty ve Spižírně.", sk: "Nechaj sa inšpirovať receptami v Špajzi." } },
  { title: { cs: "Uvařila jsi dnes? 👩‍🍳", sk: "Varila si dnes? 👩‍🍳" }, body: { cs: "Koukni, co máš doma, a dej se do toho.", sk: "Pozri, čo máš doma, a pusti sa do toho." } },
  { title: { cs: "Nový den 🫙", sk: "Nový deň 🫙" }, body: { cs: "Zkontroluj Spižírnu, ať máš přehled.", sk: "Skontroluj Špajzu, nech máš prehľad." } },
];

// Když něco reálně brzy končí (přednost)
const EXPIRING: Msg[] = [
  { title: { cs: "Něco ti brzy končí ♻️", sk: "Niečo ti čoskoro končí ♻️" }, body: { cs: "Mrkni, co spotřebovat, ať nic nevyhodíš.", sk: "Pozri, čo spotrebovať, nech nič nevyhodíš." } },
  { title: { cs: "Zachraň jídlo 😋", sk: "Zachráň jedlo 😋" }, body: { cs: "Máš doma pár věcí, co volají po uvaření. Co z nich dnes bude?", sk: "Máš doma pár vecí, čo volajú po uvarení. Čo z nich dnes bude?" } },
];

// Nákupní pošťouchnutí
const SHOPPING: Msg[] = [
  { title: { cs: "Jdeš nakupovat? 🛒", sk: "Ideš nakupovať? 🛒" }, body: { cs: "Koukni na nákupní seznam ve Spižírně.", sk: "Pozri na nákupný zoznam v Špajzi." } },
  { title: { cs: "Došlo ti něco? 📝", sk: "Došlo ti niečo? 📝" }, body: { cs: "Hoď to do košíku, ať na to nezapomeneš.", sk: "Hoď to do košíka, nech na to nezabudneš." } },
];

// Po delší pauze (uživatel appku dlouho neotevřel)
const COMEBACK: Msg[] = [
  { title: { cs: "Chybíš nám! 💚", sk: "Chýbaš nám! 💚" }, body: { cs: "Jak to vypadá ve tvojí Spižírně?", sk: "Ako to vyzerá v tvojej Špajzi?" } },
  { title: { cs: "Dlouho jsme se neviděli 🫙", sk: "Dlho sme sa nevideli 🫙" }, body: { cs: "Ať se ti doma nic nezkazí — mrkni dovnitř.", sk: "Nech sa ti doma nič nepokazí — pozri dovnútra." } },
];

const CHANNEL_ID = "spizirna-daily";
const NOTIF_ID_BASE = 4200; // pevný rozsah ID pro naše denní notifikace
const DAYS_AHEAD = 7;       // naplánujeme dopředu na týden (přeplánuje se při každém startu)

// Deterministický "náhodný" výběr podle dne — bez Math.random (ať je to stabilní
// a každý den jiná zpráva). Vrací index do pole délky len.
function pickIndex(daySeed: number, len: number): number {
  return Math.abs((daySeed * 1103515245 + 12345) >> 8) % len;
}

// Zapnuto? (přepínač v Nastavení ukládá do localStorage EXPIRY_NOTIF_KEY)
function isEnabled(): boolean {
  try {
    return localStorage.getItem("expiry-notifications") !== "off";
  } catch {
    return true;
  }
}

// Naplánuje denní přátelské notifikace na příštích DAYS_AHEAD dní v 9:00.
// - expiringCount > 0 → některé dny použije "končí" zprávu (přednost)
// - lastOpenedDaysAgo >= 3 → první den použije "chybíš nám"
// Volá se při startu appky. Nejdřív zruší staré, pak naplánuje čerstvé.
export async function scheduleDailyNudges(opts: {
  expiringCount: number;
  shoppingCount: number;
  lastOpenedDaysAgo: number;
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

  const toSchedule = [];
  for (let d = 0; d < DAYS_AHEAD; d++) {
    // datum: dnešek + d dní, v 9:00
    const at = new Date(now);
    at.setDate(now.getDate() + d);
    at.setHours(9, 0, 0, 0);
    // dnešní 9:00 už mohlo být → přeskoč na zítřek
    if (at.getTime() <= now.getTime()) continue;

    const daySeed = Math.floor(at.getTime() / 86_400_000);

    // Výběr sady: expirace má přednost (obden), pak comeback (jen 1. den po pauze),
    // jinak střídá general/shopping.
    let pool: Msg[];
    if (opts.expiringCount > 0 && d % 2 === 0) {
      pool = EXPIRING;
    } else if (d === 0 && opts.lastOpenedDaysAgo >= 3) {
      pool = COMEBACK;
    } else if (opts.shoppingCount > 0 && d % 3 === 2) {
      pool = SHOPPING;
    } else {
      pool = GENERAL;
    }

    const msg = pool[pickIndex(daySeed, pool.length)];
    let body = msg.body[locale];
    // do "končí" zprávy doplň počet, pokud ho známe
    if (pool === EXPIRING && opts.expiringCount > 0) {
      body = locale === "sk"
        ? `${opts.expiringCount} potravinám čoskoro končí trvanlivosť. ${body}`
        : `${opts.expiringCount} potravinám brzy končí trvanlivost. ${body}`;
    }

    toSchedule.push({
      id: NOTIF_ID_BASE + d,
      channelId: CHANNEL_ID,
      title: msg.title[locale],
      body,
      schedule: { at, allowWhileIdle: true },
      smallIcon: "ic_launcher_foreground",
    });
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({ notifications: toSchedule });
  }
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
