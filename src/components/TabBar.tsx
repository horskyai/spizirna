"use client";

import { useUIStore } from "@/store/uiStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { ShoppingBag, ScanLine, UtensilsCrossed, BookOpen, ShoppingCart } from "lucide-react";

const TABS = [
  { id: "spizirna", label: "Spižírna", Icon: ShoppingBag },
  { id: "jidlo", label: "Jídlo", Icon: UtensilsCrossed },
  { id: "skenovat", label: "Skenovat", Icon: ScanLine },
  { id: "recepty", label: "Recepty", Icon: BookOpen },
  { id: "nakup", label: "Nákup", Icon: ShoppingCart },
] as const;

export function TabBar() {
  const { activeTab, setTab } = useUIStore();
  const shoppingCount = useShoppingStore((s) => s.items.filter((i) => !i.checked).length);

  return (
    <nav className="tab-bar flex-shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", alignItems: "flex-end", paddingTop: 8, paddingBottom: 4, paddingLeft: 4, paddingRight: 4 }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          const isCenter = id === "skenovat";
          const badge = id === "nakup" && shoppingCount > 0 ? shoppingCount : null;

          if (isCenter) {
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: -20 }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: "var(--green-primary)",
                    boxShadow: "0 4px 20px rgba(107,143,94,0.4)",
                  }}
                >
                  <Icon size={22} color="white" strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 500, color: active ? "var(--green-primary)" : "var(--text-tertiary)" }}>
                  {label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, paddingTop: 4, paddingBottom: 4 }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: active ? "var(--green-light)" : "transparent", position: "relative" }}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.2 : 1.6}
                  style={{ color: active ? "var(--green-primary)" : "var(--text-tertiary)" }}
                />
                {badge && (
                  <span
                    style={{
                      position: "absolute", top: -2, right: -2,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "var(--green-primary)", color: "white",
                      fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: active ? "var(--green-primary)" : "var(--text-tertiary)" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
