"use client";

import { Utensils, ShoppingCart, Package, ClipboardList, FileSpreadsheet, Menu } from "lucide-react";
import { useUIStore, type Tab, type ProvozSubTab } from "@/store/uiStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useRecurringStore } from "@/store/recurringStore";
import { useModeStore } from "@/store/modeStore";
import { useBusinessStore } from "@/store/businessStore";
import { useFeaturesStore } from "@/store/featuresStore";
import { useT, TranslationKey } from "@/lib/i18n";

// provozSub: pro provozní režim říká, na kterou vnitřní záložku Provozu skočit.
type TabDef = { id: string; labelKey: string; icon: string; provozSub?: ProvozSubTab };

const TABS_DOMACNOST: readonly TabDef[] = [
  { id: "spizirna", labelKey: "tab.spizirna", icon: "/tabs/spizirna.png" },
  { id: "recepty", labelKey: "tab.recepty", icon: "/tabs/recepty.png" },
  { id: "skenovat", labelKey: "tab.skenovat", icon: "/tabs/skenovat.png" },
  { id: "nakup", labelKey: "tab.nakup", icon: "/tabs/nakup.png" },
  { id: "opakujici", labelKey: "tab.opakujici", icon: "/tabs/opakovani.png" },
];

// Tab "Jídlo" (deník kalorií) — přidá se do domácnosti jen když má uživatel
// zapnuté sledování kalorií. Vloží se před poslední tab (Opakování).
const FOOD_TAB: TabDef = { id: "jidlo", labelKey: "tab.jidlo", icon: "lucide:utensils" };

// Provozní lišta — nejdůležitější pro provozovnu hned po ruce. Všechny míří na
// tab "provoz", ale skočí na svou vnitřní záložku (provozSub). "Víc" otevře
// Provozní lišta se liší podle typu provozu (obchod/restaurace):
//   • název Sklad → „Sklad zboží" (obchod) vs „Sklad surovin" (restaurace)
//   • „Víc" míří na první vedlejší sekci — obchod nemá Recepty → Dodavatelé.
function provozTabs(jeObchod: boolean): readonly TabDef[] {
  return [
    { id: "provoz", labelKey: "tab.kasa", icon: "lucide:cart", provozSub: "kasa" },
    { id: "provoz", labelKey: jeObchod ? "tab.skladZbozi" : "tab.skladSurovin", icon: "lucide:box", provozSub: "sklad" },
    { id: "provoz", labelKey: "tab.inventura", icon: "lucide:clipboard", provozSub: "inventura" },
    { id: "provoz", labelKey: "tab.ucto", icon: "lucide:sheet", provozSub: "ucetnictvi" },
    { id: "provoz", labelKey: "tab.vic", icon: "lucide:menu", provozSub: jeObchod ? "dodavatele" : "recepty" },
  ];
}

// Lucide ikony dostupné pro taby bez PNG.
const LUCIDE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  "lucide:utensils": Utensils,
  "lucide:cart": ShoppingCart,
  "lucide:box": Package,
  "lucide:clipboard": ClipboardList,
  "lucide:sheet": FileSpreadsheet,
  "lucide:menu": Menu,
};

export function TabBar() {
  const { activeTab, setTab } = useUIStore();
  const provozSubTab = useUIStore((s) => s.provozSubTab);
  const openProvoz = useUIStore((s) => s.openProvoz);
  const { mode } = useModeStore();
  const jeObchod = useBusinessStore((s) => s.typProvozu) === "obchod";
  const t = useT();
  const shoppingMode = mode === "provoz" ? "provoz" : "domacnost";
  const shoppingCount = useShoppingStore((s) => s.getItems(shoppingMode).filter((i) => !i.checked).length);
  const dueCount = useRecurringStore((s) => s.getDueItems().length);
  const calorieTracking = useFeaturesStore((s) => s.calorieTracking);

  // Domácnost: když má uživatel zapnuté sledování kalorií, vlož tab "Jídlo"
  // před poslední (Opakování). V provozu se kalorie nesledují.
  const TABS = mode === "provoz"
    ? provozTabs(jeObchod)
    : calorieTracking
      ? [...TABS_DOMACNOST.slice(0, -1), FOOD_TAB, TABS_DOMACNOST[TABS_DOMACNOST.length - 1]]
      : TABS_DOMACNOST;

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
        {TABS.map(({ id, labelKey, icon, provozSub }) => {
          // V provozu se aktivita řídí vnitřní záložkou (activeTab je vždy "provoz").
          // "Víc" (provozSub "dodavatele") je aktivní i pro ostatní vedlejší záložky.
          const HLAVNI: ProvozSubTab[] = ["kasa", "sklad", "inventura", "ucetnictvi"];
          const active = provozSub
            ? activeTab === "provoz" && (
                provozSub === "dodavatele"
                  ? !HLAVNI.includes(provozSubTab)
                  : provozSubTab === provozSub
              )
            : activeTab === id;
          const isCenter = id === "skenovat";
          const badge = id === "nakup" && shoppingCount > 0 ? shoppingCount
            : id === "opakujici" && dueCount > 0 ? dueCount
            : null;
          const size = isCenter ? 58 : 46;
          const LucideIcon = LUCIDE_ICONS[icon];

          return (
            <button
              key={provozSub ? `provoz-${provozSub}` : id}
              onClick={() => provozSub ? openProvoz(provozSub) : setTab(id as Tab)}
              style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 2 }}
            >
              <div style={{ position: "relative" }}>
                {LucideIcon ? (
                  // Tab bez vlastního PNG — lucide ikona v dlaždici laděné do zbytku.
                  <div
                    style={{
                      width: size, height: size, borderRadius: "24%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: active ? "var(--green-primary)" : "var(--border)",
                      boxShadow: active ? "0 5px 14px rgba(76,175,130,0.45)" : "none",
                      transform: active ? "translateY(-3px) scale(1.05)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <LucideIcon size={size * 0.5} color={active ? "white" : "var(--text-tertiary)"} />
                  </div>
                ) : (
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
                )}
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
