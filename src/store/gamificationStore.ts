import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getCurrentMode } from "@/store/modeStore";

export interface GamificationStore {
  streak: number;
  lastActivityDate: string | null;
  totalScanned: number;
  totalCooked: number;
  totalSaved: number; // počet položek zachráněných před expirací
  totalWasted: number; // počet prošlých položek odebraných
  weeklyAdded: number; // přidáno tento týden
  weekStart: string | null;

  recordActivity: () => void; // zavolat při každé akci uživatele (skenování, přidání)
  recordScanned: () => void;
  recordCooked: () => void;
  recordSaved: () => void;
  recordWasted: () => void;
  recordAdded: () => void;
  getScore: () => number;
  getLevel: () => { levelKey: string; emoji: string; min: number; next: number };
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
    (set, get) => ({
      streak: 0,
      lastActivityDate: null,
      totalScanned: 0,
      totalCooked: 0,
      totalSaved: 0,
      totalWasted: 0,
      weeklyAdded: 0,
      weekStart: null,

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
      },

      recordAdded: () => {
        get().recordActivity();
        const week = getMonday(new Date());
        const { weekStart, weeklyAdded } = get();
        set({
          weeklyAdded: weekStart === week ? weeklyAdded + 1 : 1,
          weekStart: week,
        });
      },

      recordCooked: () => {
        get().recordActivity();
        set({ totalCooked: get().totalCooked + 1 });
      },

      recordSaved: () => {
        get().recordActivity();
        set({ totalSaved: get().totalSaved + 1 });
      },

      recordWasted: () => {
        set({ totalWasted: get().totalWasted + 1 });
      },

      getScore: () => {
        const { totalScanned, totalCooked, totalSaved, totalWasted, streak } = get();
        return Math.max(
          0,
          totalScanned * 5 +
          totalCooked * 15 +
          totalSaved * 20 -
          totalWasted * 10 +
          streak * 3
        );
      },

      getLevel: () => {
        // Vrací klíč úrovně (lokalizace v komponentě), emoji a hranice skóre
        // (min = začátek úrovně, next = skóre další úrovně) pro progress bar.
        const score = get().getScore();
        if (score < 50) return { levelKey: "game.level.beginner", emoji: "🌱", min: 0, next: 50 };
        if (score < 150) return { levelKey: "game.level.cook", emoji: "🍳", min: 50, next: 150 };
        if (score < 350) return { levelKey: "game.level.chef", emoji: "👨‍🍳", min: 150, next: 350 };
        if (score < 700) return { levelKey: "game.level.master", emoji: "🏆", min: 350, next: 700 };
        return { levelKey: "game.level.legend", emoji: "⭐", min: 700, next: Infinity };
      },
    }),
    { name: `gamification-store-${getCurrentMode()}` }
  )
);
