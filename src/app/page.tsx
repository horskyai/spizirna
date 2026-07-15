"use client";

import { useState, useEffect, Component, ReactNode } from "react";
import { useUIStore } from "@/store/uiStore";
import { useFeaturesStore } from "@/store/featuresStore";
import { useModeStore } from "@/store/modeStore";
import { useAuthStore } from "@/store/authStore";
import { TabBar } from "@/components/TabBar";
import { SideNav } from "@/components/SideNav";
import { AppHeader } from "@/components/AppHeader";
import { PantryView } from "@/components/PantryView";
import { Scanner } from "@/components/Scanner";
import { FoodLogView } from "@/components/FoodLogView";
import { RecipesView } from "@/components/RecipesView";
import { ShoppingView } from "@/components/ShoppingView";
import { RecurringView } from "@/components/RecurringView";
import { ProvozView } from "@/components/ProvozView";
import { ProductSheet } from "@/components/ProductSheet";
import { ModeSelect } from "@/components/ModeSelect";
import { LanguageSelect } from "@/components/LanguageSelect";
import { AuthScreen } from "@/components/AuthScreen";
import { DeviceLimitScreen } from "@/components/DeviceLimitScreen";
import { BusinessTypeSelect } from "@/components/BusinessTypeSelect";
import { useBusinessStore } from "@/store/businessStore";
import { SettingsModal } from "@/components/SettingsModal";
import { DiscountWheel } from "@/components/DiscountWheel";
import { useDiscountStore, WHEEL_AFTER_DAYS } from "@/store/discountStore";
import { scheduleDailyNudges, scheduleSmartNotifications, SmartNotif } from "@/lib/notifications";
import { useRecipeStore } from "@/store/recipeStore";
import { bestRecipeFromStock, bestRecipeUsingExpiring, StockItem } from "@/lib/recipeMatch";
import { daysUntil } from "@/lib/dateUtils";
import { getCurrentLocale } from "@/store/localeStore";
import { useGamificationStore } from "@/store/gamificationStore";
import { isNotifEnabled } from "@/store/notifPrefsStore";
import { usePantryStore } from "@/store/pantryStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useFamilyStore } from "@/store/familyStore";
import { syncNow, startRealtime, stopRealtime, schedulePush } from "@/lib/familySync";
import { useProvozShareStore } from "@/store/provozShareStore";
import { provozSyncNow, provozStartRealtime, provozStopRealtime, provozSchedulePush } from "@/lib/provozSync";
import { useProvozStore } from "@/store/provozStore";
import { useKasaStore } from "@/store/kasaStore";
import { initPush } from "@/lib/pushNotifications";
import { useRecurringStore } from "@/store/recurringStore";
import { Capacitor } from "@capacitor/core";

// Web (PC i prohlížeč) = JEN přihlášení. Onboarding (jazyk, výběr režimu,
// uvítání, výběr plánu) běží pouze v nativní appce z Google Play. Registrace
// se dělá jen v appce; na webu se člověk už jen přihlásí.
const JE_APP = Capacitor.isNativePlatform();

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "system-ui", background: "#F2EDE4", minHeight: "100dvh" }}>
          <h2 style={{ color: "#6B8F5E" }}>Spizirna</h2>
          <p style={{ color: "#333", fontSize: 14 }}>Chyba: {this.state.error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "10px 20px", background: "#6B8F5E", color: "white", border: "none", borderRadius: 12 }}>
            Zkusit znovu
          </button>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}

// ── CHYTRÝ PLÁN NOTIFIKACÍ pro DOMÁCNOST ─────────────────────────────────────
// Z reálných dat v telefonu (spížírna, zásoby, recepty) postaví konkrétní
// naplánované notifikace na správné dny. Vše lokálně, nic se neposílá ven.
// Priority a načasování:
//  1) EXPIRACE — den před koncem každé (skupiny) potraviny: „Zítra končí…"
//  2) DOCHÁZÍ — co je na řadě koupit (getDueItems) + odhad ze spotřeby
//  3) CO UVAŘIT — recept, který spotřebuje brzy končící suroviny (jednou, večer)
function buildHomeSmartPlan(): SmartNotif[] {
  const locale = getCurrentLocale() === "sk" ? "sk" : "cs";
  const out: SmartNotif[] = [];

  const pantry = usePantryStore.getState().items;
  const recurring = useRecurringStore.getState();
  const recipes = useRecipeStore.getState().recipes;

  // ── 1) EXPIRACE — seskup potraviny podle dne, kdy končí (0–5 dní dopředu) ──
  // Notifikaci pošleme DEN PŘED koncem (v 18:00): „Zítra ti končí X, Y".
  const byDay = new Map<number, string[]>(); // dní do konce → názvy
  for (const it of pantry) {
    if (!it.expires_at) continue;
    const d = daysUntil(it.expires_at);
    if (d < 0 || d > 5) continue; // jen co končí dnes až za 5 dní
    const arr = byDay.get(d) ?? [];
    arr.push(it.product.product_name);
    byDay.set(d, arr);
  }
  for (const [d, names] of (isNotifEnabled("expirace") ? byDay : new Map<number, string[]>())) {
    const seznam = names.slice(0, 3).join(", ") + (names.length > 3 ? "…" : "");
    // připomínka den předem (pokud končí dnes, pošli dnes)
    const daysFromNow = Math.max(0, d - 1);
    let title: string, body: string;
    if (d === 0) {
      title = locale === "sk" ? "Dnes končí trvanlivosť ⏰" : "Dnes končí trvanlivost ⏰";
      body = locale === "sk" ? `Dnes ti končí: ${seznam}. Spotrebuj to!` : `Dnes ti končí: ${seznam}. Spotřebuj to!`;
    } else if (d === 1) {
      title = locale === "sk" ? "Zajtra končí ⏰" : "Zítra končí ⏰";
      body = locale === "sk" ? `Zajtra ti končí: ${seznam}. Naplánuj to dnes.` : `Zítra ti končí: ${seznam}. Naplánuj to dnes.`;
    } else {
      title = locale === "sk" ? "Blíži sa spotreba ♻️" : "Blíží se spotřeba ♻️";
      body = locale === "sk" ? `Za ${d} dní ti končí: ${seznam}.` : `Za ${d} dní ti končí: ${seznam}.`;
    }
    out.push({ daysFromNow, hour: 18, minute: 0, title, body });
  }

  // ── 2) DOCHÁZÍ — na řadě koupit dnes (getDueItems) ──
  const due = isNotifEnabled("dochazi") ? recurring.getDueItems().map((i) => i.name) : [];
  if (due.length > 0) {
    const seznam = due.slice(0, 3).join(", ") + (due.length > 3 ? "…" : "");
    out.push({
      daysFromNow: 0, hour: 17, minute: 30,
      title: locale === "sk" ? "Čas doplniť zásoby 🛒" : "Čas doplnit zásoby 🛒",
      body: locale === "sk" ? `Je čas kúpiť: ${seznam}.` : `Je čas koupit: ${seznam}.`,
    });
  }
  // dochází podle ODHADU spotřeby (predictDaysLeft) — pro položky ve spížírně
  for (const it of (isNotifEnabled("dochazi") ? pantry : [])) {
    const left = recurring.predictDaysLeft(it.product.product_name, it.quantity);
    if (left !== null && left >= 1 && left <= 3) {
      out.push({
        daysFromNow: left, hour: 17, minute: 30,
        title: locale === "sk" ? "Čoskoro dôjde 📉" : "Brzy dojde 📉",
        body: locale === "sk"
          ? `${it.product.product_name} ti čoskoro dôjde — pridaj na nákup.`
          : `${it.product.product_name} ti brzy dojde — přidej na nákup.`,
      });
    }
  }

  // ── 3) CO UVAŘIT — recept využívající brzy končící suroviny (dnes večer) ──
  const stock: StockItem[] = pantry.map((p) => ({
    id: p.id, name: p.product.product_name, quantity: p.quantity, ean: p.product.ean_code,
  }));
  const expiryById: Record<string, number> = {};
  for (const p of pantry) if (p.expires_at) expiryById[p.id] = daysUntil(p.expires_at);
  const rec = bestRecipeUsingExpiring(recipes, stock, expiryById, { expiringWithin: 3 })
    ?? (bestRecipeFromStock(recipes, stock) && (() => {
      const b = bestRecipeFromStock(recipes, stock)!;
      return { recipe: b.recipe, have: b.have, total: b.total, usesExpiring: [] as string[] };
    })());
  if (rec && isNotifEnabled("coUvarit")) {
    const uses = rec.usesExpiring.length > 0
      ? (locale === "sk" ? ` Využiješ ${rec.usesExpiring.slice(0, 2).join(", ")}, čo ti končí.` : ` Využiješ ${rec.usesExpiring.slice(0, 2).join(", ")}, co ti končí.`)
      : "";
    out.push({
      daysFromNow: 0, hour: 16, minute: 30,
      title: locale === "sk" ? "Čo dnes uvariť? 🍳" : "Co dnes uvařit? 🍳",
      body: locale === "sk"
        ? `Máš doma ${rec.have} z ${rec.total} surovín na „${rec.recipe.name}".${uses}`
        : `Máš doma ${rec.have} z ${rec.total} surovin na „${rec.recipe.name}".${uses}`,
    });
  }

  // ── 4) PRÁZDNÁ SPÍŽÍRNA — málo položek → čas na nákup (za 2 dny, ať nespěchá) ──
  if (isNotifEnabled("prazdnaSpizirna") && pantry.length > 0 && pantry.length <= 3) {
    out.push({
      daysFromNow: 2, hour: 17, minute: 0,
      title: locale === "sk" ? "Prázdna špajza 🧺" : "Prázdná spížírna 🧺",
      body: locale === "sk"
        ? `Ostávajú ti len ${pantry.length} položky — čas na väčší nákup?`
        : `Zbývají ti jen ${pantry.length} položky — čas na větší nákup?`,
    });
  }

  // ── 5) TIP NA VYUŽITÍ — máš hodně jedné suroviny (za 1 den, dopoledne) ──
  const hodne = pantry.filter((p) => p.quantity >= 5).sort((a, b) => b.quantity - a.quantity)[0];
  if (hodne && isNotifEnabled("tipVyuziti")) {
    out.push({
      daysFromNow: 1, hour: 11, minute: 0,
      title: locale === "sk" ? "Máš toho dosť 🍽️" : "Máš toho dost 🍽️",
      body: locale === "sk"
        ? `Máš ${hodne.quantity}× ${hodne.product.product_name} — mrkni na recepty, nech sa neskazí.`
        : `Máš ${hodne.quantity}× ${hodne.product.product_name} — mrkni na recepty, ať se nezkazí.`,
    });
  }

  // ── 6) STŘÁDKA / GAMIFIKACE — pochval za sérii dní aktivity (za 1 den ráno) ──
  const gam = useGamificationStore.getState();
  const streak = gam.streak ?? 0;
  if (streak >= 3 && isNotifEnabled("stradka")) {
    out.push({
      daysFromNow: 1, hour: 9, minute: 30,
      title: locale === "sk" ? `${streak} dní v rade! 🔥` : `${streak} dní v řadě! 🔥`,
      body: locale === "sk"
        ? "Super, že sa staráš o svoju špajzu. Pokračuj!"
        : "Super, že se staráš o svoji spížírnu. Pokračuj!",
    });
  }

  // ── 7) PLÝTVÁNÍ TENTO TÝDEN — kolik jsi vyhodil za posledních 7 dní (za 3 dny) ──
  // Když je co ukázat: vyhozeno → varování; nic → pochvala za záchranu.
  if (isNotifEnabled("plytvaniTyden")) {
    const tyden = gam.getWastedThisWeek();
    const vyhozeno = Math.round(tyden.value);
    const saved = Math.round(gam.savedValue ?? 0);
    if (vyhozeno >= 30) {
      out.push({
        daysFromNow: 3, hour: 18, minute: 30,
        title: locale === "sk" ? "Plytvanie za týždeň 🗑️" : "Plýtvání za týden 🗑️",
        body: locale === "sk"
          ? `Tento týždeň si vyhodil jedlo za ${vyhozeno} Kč. Skús nakupovať menej naraz.`
          : `Tento týden jsi vyhodil jídlo za ${vyhozeno} Kč. Zkus nakupovat míň najednou.`,
      });
    } else if (saved >= 100) {
      out.push({
        daysFromNow: 3, hour: 18, minute: 30,
        title: locale === "sk" ? "Zachránil si jedlo! 💚" : "Zachránil jsi jídlo! 💚",
        body: locale === "sk"
          ? `Vďaka tebe sa nevyhodilo jedlo za ${saved} Kč. Skvelá práca!`
          : `Díky tobě se nevyhodilo jídlo za ${saved} Kč. Skvělá práce!`,
      });
    }
  }

  // Seřaď podle dne (nejbližší dřív) — plánovač bere max SMART_MAX nejbližších.
  out.sort((a, b) => a.daysFromNow - b.daysFromNow || a.hour - b.hour);
  return out;
}

// ── CHYTRÝ PLÁN NOTIFIKACÍ pro PROVOZ (obchod i restaurace) ──────────────────
// Z reálných dat kasy/skladu. Vše lokálně.
//  - RÁNO 8:00: ranní příprava — zboží pod minimem před otevřením
//  - VEČER 20:00: souhrn tržby + porovnání s průměrem (slabší/silný den)
//  - RÁNO příští den: nezavřená uzávěrka, když byl prodej a den se neuzavřel
function buildProvozSmartPlan(): SmartNotif[] {
  const locale = getCurrentLocale() === "sk" ? "sk" : "cs";
  const out: SmartNotif[] = [];
  const kasa = useKasaStore.getState();
  const provoz = useProvozStore.getState();

  const dnes = new Date();
  const dnesISO = dnes.toISOString().slice(0, 10);
  const trzbaDnes = kasa.getTrzbaDne(dnesISO);
  const uctenekDnes = kasa.getPocetProdejekDne(dnesISO);
  const lowStock = provoz.getPolozkyCritical().map((p) => p.nazev);

  // 1) RANNÍ PŘÍPRAVA (8:00) — zboží pod minimem, ať se stihne objednat/doplnit.
  if (isNotifEnabled("provozRannePriprava") && lowStock.length > 0) {
    const seznam = lowStock.slice(0, 3).join(", ") + (lowStock.length > 3 ? "…" : "");
    out.push({
      daysFromNow: 1, hour: 8, minute: 0,
      title: locale === "sk" ? "Dobré ráno! Skontroluj sklad 📦" : "Dobré ráno! Zkontroluj sklad 📦",
      body: locale === "sk" ? `Pod minimom: ${seznam}. Doplň pred otvorením.` : `Pod minimem: ${seznam}. Doplň před otevřením.`,
    });
  } else if (isNotifEnabled("provozRannePriprava")) {
    out.push({
      daysFromNow: 1, hour: 8, minute: 0,
      title: locale === "sk" ? "Dobré ráno! ☕" : "Dobré ráno! ☕",
      body: locale === "sk" ? "Sklad je v poriadku. Pekný deň v prevádzke!" : "Sklad je v pořádku. Hezký den v provozu!",
    });
  }

  // 2) VEČERNÍ SOUHRN (20:00) — tržba + porovnání s průměrem (slabší/silný den).
  if (isNotifEnabled("provozSouhrn") && uctenekDnes > 0) {
    const prumer = kasa.prumernaTrzba(14); // průměr za 14 dní (jen dny s prodejem)
    const castka = Math.round(trzbaDnes).toLocaleString(locale === "sk" ? "sk-SK" : "cs-CZ");
    let srovnani = "";
    if (prumer > 0) {
      const rozdil = Math.round(((trzbaDnes - prumer) / prumer) * 100);
      if (rozdil <= -20) srovnani = locale === "sk" ? ` O ${Math.abs(rozdil)} % menej než zvyčajne.` : ` O ${Math.abs(rozdil)} % méně než obvykle.`;
      else if (rozdil >= 20) srovnani = locale === "sk" ? ` O ${rozdil} % viac než zvyčajne! 🎉` : ` O ${rozdil} % víc než obvykle! 🎉`;
    }
    out.push({
      daysFromNow: 0, hour: 20, minute: 0,
      title: locale === "sk" ? "Zhrnutie dňa 💰" : "Souhrn dne 💰",
      body: locale === "sk"
        ? `Dnes tržba ${castka} Kč (${uctenekDnes} účteniek).${srovnani} Nezabudni na uzávierku.`
        : `Dnes tržba ${castka} Kč (${uctenekDnes} účtenek).${srovnani} Nezapomeň na uzávěrku.`,
    });
  }

  // 3) NEZAVŘENÁ UZÁVĚRKA — ráno další den, když byl dnes prodej a NEuzavřel se.
  if (isNotifEnabled("provozUzaverka") && uctenekDnes > 0 && !kasa.jeDenUzavren(dnesISO)) {
    out.push({
      daysFromNow: 1, hour: 9, minute: 0,
      title: locale === "sk" ? "Chýba uzávierka 🧾" : "Chybí uzávěrka 🧾",
      body: locale === "sk"
        ? "Včera bol predaj, ale deň si neuzavrel. Dodělaj uzávierku v Účto."
        : "Včera byl prodej, ale den jsi neuzavřel. Dodělej uzávěrku v Účto.",
    });
  }

  out.sort((a, b) => a.daysFromNow - b.daysFromNow || a.hour - b.hour);
  return out;
}

export default function Home() {
  const { activeTab, activeSheet, scannedProduct, closeSheet, settingsOpen, openSettings, closeSettings } = useUIStore();
  const calorieTracking = useFeaturesStore((s) => s.calorieTracking);
  // Deník jídla je dostupný jen se zapnutým sledováním kalorií; jinak fallback na spižírnu.
  const showFoodLog = activeTab === "jidlo" && calorieTracking;
  const { mode, setMode } = useModeStore();
  const businessTyp = useBusinessStore((s) => s.typProvozu);
  const { user, profile, loading: authLoading, init: authInit, deviceLimitHit } = useAuthStore();
  // Uvítací kolo štěstí — jen domácnost, 7 dní po prvním vstupu, jen jednou.
  const wheelSpun = useDiscountStore((s) => s.spun);
  const firstSeenAt = useDiscountStore((s) => s.firstSeenAt);
  const markFirstSeen = useDiscountStore((s) => s.markFirstSeen);
  const [wheelClosed, setWheelClosed] = useState(false);

  // Inicializace přihlášení — načte session ze Supabase a poslouchá změny
  useEffect(() => {
    authInit();
  }, [authInit]);

  // Jeden e-mail = jeden režim: po přihlášení má přednost režim uložený k účtu.
  // Když se liší od lokálního (jiný telefon), appka se přepne na účtový režim.
  useEffect(() => {
    if (profile?.mode && profile.mode !== mode) {
      setMode(profile.mode);
    }
  }, [profile?.mode, mode, setMode]);

  // Zaznamenej první vstup přihlášeného uživatele — od něj běží 7 dní do kola.
  useEffect(() => {
    if (user) markFirstSeen(Date.now());
  }, [user, markFirstSeen]);

  // Push notifikace — po přihlášení zaregistruj zařízení u FCM a ulož token
  // (jen v appce). Server pak pošle push, když druhý člen změní sdílená data.
  useEffect(() => {
    if (user) initPush();
  }, [user]);

  // Rodinné sdílení — po přihlášení zjisti, jestli je uživatel v rodině;
  // pokud ano, stáhni sdílenou spížírnu/nákup a zapni realtime (živé změny).
  useEffect(() => {
    if (!user) return;
    let zapnuto = true;
    (async () => {
      await useFamilyStore.getState().refreshFamily();
      if (!zapnuto) return;
      if (useFamilyStore.getState().familyId) {
        await syncNow();
        startRealtime();
      }
    })();
    return () => { zapnuto = false; stopRealtime(); };
  }, [user]);

  // Sdílení provozu — po přihlášení zjisti provozovnu; pokud je v ní, stáhni
  // sdílený sklad + menu a zapni realtime.
  useEffect(() => {
    if (!user) return;
    let zapnuto = true;
    (async () => {
      await useProvozShareStore.getState().refreshProvozovna();
      if (!zapnuto) return;
      if (useProvozShareStore.getState().provozovnaId) {
        await provozSyncNow();
        provozStartRealtime();
      }
    })();
    return () => { zapnuto = false; provozStopRealtime(); };
  }, [user]);

  // Push změn do cloudu (debounced). schedulePush/provozSchedulePush si samy
  // ověří, jestli je uživatel v rodině/provozovně (jinak nedělají nic).
  useEffect(() => {
    const unsubP = usePantryStore.subscribe(() => schedulePush());
    const unsubS = useShoppingStore.subscribe(() => schedulePush());
    const unsubProvoz = useProvozStore.subscribe(() => provozSchedulePush());
    const unsubKasa = useKasaStore.subscribe(() => provozSchedulePush());
    return () => { unsubP(); unsubS(); unsubProvoz(); unsubKasa(); };
  }, []);

  // Chytré lokální notifikace (jen v appce) — při každém otevření přeplánuj
  // večerní pošťouchnutí na příští dny. Obsah se liší podle režimu:
  //  - DOMÁCNOST: recept z toho co máš, expirace, nákup, připomínky.
  //  - PROVOZ: zboží pod minimem, souhrn tržby + připomínka uzávěrky.
  // (Ranní 9:00 obecnou hlášku posílá server push.)
  useEffect(() => {
    if (!user) return;
    try {
      // Poznač čas posledního otevření (pro budoucí „dlouho ses neukázal" logiku).
      localStorage.setItem("last-opened-at", String(Date.now()));

      if (mode === "provoz") {
        // PROVOZ — CHYTRÝ plán: ranní příprava (sklad), večerní souhrn tržby
        // s porovnáním vůči průměru, připomínka nezavřené uzávěrky. Vše lokálně.
        const planP = buildProvozSmartPlan();
        if (planP.length > 0) scheduleSmartNotifications(planP);
        else scheduleDailyNudges({ mode: "provoz" });
        return;
      }

      // DOMÁCNOST — CHYTRÝ plán z reálných dat (expirace jmenovitě na správný
      // den, dochází dle spotřeby, recept z brzy končících surovin). Vše lokálně.
      const plan = buildHomeSmartPlan();
      if (plan.length > 0) {
        scheduleSmartNotifications(plan);
      } else {
        // Nic konkrétního → nech server ranní obecnou hlášku (a zruš staré).
        scheduleDailyNudges({ mode: "domacnost" });
      }
    } catch { /* notifikace nejsou kritické */ }
  }, [user, mode]);

  // Úplný reset aplikace: otevřením /?reset se smažou všechna lokální data
  // a appka začne od splash screenu a onboardingu jako při první instalaci
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("reset")) {
      localStorage.clear();
      window.location.replace("/");
    }
  }, []);

  // Výběr jazyka — úplně první obrazovka po instalaci, ještě před onboardingem
  const [localeSelected, setLocaleSelected] = useState(() => {
    if (typeof window === "undefined") return true;
    const savedLocale = localStorage.getItem("app-locale");
    return !!(savedLocale && JSON.parse(savedLocale)?.state?.locale);
  });

  // Zobraz ModeSelect (onboarding + výběr plánu) jen pokud plán ještě nebyl vybrán
  const [modeSelected, setModeSelected] = useState(() => {
    if (typeof window === "undefined") return true;
    const savedMode = localStorage.getItem("app-mode");
    return !!(savedMode && JSON.parse(savedMode)?.state?.mode !== null);
  });

  // NA WEBU: žádný onboarding. Dokud není přihlášený uživatel, ukaž rovnou
  // přihlašovací obrazovku (přeskoč výběr jazyka i režimu). Registrace a
  // onboarding se dělají jen v appce z Google Play; na web se člověk už jen
  // přihlásí a data (jazyk/režim) se načtou z jeho účtu.
  if (!JE_APP && !authLoading && !user) {
    return (
      <ErrorBoundary>
        <AuthScreen />
      </ErrorBoundary>
    );
  }

  // 1) Výběr jazyka (čeština / slovenština) — jen v appce
  if (JE_APP && !localeSelected) {
    return (
      <ErrorBoundary>
        <LanguageSelect onDone={() => setLocaleSelected(true)} />
      </ErrorBoundary>
    );
  }

  // 2) Výběr režimu — první spuštění (jen jednou), jen v appce
  if (JE_APP && (!modeSelected || mode === null)) {
    return (
      <ErrorBoundary>
        <ModeSelect onDone={() => setModeSelected(true)} />
      </ErrorBoundary>
    );
  }

  // 3) Přihlášení — dokud načítáme session, počkáme; bez přihlášení AuthScreen
  if (authLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--green-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }
  if (!user) {
    return (
      <ErrorBoundary>
        <AuthScreen />
      </ErrorBoundary>
    );
  }
  // Přihlášen, ale účet je na max počtu zařízení a tohle je nové → blokace.
  if (deviceLimitHit) {
    return (
      <ErrorBoundary>
        <DeviceLimitScreen />
      </ErrorBoundary>
    );
  }
  // NA WEBU: přihlášený, ale režim se ještě dotahuje z profilu účtu (mode === null).
  // Krátce počkáme, ať appka nerenderuje bez zvoleného režimu. V appce sem kód
  // nedojde, protože onboarding režim nastaví ještě před přihlášením.
  if (!JE_APP && mode === null) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--green-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // Provozní režim, ale ještě nevybraný typ (obchod/restaurace) → výběr, jednou.
  // Po výběru se typProvozu uloží do store a komponenta se překreslí sama.
  if (mode === "provoz" && businessTyp === null) {
    return (
      <ErrorBoundary>
        <BusinessTypeSelect onDone={() => { /* store update překreslí */ }} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    {/* app-shell + pc-layout: na PC (≥1024px) se přepne na řádkové rozložení
        (postranní menu | obsah). Na mobilu zůstává svislé, beze změny. */}
    <div className="app-shell pc-layout relative flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Postranní menu — jen PC. Na skenování ho skryjeme (plné okno kamery). */}
      {activeTab !== "skenovat" && <SideNav onOpenSettings={openSettings} />}

      {/* Pravý sloupec: hlavička + obsah + (mobilní) spodní lišta */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onOpenSettings={openSettings} />

        <main className="app-main pc-main flex-1 overflow-hidden flex flex-col">
          {(activeTab === "spizirna" || (activeTab === "jidlo" && !calorieTracking)) && <PantryView />}
          {activeTab === "skenovat" && <Scanner />}
          {showFoodLog && <FoodLogView />}
          {activeTab === "recepty" && <RecipesView />}
          {activeTab === "nakup" && <ShoppingView />}
          {activeTab === "opakujici" && <RecurringView />}
          {activeTab === "provoz" && <ProvozView />}
        </main>

        {/* Spodní lišta jen na mobilu — na PC nahrazena postranním menu */}
        <div className="mobile-only">
          <TabBar />
        </div>
      </div>
      {/* konec pravého sloupce */}

      {activeSheet === "product" && scannedProduct && (
        <ProductSheet product={scannedProduct} onClose={() => closeSheet()} fromScanner={activeTab === "skenovat"} />
      )}

      {settingsOpen && <SettingsModal onClose={closeSettings} />}

      {/* Uvítací kolo štěstí — jen domácnost, 7 dní po prvním vstupu, jednou */}
      {mode !== "provoz" && !wheelSpun && !wheelClosed && firstSeenAt !== null &&
        Date.now() - firstSeenAt >= WHEEL_AFTER_DAYS * 86_400_000 && (
        <DiscountWheel onClose={() => setWheelClosed(true)} />
      )}

    </div>
    </ErrorBoundary>
  );
}
