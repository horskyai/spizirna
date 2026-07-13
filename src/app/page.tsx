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
import { scheduleDailyNudges } from "@/lib/notifications";
import { usePantryStore } from "@/store/pantryStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useFamilyStore } from "@/store/familyStore";
import { syncNow, startRealtime, stopRealtime, schedulePush } from "@/lib/familySync";
import { useProvozShareStore } from "@/store/provozShareStore";
import { provozSyncNow, provozStartRealtime, provozStopRealtime, provozSchedulePush } from "@/lib/provozSync";
import { useProvozStore } from "@/store/provozStore";
import { useKasaStore } from "@/store/kasaStore";

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

  // Přátelské lokální notifikace (jen v appce) — při každém otevření přeplánuj
  // denní pošťouchnutí na příští dny v 9:00. Spočítá, co brzy končí, kolik je
  // na nákupu a jak dlouho appku neotevřel (kvůli výběru vhodné zprávy).
  useEffect(() => {
    if (!user) return;
    try {
      const LAST_OPEN_KEY = "last-opened-at";
      const prev = Number(localStorage.getItem(LAST_OPEN_KEY) || 0);
      const daysAgo = prev ? Math.floor((Date.now() - prev) / 86_400_000) : 0;
      localStorage.setItem(LAST_OPEN_KEY, String(Date.now()));

      const expiringCount = usePantryStore.getState().getExpiringItems(3).length;
      const shoppingCount = useShoppingStore.getState().getItems("domacnost").filter((i) => !i.checked).length;

      scheduleDailyNudges({ expiringCount, shoppingCount, lastOpenedDaysAgo: daysAgo });
    } catch { /* notifikace nejsou kritické */ }
  }, [user]);

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
