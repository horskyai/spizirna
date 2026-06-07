"use client";

import { useUIStore } from "@/store/uiStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useRecurringStore } from "@/store/recurringStore";
import { ShoppingBag, ScanLine, UtensilsCrossed, BookOpen, ShoppingCart, RefreshCw } from "lucide-react";

const TABS = [
  { id: "spizirna", label: "Spižírna", Icon: ShoppingBag },
  { id: "jidlo", label: "Jídlo", Icon: UtensilsCrossed },
  { id: "skenovat", label: "Skenovat", Icon: ScanLine },
  { id: "recepty", label: "Recepty", Icon: BookOpen },
  { id: "nakup", label: "Nákup", Icon: ShoppingCart },
  { id: "opakujici", label: "Zásoby", Icon: RefreshCw },
] as const;

export function TabBar() {
  const { activeTab, setTab } = useUIStore();
  const shoppingCount = useShoppingStore((s) => s.items.filter((i) => !i.checked).length);
  const dueCount = useRecurringStore((s) => s.getDueItems().length);

  return (
    <nav
      style={{
        background: "var(--bg-primary)",
        paddingBottom: "env(safe-area-inset-bottom, 12px)",
        paddingTop: 8,
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around" }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          const isCenter = id === "skenovat";
          const badge = id === "nakup" && shoppingCount > 0 ? shoppingCount
            : id === "opakujici" && dueCount > 0 ? dueCount : null;

          if (isCenter) {
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 2 }}
              >
                <div
                  style={{
                    width: 58, height: 58, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
                    boxShadow: "0 6px 20px rgba(76,175,130,0.45)",
                  }}
                >
                  <Icon size={24} color="white" strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--green-primary)" }}>{label}</span>
              </button>
            );
          }

          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 2 }}
            >
              <div
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active
                    ? "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)"
                    : "white",
                  boxShadow: active
                    ? "0 4px 14px rgba(76,175,130,0.4)"
                    : "0 2px 8px rgba(0,0,0,0.10)",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.6}
                  style={{ color: active ? "white" : "var(--text-tertiary)" }}
                />
                {badge && (
                  <span
                    style={{
                      position: "absolute", top: 1, right: 1,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "var(--red)", color: "white",
                      fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid var(--bg-primary)",
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 500, color: active ? "var(--green-primary)" : "var(--text-tertiary)" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
