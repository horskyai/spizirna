"use client";

import { useUIStore } from "@/store/uiStore";
import { TabBar } from "@/components/TabBar";
import { AppHeader } from "@/components/AppHeader";
import { PantryView } from "@/components/PantryView";
import { Scanner } from "@/components/Scanner";
import { FoodLogView } from "@/components/FoodLogView";
import { RecipesView } from "@/components/RecipesView";
import { ShoppingView } from "@/components/ShoppingView";
import { ProductSheet } from "@/components/ProductSheet";

export default function Home() {
  const { activeTab, activeSheet, scannedProduct, closeSheet } = useUIStore();

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
    </div>
  );
}
