"use client";

import { Sparkles, ArrowUpRight } from "lucide-react";
import { usePantryStore } from "@/store/pantryStore";
import { useModeStore } from "@/store/modeStore";
import { useUIStore } from "@/store/uiStore";
import { useDiscountStore } from "@/store/discountStore";
import { getLimitState, FREE_LIMIT } from "@/lib/pantryLimit";
import { useT } from "@/lib/i18n";

// Banner freemium limitu (jen domácnost). Měkký limit: nad 45 položek
// upozorní, nad 50 výrazně pobídne k předplatnému (149 Kč/měs).
// Položky se přidávají dál — neblokuje.
export function PantryLimitBanner() {
  const t = useT();
  const count = usePantryStore((s) => s.items.length);
  const mode = useModeStore((s) => s.mode);
  const openSettings = useUIStore((s) => s.openSettings);
  const unlockedYearly = useDiscountStore((s) => s.unlockedYearly);

  const state = getLimitState(count, mode === "provoz");
  if (state === "ok") return null;

  const over = state === "over";
  const title = t(over ? "pantry.limit.overTitle" : "pantry.limit.nearTitle");
  const text = t(over ? "pantry.limit.over" : "pantry.limit.near")
    .replace("{n}", String(count))
    .replace("{max}", String(FREE_LIMIT));

  // Nad limitem výraznější (oranžová), pod limitem jemné upozornění.
  const accent = over ? "#E8862E" : "var(--green-dark)";
  const bg = over ? "#FFF3E0" : "var(--green-light)";

  return (
    <div className="rounded-2xl mb-4 p-3.5" style={{ background: bg, border: `1px solid ${over ? "#F7B267" : "transparent"}` }}>
      <div className="flex items-start gap-2.5">
        <Sparkles size={18} style={{ color: accent, flexShrink: 0, marginTop: 1 }} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>{text}</p>
          {over && unlockedYearly && (
            <p className="text-xs font-bold mt-2" style={{ color: "#E8862E" }}>
              {t("pantry.limit.discount").replace("{n}", String(unlockedYearly))}
            </p>
          )}
          {over && (
            <button
              onClick={openSettings}
              className="flex items-center gap-1.5 mt-2.5 px-3.5 py-2 rounded-full text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #F7B267 0%, #E8862E 100%)", color: "white" }}
            >
              {t("pantry.limit.upgrade")} <ArrowUpRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
