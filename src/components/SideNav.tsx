"use client";

// Postranní menu pro PC (≥1024px). Na mobilu se NEzobrazuje (CSS .pc-only).
// Sdílí stejnou tab logiku jako spodní TabBar — jen jinak vykreslenou.

import { Menu, Settings } from "lucide-react";
import { useUIStore, type Tab, type ProvozSubTab } from "@/store/uiStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useRecurringStore } from "@/store/recurringStore";
import { useModeStore } from "@/store/modeStore";
import { useBusinessStore } from "@/store/businessStore";
import { useJeZamestnanec } from "@/store/employeeStore";
import { useFeaturesStore } from "@/store/featuresStore";
import { useT, TranslationKey } from "@/lib/i18n";

type TabDef = { id: string; labelKey: string; icon: string; provozSub?: ProvozSubTab };

const TABS_DOMACNOST: readonly TabDef[] = [
  { id: "spizirna", labelKey: "tab.spizirna", icon: "/tabs/spizirna.png" },
  { id: "recepty", labelKey: "tab.recepty", icon: "/tabs/recepty.png" },
  { id: "skenovat", labelKey: "tab.skenovat", icon: "/tabs/skenovat.png" },
  { id: "nakup", labelKey: "tab.nakup", icon: "/tabs/nakup.png" },
  { id: "opakujici", labelKey: "tab.opakujici", icon: "/tabs/opakovani.png" },
];
const FOOD_TAB: TabDef = { id: "jidlo", labelKey: "tab.jidlo", icon: "/tabs/jidlo.png" };

function provozTabs(jeObchod: boolean): readonly TabDef[] {
  return [
    { id: "provoz", labelKey: "tab.kasa", icon: "/tabs/kasa.png", provozSub: "kasa" },
    { id: "provoz", labelKey: jeObchod ? "tab.skladZbozi" : "tab.skladSurovin", icon: "/tabs/sklad.png", provozSub: "sklad" },
    { id: "provoz", labelKey: "tab.inventura", icon: "/tabs/inventura.png", provozSub: "inventura" },
    { id: "provoz", labelKey: "tab.ucto", icon: "/tabs/ucto.png", provozSub: "ucetnictvi" },
    { id: "provoz", labelKey: "tab.vic", icon: "lucide:menu", provozSub: jeObchod ? "dodavatele" : "recepty" },
  ];
}

export function SideNav({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { activeTab, setTab } = useUIStore();
  const provozActiveTab = useUIStore((s) => s.provozActiveTab);
  const openProvoz = useUIStore((s) => s.openProvoz);
  const { mode } = useModeStore();
  const jeObchod = useBusinessStore((s) => s.typProvozu) === "obchod";
  const zamestnanec = useJeZamestnanec();
  const t = useT();
  const shoppingMode = mode === "provoz" ? "provoz" : "domacnost";
  const shoppingCount = useShoppingStore((s) => s.getItems(shoppingMode).filter((i) => !i.checked).length);
  const dueCount = useRecurringStore((s) => s.getDueItems().length);
  const calorieTracking = useFeaturesStore((s) => s.calorieTracking);

  const TABS = mode === "provoz"
    ? (zamestnanec ? provozTabs(jeObchod).filter((tb) => tb.provozSub === "kasa") : provozTabs(jeObchod))
    : calorieTracking
      ? [...TABS_DOMACNOST.slice(0, -1), FOOD_TAB, TABS_DOMACNOST[TABS_DOMACNOST.length - 1]]
      : TABS_DOMACNOST;

  const HLAVNI: ProvozSubTab[] = ["kasa", "sklad", "inventura", "ucetnictvi"];

  return (
    <nav className="side-nav pc-only">
      {/* Logo / název nahoře */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 16px" }}>
        <img src="/icon-192.png" alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
        <span style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>Spižírna</span>
      </div>

      {TABS.map(({ id, labelKey, icon, provozSub }) => {
        const active = provozSub
          ? activeTab === "provoz" && (
              provozSub === "dodavatele" ? !HLAVNI.includes(provozActiveTab) : provozActiveTab === provozSub
            )
          : activeTab === id;
        const badge = id === "nakup" && shoppingCount > 0 ? shoppingCount
          : id === "opakujici" && dueCount > 0 ? dueCount
          : null;
        return (
          <button
            key={provozSub ? `provoz-${provozSub}` : id}
            className={`side-nav-item${active ? " active" : ""}`}
            onClick={() => provozSub ? openProvoz(provozSub) : setTab(id as Tab)}
          >
            {icon === "lucide:menu"
              ? <Menu size={22} style={{ flexShrink: 0 }} />
              : <img src={icon} alt="" className="side-nav-icon" style={{ objectFit: "contain" }} />}
            <span style={{ flex: 1 }}>{t(labelKey as TranslationKey)}</span>
            {badge && (
              <span style={{
                minWidth: 20, height: 20, borderRadius: 10, padding: "0 5px",
                background: active ? "rgba(255,255,255,0.3)" : "var(--red)", color: "white",
                fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
              }}>
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </button>
        );
      })}

      {/* Nastavení dole */}
      <div style={{ marginTop: "auto", paddingTop: 12 }}>
        <button className="side-nav-item" onClick={onOpenSettings}>
          <Settings size={22} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{t("settings.title")}</span>
        </button>
      </div>
    </nav>
  );
}
