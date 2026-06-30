import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getCurrentMode } from "@/store/modeStore";

// Statistiky, ze kterých se počítá skóre i odznaky.
export interface GamificationStats {
  streak: number;
  totalScanned: number;
  totalCooked: number;
  totalSaved: number;
  totalWasted: number;
  weeklyAdded: number;
}

export interface GamificationStore extends GamificationStats {
  lastActivityDate: string | null;
  weekStart: string | null;
  // Odemčené odznaky: id → ISO datum získání.
  unlockedBadges: Record<string, string>;

  recordActivity: () => void; // zavolat při každé akci uživatele (skenování, přidání)
  recordScanned: () => void;
  recordCooked: () => void;
  recordSaved: () => void;
  recordWasted: () => void;
  recordAdded: () => void;
  getScore: () => number;
  getLevel: () => LevelInfo;
  getBadges: () => BadgeState[];
}

// ── Úrovně ──────────────────────────────────────────────────────────────
// 15 úrovní s rostoucími prahy (rychlý start, velmi dlouhý konec). Strop 50k+.
// next = skóre další úrovně (Infinity u poslední) pro progress bar.
export interface LevelInfo {
  index: number;       // 0-based pořadí úrovně
  levelKey: string;
  emoji: string;
  min: number;
  next: number;
}

const LEVELS: { key: string; emoji: string; min: number }[] = [
  { key: "game.level.l1", emoji: "🌱", min: 0 },
  { key: "game.level.l2", emoji: "🍳", min: 50 },
  { key: "game.level.l3", emoji: "🥘", min: 150 },
  { key: "game.level.l4", emoji: "👨‍🍳", min: 350 },
  { key: "game.level.l5", emoji: "🧑‍🍳", min: 700 },
  { key: "game.level.l6", emoji: "🍲", min: 1200 },
  { key: "game.level.l7", emoji: "🥗", min: 2000 },
  { key: "game.level.l8", emoji: "🏅", min: 3200 },
  { key: "game.level.l9", emoji: "🎖️", min: 5000 },
  { key: "game.level.l10", emoji: "🏆", min: 7500 },
  { key: "game.level.l11", emoji: "💎", min: 11000 },
  { key: "game.level.l12", emoji: "👑", min: 16000 },
  { key: "game.level.l13", emoji: "🌟", min: 23000 },
  { key: "game.level.l14", emoji: "🔥", min: 35000 },
  { key: "game.level.l15", emoji: "⭐", min: 50000 },
];

// ── Odznaky ─────────────────────────────────────────────────────────────
// Každý odznak: id, emoji, klíč názvu/popisu, a podmínka + cíl pro progress.
// `value(stats)` vrací aktuální hodnotu, `goal` je práh splnění.
export interface BadgeDef {
  id: string;
  emoji: string;
  goal: number;
  value: (s: GamificationStats) => number;
}

export interface BadgeState {
  id: string;
  emoji: string;
  goal: number;
  current: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

const BADGES: BadgeDef[] = [
  // Vaření
  { id: "cook_1", emoji: "🍳", goal: 1, value: (s) => s.totalCooked },
  { id: "cook_10", emoji: "🥘", goal: 10, value: (s) => s.totalCooked },
  { id: "cook_50", emoji: "👨‍🍳", goal: 50, value: (s) => s.totalCooked },
  { id: "cook_100", emoji: "🧑‍🍳", goal: 100, value: (s) => s.totalCooked },
  { id: "cook_250", emoji: "🏅", goal: 250, value: (s) => s.totalCooked },
  // Skenování
  { id: "scan_1", emoji: "📷", goal: 1, value: (s) => s.totalScanned },
  { id: "scan_25", emoji: "🔍", goal: 25, value: (s) => s.totalScanned },
  { id: "scan_100", emoji: "📸", goal: 100, value: (s) => s.totalScanned },
  { id: "scan_500", emoji: "🛰️", goal: 500, value: (s) => s.totalScanned },
  // Záchrana potravin
  { id: "save_1", emoji: "💚", goal: 1, value: (s) => s.totalSaved },
  { id: "save_10", emoji: "🌿", goal: 10, value: (s) => s.totalSaved },
  { id: "save_50", emoji: "♻️", goal: 50, value: (s) => s.totalSaved },
  { id: "save_150", emoji: "🌍", goal: 150, value: (s) => s.totalSaved },
  { id: "save_500", emoji: "🦸", goal: 500, value: (s) => s.totalSaved },
  // Série (streak)
  { id: "streak_3", emoji: "🔥", goal: 3, value: (s) => s.streak },
  { id: "streak_7", emoji: "📅", goal: 7, value: (s) => s.streak },
  { id: "streak_30", emoji: "🗓️", goal: 30, value: (s) => s.streak },
  { id: "streak_100", emoji: "💯", goal: 100, value: (s) => s.streak },
  { id: "streak_365", emoji: "🎆", goal: 365, value: (s) => s.streak },
  // Týdenní aktivita
  { id: "week_10", emoji: "🛒", goal: 10, value: (s) => s.weeklyAdded },
  { id: "week_25", emoji: "📦", goal: 25, value: (s) => s.weeklyAdded },
  // Skóre milníky
  { id: "score_500", emoji: "✨", goal: 500, value: scoreOf },
  { id: "score_2000", emoji: "🌠", goal: 2000, value: scoreOf },
  { id: "score_10000", emoji: "👑", goal: 10000, value: scoreOf },
  { id: "score_50000", emoji: "⭐", goal: 50000, value: scoreOf },
];

// Skóre jako čistá funkce nad statistikami (sdílí ji getScore i odznaky).
function scoreOf(s: GamificationStats): number {
  return Math.max(
    0,
    s.totalScanned * 5 +
    s.totalCooked * 15 +
    s.totalSaved * 20 -
    s.totalWasted * 10 +
    s.streak * 3
  );
}

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => {
      // Po každé akci zkontroluj, jestli se neodemkl nový odznak.
      // Odemčené už nikdy neodebíráme (i kdyby hodnota klesla).
      const checkBadges = () => {
        const s = get();
        const stats: GamificationStats = {
          streak: s.streak, totalScanned: s.totalScanned, totalCooked: s.totalCooked,
          totalSaved: s.totalSaved, totalWasted: s.totalWasted, weeklyAdded: s.weeklyAdded,
        };
        const unlocked = { ...s.unlockedBadges };
        let changed = false;
        const now = new Date().toISOString();
        for (const b of BADGES) {
          if (!unlocked[b.id] && b.value(stats) >= b.goal) {
            unlocked[b.id] = now;
            changed = true;
          }
        }
        if (changed) set({ unlockedBadges: unlocked });
      };

      return {
        streak: 0,
        lastActivityDate: null,
        totalScanned: 0,
        totalCooked: 0,
        totalSaved: 0,
        totalWasted: 0,
        weeklyAdded: 0,
        weekStart: null,
        unlockedBadges: {},

        recordActivity: () => {
          const today = todayStr();
          const { lastActivityDate, streak } = get();
          let newStreak = streak;
          if (lastActivityDate === null) {
            newStreak = 1;
          } else if (lastActivityDate === today) {
            // already counted today
          } else {
            const last = new Date(lastActivityDate);
            const todayDate = new Date(today);
            const diff = (todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
            newStreak = diff === 1 ? streak + 1 : 1;
          }
          set({ streak: newStreak, lastActivityDate: today });
        },

        recordScanned: () => {
          get().recordActivity();
          const week = getMonday(new Date());
          const { weekStart, weeklyAdded } = get();
          set({
            totalScanned: get().totalScanned + 1,
            weeklyAdded: weekStart === week ? weeklyAdded + 1 : 1,
            weekStart: week,
          });
          checkBadges();
        },

        recordAdded: () => {
          get().recordActivity();
          const week = getMonday(new Date());
          const { weekStart, weeklyAdded } = get();
          set({
            weeklyAdded: weekStart === week ? weeklyAdded + 1 : 1,
            weekStart: week,
          });
          checkBadges();
        },

        recordCooked: () => {
          get().recordActivity();
          set({ totalCooked: get().totalCooked + 1 });
          checkBadges();
        },

        recordSaved: () => {
          get().recordActivity();
          set({ totalSaved: get().totalSaved + 1 });
          checkBadges();
        },

        recordWasted: () => {
          set({ totalWasted: get().totalWasted + 1 });
          checkBadges();
        },

        getScore: () => scoreOf(get()),

        getLevel: () => {
          // Najdi nejvyšší úroveň, jejíž práh skóre už uživatel splňuje.
          const score = scoreOf(get());
          let idx = 0;
          for (let i = 0; i < LEVELS.length; i++) {
            if (score >= LEVELS[i].min) idx = i;
          }
          const cur = LEVELS[idx];
          const next = idx + 1 < LEVELS.length ? LEVELS[idx + 1].min : Infinity;
          return { index: idx, levelKey: cur.key, emoji: cur.emoji, min: cur.min, next };
        },

        getBadges: () => {
          const s = get();
          const stats: GamificationStats = {
            streak: s.streak, totalScanned: s.totalScanned, totalCooked: s.totalCooked,
            totalSaved: s.totalSaved, totalWasted: s.totalWasted, weeklyAdded: s.weeklyAdded,
          };
          return BADGES.map((b) => {
            const unlockedAt = s.unlockedBadges[b.id] ?? null;
            return {
              id: b.id,
              emoji: b.emoji,
              goal: b.goal,
              current: Math.min(b.value(stats), b.goal),
              unlocked: unlockedAt !== null,
              unlockedAt,
            };
          });
        },
      };
    },
    { name: `gamification-store-${getCurrentMode()}` }
  )
);
