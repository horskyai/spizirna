"use client";

import { useMemo } from "react";
import { Flame, Sprout } from "lucide-react";
import { useGamificationStore } from "@/store/gamificationStore";
import { useT } from "@/lib/i18n";

// Malý odznak pokroku navrch přehledu: úroveň, body do další úrovně,
// série dnů a počet zachráněných potravin. Data počítá gamificationStore.
export function ProgressBadge() {
  const t = useT();
  // Selektujeme jen surová čísla (stabilní primitivy) — kdybychom v selektoru
  // vraceli getLevel(), vznikl by pokaždé nový objekt → nekonečné re-rendery
  // (React #185). score/level proto počítáme z metod mimo reaktivní selektor.
  const streak = useGamificationStore((s) => s.streak);
  const totalSaved = useGamificationStore((s) => s.totalSaved);
  const totalScanned = useGamificationStore((s) => s.totalScanned);
  const totalCooked = useGamificationStore((s) => s.totalCooked);
  const totalWasted = useGamificationStore((s) => s.totalWasted);

  // score/level počítáme přes metody storu, ale přepočet vážeme na surová
  // čísla (useMemo) — getScore/getLevel se tak nevolají v reaktivním selektoru.
  const { score, level } = useMemo(() => {
    const s = useGamificationStore.getState();
    return { score: s.getScore(), level: s.getLevel() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak, totalSaved, totalScanned, totalCooked, totalWasted]);

  // Postup v rámci aktuální úrovně (0–100 %).
  const span = level.next === Infinity ? 1 : level.next - level.min;
  const progress = level.next === Infinity ? 100 : Math.min(100, Math.round(((score - level.min) / span) * 100));

  const streakText =
    streak === 0 ? t("game.streakZero")
    : streak === 1 ? t("game.streakOne")
    : t("game.streak").replace("{n}", String(streak));

  const savedText =
    totalSaved === 0 ? t("game.savedZero")
    : totalSaved === 1 ? t("game.savedOne")
    : t("game.saved").replace("{n}", String(totalSaved));

  return (
    <div className="card overflow-hidden mb-4">
      <div className="px-3.5 py-2.5">
        {/* Řádek: úroveň + body vlevo, série + zachráněno vpravo */}
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: 18, lineHeight: 1 }}>{level.emoji}</span>
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{t(level.levelKey)}</span>
          <span className="text-xs font-bold" style={{ color: "var(--green-dark)" }}>
            · {t("game.points").replace("{n}", String(score))}
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }} title={streakText}>
              <Flame size={13} style={{ color: streak > 0 ? "#F59E42" : "var(--text-tertiary)" }} />
              {streak}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }} title={savedText}>
              <Sprout size={13} style={{ color: totalSaved > 0 ? "var(--green-primary)" : "var(--text-tertiary)" }} />
              {totalSaved}
            </span>
          </div>
        </div>

        {/* Tenký progress bar k další úrovni */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--green-light)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)", transition: "width 0.4s ease" }}
          />
        </div>
      </div>
    </div>
  );
}
