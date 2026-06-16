"use client";

import { useUIStore } from "@/store/uiStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useRecurringStore } from "@/store/recurringStore";
import { useModeStore } from "@/store/modeStore";
import { useT, TranslationKey } from "@/lib/i18n";

const TABS_DOMACNOST = [
  { id: "spizirna", labelKey: "tab.spizirna", icon: "/tabs/spizirna.png" },
  { id: "recepty", labelKey: "tab.recepty", icon: "/tabs/recepty.png" },
  { id: "skenovat", labelKey: "tab.skenovat", icon: "/tabs/skenovat.png" },
  { id: "nakup", labelKey: "tab.nakup", icon: "/tabs/nakup.png" },
  { id: "opakujici", labelKey: "tab.opakujici", icon: "/tabs/opakovani.png" },
] as const;

const TABS_PROVOZ = [
  { id: "spizirna", labelKey: "tab.spizirna", icon: "/tabs/spizirna.png" },
  { id: "recepty", labelKey: "tab.recepty", icon: "/tabs/recepty.png" },
  { id: "skenovat", labelKey: "tab.skenovat", icon: "/tabs/skenovat.png" },
  { id: "nakup", labelKey: "tab.nakup", icon: "/tabs/nakup.png" },
  { id: "provoz", labelKey: "tab.provoz", icon: "/tabs/provoz.png" },
] as const;

export function TabBar() {
  const { activeTab, setTab } = useUIStore();
  const { mode } = useModeStore();
  const t = useT();
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
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around" }}>
        {TABS.map(({ id, labelKey, icon }) => {
          const active = activeTab === id;
          const isCenter = id === "skenovat";
          const badge = id === "nakup" && shoppingCount > 0 ? shoppingCount
            : id === "opakujici" && dueCount > 0 ? dueCount
            : null;
          const size = isCenter ? 58 : 46;

          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 2 }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={icon}
                  alt=""
                  width={size}
                  height={size}
                  draggable={false}
                  style={{
                    borderRadius: "24%",
                    filter: active || isCenter ? "none" : "grayscale(1) opacity(0.5)",
                    boxShadow: active || isCenter ? "0 5px 14px rgba(76,175,130,0.45)" : "none",
                    transform: active ? "translateY(-3px) scale(1.05)" : "none",
                    transition: "filter 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                />
                {badge && (
                  <span
                    style={{
                      position: "absolute", top: -6, right: -6,
                      minWidth: 20, height: 20, borderRadius: 10,
                      padding: "0 4px",
                      background: "var(--red)", color: "white",
                      fontSize: 11, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2.5px solid white",
                      boxShadow: "0 2px 6px rgba(217,87,87,0.5)",
                      lineHeight: 1,
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 500, color: active ? "var(--green-primary)" : "var(--text-tertiary)" }}>
                {t(labelKey as TranslationKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
