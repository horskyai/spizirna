// Lokální notifikace (jen v nativní appce přes Capacitor).
//
// DĚLBA PRÁCE (ať se ranní a večerní nepřekrývají):
// - RÁNO 9:00 — obecná přátelská hláška ("Ahoj! Co dneska uvaříš?") posílá
//   SERVER přes push (Firebase, edge funkce daily-nudge + pg_cron, 9:00 Praha) —
//   spolehlivě i při zavřené appce. (viz supabase/functions/daily-nudge)
// - VEČER 18:00 — CHYTRÁ lokální notifikace podle TVÝCH dat v telefonu:
//   co ti končí, co máš na nákup, jmenovité připomínky, dlouhá nepřítomnost.
//   Data zůstávají v zařízení (soukromé). Plánuje se dopředu na DAYS_AHEAD dní,
//   aby chodila i pár dní bez otevření appky (obsah je z posledního otevření).
//   Ukáže se JEN když má co říct — když není nic, večerní notifikace se nepošle.
//
// Web (prohlížeč) tohle NEpoužívá — Capacitor plugin funguje jen v appce.

import { Capacitor } from "@capacitor/core";
import { getCurrentLocale } from "@/store/localeStore";

const CHANNEL_ID = "spizirna-daily";
const NOTIF_ID_BASE = 4200; // pevný rozsah ID pro naše denní notifikace
const DAYS_AHEAD = 7;       // plánujeme večerní notifikace na týden dopředu

// Večerní okno: čas se každý den STŘÍDÁ (17:00–20:30), ať to není monotónní.
// Deterministicky podle dne (ne náhodně) → stabilní i po přeplánování.
const EVENING_SLOTS: Array<[number, number]> = [
  [17, 30], [18, 0], [18, 30], [19, 0], [19, 30], [20, 0],
];
function eveningSlotFor(daySeed: number): [number, number] {
  return EVENING_SLOTS[Math.abs((daySeed * 2654435761) >>> 0) % EVENING_SLOTS.length];
}

// Zapnuto? (přepínač v Nastavení ukládá do localStorage EXPIRY_NOTIF_KEY)
function isEnabled(): boolean {
  try {
    return localStorage.getItem("expiry-notifications") !== "off";
  } catch {
    return true;
  }
}

type Locale = "cs" | "sk";

// Sestaví CHYTRÝ text večerní notifikace podle stavu appky (priorita shora).
// Vrátí null, když není nic k připomenutí → večerní notifikace se nepošle.
function buildSmartMessage(
  locale: Locale,
  opts: {
    expiringCount: number;
    shoppingCount: number;
    lastOpenedDaysAgo: number;
    dueReminders: string[];
    // Tip na recept, který jde uvařit z aktuálních zásob (název + kolik surovin máš).
    recipeSuggestion?: { name: string; have: number; total: number } | null;
  },
): { title: string; body: string } | null {
  const { expiringCount, shoppingCount, lastOpenedDaysAgo, dueReminders, recipeSuggestion } = opts;

  // 0) NEJLÁKAVĚJŠÍ: máš doma skoro všechno na konkrétní recept → navrhni ho.
  //    Dáváme přednost, když ti něco zároveň končí (ať se to spotřebuje), jinak
  //    jako milý tip. (Prioritu 1 = "je čas koupit" ale necháváme nad tímhle,
  //    protože nákup má časový spouštěč.)
  if (recipeSuggestion && dueReminders.length === 0) {
    const { name, have, total } = recipeSuggestion;
    const kdyz = expiringCount > 0
      ? (locale === "sk" ? " Zíde sa to — niečo ti čoskoro končí." : " Hodí se to — něco ti brzy končí.")
      : "";
    return {
      title: locale === "sk" ? "Čo dnes uvariť? 🍳" : "Co dnes uvařit? 🍳",
      body: locale === "sk"
        ? `Máš doma ${have} z ${total} surovín na „${name}". Skús to!${kdyz}`
        : `Máš doma ${have} z ${total} surovin na „${name}". Zkus to!${kdyz}`,
    };
  }

  // 1) jmenovité "Zásoby a připomínky" — je čas koupit konkrétní věci.
  if (dueReminders.length > 0) {
    const seznam = dueReminders.slice(0, 3).join(", ") + (dueReminders.length > 3 ? "…" : "");
    return {
      title: locale === "sk" ? "Čas doplniť zásoby 🛒" : "Čas doplnit zásoby 🛒",
      body: locale === "sk"
        ? `Je čas kúpiť: ${seznam}. Hoď to do nákupného zoznamu.`
        : `Je čas koupit: ${seznam}. Hoď to do nákupního seznamu.`,
    };
  }

  // 2) Něco brzy končí — ať se nic nevyhodí.
  if (expiringCount > 0) {
    return {
      title: locale === "sk" ? "Niečo ti čoskoro končí ♻️" : "Něco ti brzy končí ♻️",
      body: locale === "sk"
        ? `${expiringCount} potravinám čoskoro končí trvanlivosť. Pozri, čo dnes spotrebovať.`
        : `${expiringCount} potravinám brzy končí trvanlivost. Mrkni, co dnes spotřebovat.`,
    };
  }

  // 3) Máš rozdělaný nákupní seznam — pobídka.
  if (shoppingCount > 0) {
    return {
      title: locale === "sk" ? "Ideš nakupovať? 🛒" : "Jdeš nakupovat? 🛒",
      body: locale === "sk"
        ? `Na nákupnom zozname máš ${shoppingCount} vecí. Nezabudni na ne.`
        : `Na nákupním seznamu máš ${shoppingCount} věcí. Nezapomeň na ně.`,
    };
  }

  // 4) Dlouho neotevřel appku (>= 3 dny) — vrať ho zpět.
  if (lastOpenedDaysAgo >= 3) {
    return {
      title: locale === "sk" ? "Chýbaš nám! 💚" : "Chybíš nám! 💚",
      body: locale === "sk"
        ? "Ako to vyzerá v tvojej Špajzi? Nech sa nič nepokazí."
        : "Jak to vypadá ve tvojí Spižírně? Ať se nic nezkazí.",
    };
  }

  // Nic k připomenutí → večer neotravujeme (ráno stačí obecná ze serveru).
  return null;
}

// Naplánuje CHYTROU večerní notifikaci (18:00) na DAYS_AHEAD dní dopředu.
// Text se určí z aktuálního stavu appky (co končí, nákup, připomínky, nepřítomnost).
// Ráno 9:00 řeší obecnou hlášku server push — tady jde jen o osobní večerní.
export async function scheduleDailyNudges(opts: {
  expiringCount?: number;
  shoppingCount?: number;
  lastOpenedDaysAgo?: number;
  // Názvy položek ze "Zásoby a připomínky", kterým právě nadešel čas koupit.
  dueReminders?: string[];
  // Tip na recept z aktuálních zásob (spočítá volající přes bestRecipeFromStock).
  recipeSuggestion?: { name: string; have: number; total: number } | null;
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

  const locale: Locale = getCurrentLocale() === "sk" ? "sk" : "cs";
  const now = new Date();

  // Chytrý text z aktuálního stavu. Když není co říct → večer neplánujeme nic.
  const msg = buildSmartMessage(locale, {
    expiringCount: opts.expiringCount ?? 0,
    shoppingCount: opts.shoppingCount ?? 0,
    lastOpenedDaysAgo: opts.lastOpenedDaysAgo ?? 0,
    dueReminders: opts.dueReminders ?? [],
    recipeSuggestion: opts.recipeSuggestion ?? null,
  });
  if (!msg) return;

  // Naplánuj večerní notifikaci na příštích DAYS_AHEAD dní. Čas se každý den
  // STŘÍDÁ (viz EVENING_SLOTS), ať to není pořád stejná hodina. Dnešek jen když
  // vybraný čas ještě nenastal.
  const toSchedule = [];
  for (let d = 0; d < DAYS_AHEAD; d++) {
    const at = new Date(now);
    at.setDate(now.getDate() + d);
    const daySeed = Math.floor(at.getTime() / 86_400_000);
    const [h, m] = eveningSlotFor(daySeed);
    at.setHours(h, m, 0, 0);
    if (at.getTime() <= now.getTime()) continue; // dnešní vybraný čas už byl → přeskoč
    toSchedule.push({
      id: NOTIF_ID_BASE + d,
      channelId: CHANNEL_ID,
      title: msg.title,
      body: msg.body,
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
