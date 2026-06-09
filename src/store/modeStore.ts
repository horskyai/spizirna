import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppMode = "domacnost" | "provoz";

interface ModeStore {
  mode: AppMode | null; // null = ještě nevybráno
  setMode: (mode: AppMode) => void;
}

export const useModeStore = create<ModeStore>()(
  persist(
    (set) => ({
      mode: null,
      setMode: (mode) => set({ mode }),
    }),
    { name: "app-mode" }
  )
);
