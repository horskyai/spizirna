"use client";

import { useState, useEffect, Component, ReactNode } from "react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { TabBar } from "@/components/TabBar";
import { AppHeader } from "@/components/AppHeader";
import { PantryView } from "@/components/PantryView";
import { Scanner } from "@/components/Scanner";
import { FoodLogView } from "@/components/FoodLogView";
import { RecipesView } from "@/components/RecipesView";
import { ShoppingView } from "@/components/ShoppingView";
import { RecurringView } from "@/components/RecurringView";
import { ProductSheet } from "@/components/ProductSheet";
import { Onboarding } from "@/components/Onboarding";
import { AuthScreen } from "@/components/AuthScreen";

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
  const { activeTab, activeSheet, scannedProduct, closeSheet } = useUIStore();
  const { user, loading, init } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user && !localStorage.getItem("onboarding-done")) {
      setShowOnboarding(true);
    }
  }, [user]);

  const finishOnboarding = () => {
    localStorage.setItem("onboarding-done", "1");
    setShowOnboarding(false);
  };

  // Načítání
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh" style={{ background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--green-light)", borderTopColor: "var(--green-primary)", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Načítám...</p>
        </div>
      </div>
    );
  }

  // Nepřihlášený → přihlašovací obrazovka
  if (!user) {
    return (
      <ErrorBoundary>
        <AuthScreen />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className="relative flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <AppHeader />

      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "spizirna" && <PantryView />}
        {activeTab === "skenovat" && <Scanner />}
        {activeTab === "jidlo" && <FoodLogView />}
        {activeTab === "recepty" && <RecipesView />}
        {activeTab === "nakup" && <ShoppingView />}
        {activeTab === "opakujici" && <RecurringView />}
      </main>

      <TabBar />

      {activeSheet === "product" && scannedProduct && (
        <ProductSheet product={scannedProduct} onClose={() => closeSheet()} fromScanner={activeTab === "skenovat"} />
      )}

      {showOnboarding && <Onboarding onDone={finishOnboarding} />}
    </div>
    </ErrorBoundary>
  );
}
