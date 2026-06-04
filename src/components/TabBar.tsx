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
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          const isCenter = id === "skenovat";
          const badge = id === "nakup" && shoppingCount > 0 ? shoppingCount : null;

          if (isCenter) {
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex flex-col items-center gap-0.5 -mt-5"
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
                <span className="text-xs font-medium" style={{ color: active ? "var(--green-primary)" : "var(--text-tertiary)", fontSize: 10 }}>
                  {label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="relative flex flex-col items-center gap-0.5 min-w-12 py-1 transition-all"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: active ? "var(--green-light)" : "transparent" }}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.2 : 1.6}
                  style={{ color: active ? "var(--green-primary)" : "var(--text-tertiary)" }}
                />
                {badge && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ background: "var(--green-primary)", fontSize: 9 }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span
                className="font-medium transition-all"
                style={{ color: active ? "var(--green-primary)" : "var(--text-tertiary)", fontSize: 10 }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
