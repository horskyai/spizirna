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
    <nav
      style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 12px)",
        paddingTop: 10,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          const isCenter = id === "skenovat";
          const badge = id === "nakup" && shoppingCount > 0 ? shoppingCount : null;

          if (isCenter) {
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: -24 }}
              >
                <div
                  style={{
                    width: 56, height: 56, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
                    boxShadow: "0 4px 18px rgba(76,175,130,0.45)",
                  }}
                >
                  <Icon size={22} color="white" strokeWidth={1.8} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <div
                style={{
                  width: 46, height: 46, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? "var(--green-light)" : "white",
                  boxShadow: active ? "0 2px 10px rgba(76,175,130,0.25)" : "0 1px 4px rgba(0,0,0,0.08)",
                  border: active ? "1.5px solid var(--green-primary)" : "1.5px solid var(--border)",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.2 : 1.6}
                  style={{ color: active ? "var(--green-primary)" : "var(--text-tertiary)" }}
                />
                {badge && (
                  <span
                    style={{
                      position: "absolute", top: 0, right: 0,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "var(--red)", color: "white",
                      fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid white",
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
