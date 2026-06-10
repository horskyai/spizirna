"use client";

import { useState, useEffect, Component, ReactNode } from "react";
import { useUIStore } from "@/store/uiStore";
import { useModeStore } from "@/store/modeStore";
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
  const { mode } = useModeStore();

  // Zobraz ModeSelect (onboarding + výběr plánu) jen pokud plán ještě nebyl vybrán
  const [modeSelected, setModeSelected] = useState(() => {
    if (typeof window === "undefined") return true;
    const savedMode = localStorage.getItem("app-mode");
    return !!(savedMode && JSON.parse(savedMode)?.state?.mode !== null);
  });

  // Výběr režimu — první spuštění (jen jednou)
  if (!modeSelected || mode === null) {
    return (
      <ErrorBoundary>
        <ModeSelect onDone={() => setModeSelected(true)} />
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
        {activeTab === "provoz" && <ProvozView />}
      </main>

      <TabBar />

      {activeSheet === "product" && scannedProduct && (
        <ProductSheet product={scannedProduct} onClose={() => closeSheet()} fromScanner={activeTab === "skenovat"} />
      )}

    </div>
    </ErrorBoundary>
  );
}
