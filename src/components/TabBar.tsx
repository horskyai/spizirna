"use client";

import { useUIStore } from "@/store/uiStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useRecurringStore } from "@/store/recurringStore";
import { useModeStore } from "@/store/modeStore";

const TABS_DOMACNOST = [
  { id: "spizirna", label: "Spižírna", icon: "/tabs/spizirna.png" },
  { id: "recepty", label: "Recepty", icon: "/tabs/recepty.png" },
  { id: "skenovat", label: "Skenovat", icon: "/tabs/skenovat.png" },
  { id: "nakup", label: "Nákup", icon: "/tabs/nakup.png" },
  { id: "opakujici", label: "Opakování", icon: "/tabs/opakovani.png" },
] as const;

const TABS_PROVOZ = [
  { id: "spizirna", label: "Spižírna", icon: "/tabs/spizirna.png" },
  { id: "recepty", label: "Recepty", icon: "/tabs/recepty.png" },
  { id: "skenovat", label: "Skenovat", icon: "/tabs/skenovat.png" },
  { id: "nakup", label: "Nákup", icon: "/tabs/nakup.png" },
  { id: "provoz", label: "Provoz", icon: "/tabs/provoz.png" },
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
        background: "var(--bg-primary)",
        paddingBottom: "env(safe-area-inset-bottom, 12px)",
        paddingTop: 8,
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around" }}>
        {TABS.map(({ id, label, icon }) => {
          const active = activeTab === id;
          const isCenter = id === "skenovat";
          const badge = id === "nakup" && shoppingCount > 0 ? shoppingCount
            : id === "opakujici" && dueCount > 0 ? dueCount
            : null;

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
                    background: "white",
                    border: active ? "2.5px solid var(--green-primary)" : "2.5px solid var(--green-light)",
                    boxShadow: "0 6px 20px rgba(76,175,130,0.45)",
                  }}
                >
                  <img src={icon} alt="" width={48} height={48} draggable={false} />
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
                  background: "white",
                  border: active ? "2px solid var(--green-primary)" : "2px solid transparent",
                  boxShadow: active
                    ? "0 4px 14px rgba(76,175,130,0.4)"
                    : "0 2px 8px rgba(0,0,0,0.10)",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                <img
                  src={icon}
                  alt=""
                  width={40}
                  height={40}
                  draggable={false}
                  style={{
                    filter: active ? "none" : "grayscale(1) opacity(0.55)",
                    transition: "filter 0.2s ease",
                  }}
                />
                {badge && (
                  <span
                    style={{
                      position: "absolute", top: -2, right: -2,
                      minWidth: 20, height: 20, borderRadius: 10,
                      padding: "0 4px",
                      background: "var(--red)", color: "white",
                      fontSize: 11, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2.5px solid var(--bg-primary)",
                      boxShadow: "0 2px 6px rgba(217,87,87,0.5)",
                      lineHeight: 1,
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
