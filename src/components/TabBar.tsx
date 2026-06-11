"use client";

import { useUIStore } from "@/store/uiStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useRecurringStore } from "@/store/recurringStore";
import { useModeStore } from "@/store/modeStore";
import { Home, ChefHat, Scan, ShoppingCart, RefreshCw, ClipboardList } from "lucide-react";

const TABS_DOMACNOST = [
  { id: "spizirna", Icon: Home },
  { id: "recepty", Icon: ChefHat },
  { id: "skenovat", Icon: Scan },
  { id: "nakup", Icon: ShoppingCart },
  { id: "opakujici", Icon: RefreshCw },
] as const;

const TABS_PROVOZ = [
  { id: "spizirna", Icon: Home },
  { id: "recepty", Icon: ChefHat },
  { id: "skenovat", Icon: Scan },
  { id: "nakup", Icon: ShoppingCart },
  { id: "provoz", Icon: ClipboardList },
] as const;

export function TabBar() {
  const { activeTab, setTab } = useUIStore();
  const { mode } = useModeStore();
  const shoppingMode = mode === "provoz" ? "provoz" : "domacnost";
  const shoppingCount = useShoppingStore((s) => s.getItems(shoppingMode).filter((i) => !i.checked).length);
  const dueCount = useRecurringStore((s) => s.getDueItems().length);

  const TABS = mode === "provoz" ? TABS_PROVOZ : TABS_DOMACNOST;

  return (
    <nav
      style={{
        background: "white",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 12px)",
        paddingTop: 10,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        {TABS.map(({ id, Icon }) => {
          const active = activeTab === id;
          const badge = id === "nakup" && shoppingCount > 0 ? shoppingCount
            : id === "opakujici" && dueCount > 0 ? dueCount
            : null;

          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 2 }}
            >
              <div
                style={{
                  width: 46, height: 46, borderRadius: 15,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active
                    ? "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)"
                    : "transparent",
                  boxShadow: active ? "0 5px 14px rgba(76,175,130,0.45)" : "none",
                  transition: "background 0.15s ease, box-shadow 0.15s ease",
                  position: "relative",
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.8}
                  style={{ color: active ? "white" : "var(--text-secondary)" }}
                />
                {badge && (
                  <span
                    style={{
                      position: "absolute", top: -4, right: -4,
                      minWidth: 19, height: 19, borderRadius: 10,
                      padding: "0 4px",
                      background: "var(--red)", color: "white",
                      fontSize: 10, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid white",
                      lineHeight: 1,
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
