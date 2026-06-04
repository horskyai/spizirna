"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { TabBar } from "@/components/TabBar";
import { AppHeader } from "@/components/AppHeader";
import { PantryView } from "@/components/PantryView";
import { Scanner } from "@/components/Scanner";
import { FoodLogView } from "@/components/FoodLogView";
import { RecipesView } from "@/components/RecipesView";
import { ShoppingView } from "@/components/ShoppingView";
import { ProductSheet } from "@/components/ProductSheet";
import { Onboarding } from "@/components/Onboarding";

export default function Home() {
  const { activeTab, activeSheet, scannedProduct, closeSheet } = useUIStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("onboarding-done")) {
      setShowOnboarding(true);
    }
  }, []);

  const finishOnboarding = () => {
    localStorage.setItem("onboarding-done", "1");
    setShowOnboarding(false);
  };

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <AppHeader />

      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "spizirna" && <PantryView />}
        {activeTab === "skenovat" && <Scanner />}
        {activeTab === "jidlo" && <FoodLogView />}
        {activeTab === "recepty" && <RecipesView />}
        {activeTab === "nakup" && <ShoppingView />}
      </main>

      <TabBar />

      {/* Product sheet rendered at root level so it covers full screen incl. tab bar */}
      {activeSheet === "product" && scannedProduct && (
        <ProductSheet product={scannedProduct} onClose={() => closeSheet()} />
      )}

      {/* Onboarding — shown only on first visit */}
      {showOnboarding && <Onboarding onDone={finishOnboarding} />}
    </div>
  );
}
