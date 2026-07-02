"use client";

import { useMemo } from "react";
import { X, TrendingUp, Package, Leaf, Trophy } from "lucide-react";
import { usePantryStore } from "@/store/pantryStore";
import { useGamificationStore } from "@/store/gamificationStore";
import { useT } from "@/lib/i18n";
import type { StorageLocation } from "@/types";

const LOCATION_KEYS: Record<StorageLocation, string> = {
  lednice: "pantry.location.lednice",
  mrazak: "pantry.location.mrazak",
  spiz: "pantry.location.spiz",
  linka: "pantry.location.linka",
};

export function StatsModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const items = usePantryStore((s) => s.items);

  // Gamifikační počítadla — jediná spolehlivá historická data, co teď máme.
  const totalSaved = useGamificationStore((s) => s.totalSaved);
  const totalWasted = useGamificationStore((s) => s.totalWasted);
  const savedValue = useGamificationStore((s) => s.savedValue);
  const wastedValue = useGamificationStore((s) => s.wastedValue);
  const streak = useGamificationStore((s) => s.streak);
  const score = useGamificationStore((s) => s.getScore());
  const level = useGamificationStore((s) => s.getLevel());

  const stats = useMemo(() => {
    // Hodnota spižírny = součet ceny × množství tam, kde známe cenu.
    let value = 0;
    let pricedItems = 0;
    for (const it of items) {
      if (it.price_paid != null) {
        value += it.price_paid * (it.quantity || 1);
        pricedItems++;
      }
    }

    // Rozložení podle uložení.
    const byLocation: Record<string, number> = {};
    for (const it of items) {
      byLocation[it.location] = (byLocation[it.location] || 0) + 1;
    }

    // Nejdražší položky (cena × množství), top 3.
    const priciest = items
      .filter((it) => it.price_paid != null)
      .map((it) => ({ name: it.product?.product_name ?? "", total: (it.price_paid || 0) * (it.quantity || 1) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    // Míra záchrany: kolik z (zachráněno+vyhozeno) se povedlo zachránit.
    const handled = totalSaved + totalWasted;
    const saveRate = handled > 0 ? Math.round((totalSaved / handled) * 100) : null;

    // Plýtvání/záchrana v Kč. Přesnou část (savedValue/wastedValue) máme z položek,
    // co měly cenu. Zbytek odhadneme průměrnou cenou za kus aktuální spižírny.
    const avgPerItem = pricedItems > 0 ? value / items.reduce((n, it) => n + (it.price_paid != null ? (it.quantity || 1) : 0), 0) : 0;
    // Kolik událostí NEmělo cenu (odhadneme je průměrem). Přesné počty nevíme,
    // tak odhad vážeme na to, kolik z hodnoty už máme reálně změřeno.
    const wastedKc = wastedValue > 0 || avgPerItem === 0
      ? Math.round(wastedValue)
      : Math.round(totalWasted * avgPerItem);
    const savedKc = savedValue > 0 || avgPerItem === 0
      ? Math.round(savedValue)
      : Math.round(totalSaved * avgPerItem);
    // Odhad? Ano, když nemáme přesnou hodnotu, ale umíme ji dopočítat průměrem.
    const kcEstimated = (wastedValue === 0 && totalWasted > 0 && avgPerItem > 0)
      || (savedValue === 0 && totalSaved > 0 && avgPerItem > 0);

    return { value, pricedItems, byLocation, priciest, saveRate, wastedKc, savedKc, kcEstimated };
  }, [items, totalSaved, totalWasted, savedValue, wastedValue]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 210, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <div
        className="relative animate-slide-up"
        style={{
          background: "var(--bg-primary)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "90dvh",
          display: "flex",
          flexDirection: "column",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--border)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{t("stats.title")}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Dvě velké dlaždice: hodnota spižírny + počet položek */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <BigTile
              icon={<TrendingUp size={16} />}
              label={t("stats.pantryValue")}
              value={stats.value > 0 ? `${Math.round(stats.value).toLocaleString("cs-CZ")} Kč` : "—"}
              hint={stats.pricedItems > 0 ? t("stats.pantryValueHint").replace("{n}", String(stats.pricedItems)) : t("stats.noPrices")}
            />
            <BigTile
              icon={<Package size={16} />}
              label={t("stats.itemCount")}
              value={String(items.length)}
              hint={t("stats.inPantry")}
            />
          </div>

          {/* Zachráněno vs. vyhozeno */}
          <Card>
            <SectionTitle icon={<Leaf size={15} />} title={t("stats.wasteTitle")} />
            <div style={{ display: "flex", gap: 10 }}>
              <MiniStat color="var(--green-dark)" bg="var(--green-light)" value={String(totalSaved)} label={t("stats.saved")} />
              <MiniStat color="#C0392B" bg="#FDE8E8" value={String(totalWasted)} label={t("stats.wasted")} />
            </div>
            {(stats.savedKc > 0 || stats.wastedKc > 0) && (
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <MiniStat color="var(--green-dark)" bg="var(--green-light)" value={`${stats.savedKc.toLocaleString("cs-CZ")} Kč`} label={t("stats.savedKc")} />
                <MiniStat color="#C0392B" bg="#FDE8E8" value={`${stats.wastedKc.toLocaleString("cs-CZ")} Kč`} label={t("stats.wastedKc")} />
              </div>
            )}
            {stats.kcEstimated && (
              <p style={{ fontSize: 10.5, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>{t("stats.kcEstimate")}</p>
            )}
            {stats.saveRate !== null && (
              <>
                <div style={{ height: 8, borderRadius: 99, background: "#FDE8E8", overflow: "hidden", marginTop: 12 }}>
                  <div style={{ width: `${stats.saveRate}%`, height: "100%", background: "var(--green-primary)", transition: "width 0.4s" }} />
                </div>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>
                  {t("stats.saveRate").replace("{n}", String(stats.saveRate))}
                </p>
              </>
            )}
          </Card>

          {/* Rozložení podle uložení */}
          {items.length > 0 && (
            <Card>
              <SectionTitle icon={<Package size={15} />} title={t("stats.byLocation")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(Object.keys(LOCATION_KEYS) as StorageLocation[]).map((loc) => {
                  const count = stats.byLocation[loc] || 0;
                  if (count === 0) return null;
                  const pct = Math.round((count / items.length) * 100);
                  return (
                    <div key={loc}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{t(LOCATION_KEYS[loc])}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>{count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--green-primary)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Nejdražší položky */}
          {stats.priciest.length > 0 && (
            <Card>
              <SectionTitle icon={<TrendingUp size={15} />} title={t("stats.priciest")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stats.priciest.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>{p.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 }}>{Math.round(p.total).toLocaleString("cs-CZ")} Kč</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Herní shrnutí */}
          <Card>
            <SectionTitle icon={<Trophy size={15} />} title={t("stats.gameTitle")} />
            <div style={{ display: "flex", gap: 10 }}>
              <MiniStat color="var(--text-primary)" bg="var(--bg-primary)" value={`${level.emoji} ${t(level.levelKey as Parameters<typeof t>[0])}`} label={t("stats.level")} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <MiniStat color="var(--text-primary)" bg="var(--bg-primary)" value={score.toLocaleString("cs-CZ")} label={t("stats.score")} />
              <MiniStat color="#E8862E" bg="#FDF0E0" value={`🔥 ${streak}`} label={t("stats.streak")} />
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "white", borderRadius: 16, padding: "12px 14px", border: "1.5px solid var(--border)" }}>{children}</div>;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
      <span style={{ color: "var(--green-primary)" }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</span>
    </div>
  );
}

function BigTile({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div style={{ background: "white", borderRadius: 16, padding: "14px", border: "1.5px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ color: "var(--green-primary)" }}>{icon}</span>
      <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1, overflowWrap: "anywhere" }}>{value}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontSize: 10.5, color: "var(--text-tertiary)", lineHeight: 1.3 }}>{hint}</span>
    </div>
  );
}

function MiniStat({ value, label, color, bg }: { value: string; label: string; color: string; bg: string }) {
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 12, padding: "10px 12px", textAlign: "center", minWidth: 0 }}>
      <p style={{ fontSize: 17, fontWeight: 800, color, margin: 0, overflowWrap: "anywhere" }}>{value}</p>
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" }}>{label}</p>
    </div>
  );
}
