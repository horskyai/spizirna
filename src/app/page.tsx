"use client";

import { useState, useEffect, Component, ReactNode } from "react";
import { useUIStore } from "@/store/uiStore";
import { useFeaturesStore } from "@/store/featuresStore";
import { useModeStore } from "@/store/modeStore";
import { useAuthStore } from "@/store/authStore";
import { TabBar } from "@/components/TabBar";
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
  for (const [d, names] of byDay) {
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
  const due = recurring.getDueItems().map((i) => i.name);
  if (due.length > 0) {
    const seznam = due.slice(0, 3).join(", ") + (due.length > 3 ? "…" : "");
    out.push({
      daysFromNow: 0, hour: 17, minute: 30,
      title: locale === "sk" ? "Čas doplniť zásoby 🛒" : "Čas doplnit zásoby 🛒",
      body: locale === "sk" ? `Je čas kúpiť: ${seznam}.` : `Je čas koupit: ${seznam}.`,
    });
  }
  // dochází podle ODHADU spotřeby (predictDaysLeft) — pro položky ve spížírně
  for (const it of pantry) {
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
  if (rec) {
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

  // Seřaď podle dne (nejbližší dřív) — plánovač bere max SMART_MAX nejbližších.
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
        // PROVOZ: zboží pod minimem + dnešní tržba/uzávěrka.
        const lowStock = useProvozStore.getState().getPolozkyCritical().map((p) => p.nazev);
        const dnes = new Date().toISOString().slice(0, 10);
        const trzbaDnes = useKasaStore.getState().getTrzbaDne(dnes);
        const uctenekDnes = useKasaStore.getState().getPocetProdejekDne(dnes);
        scheduleDailyNudges({ mode: "provoz", provoz: { lowStock, trzbaDnes, uctenekDnes } });
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

  // 1) Výběr jazyka (čeština / slovenština)
  if (!localeSelected) {
    return (
      <ErrorBoundary>
        <LanguageSelect onDone={() => setLocaleSelected(true)} />
      </ErrorBoundary>
    );
  }

  // 2) Výběr režimu — první spuštění (jen jednou)
  if (!modeSelected || mode === null) {
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
    <div className="relative flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <AppHeader onOpenSettings={openSettings} />

      <main className="flex-1 overflow-hidden flex flex-col">
        {(activeTab === "spizirna" || (activeTab === "jidlo" && !calorieTracking)) && <PantryView />}
        {activeTab === "skenovat" && <Scanner />}
        {showFoodLog && <FoodLogView />}
        {activeTab === "recepty" && <RecipesView />}
        {activeTab === "nakup" && <ShoppingView />}
        {activeTab === "opakujici" && <RecurringView />}
        {activeTab === "provoz" && <ProvozView />}
      </main>

      <TabBar />

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
