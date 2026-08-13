import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppMode = "domacnost" | "provoz";

interface ModeStore {
  mode: AppMode | null; // null = ještě nevybráno
  setMode: (mode: AppMode) => void;
}

export const useModeStore = create<ModeStore>()(
  persist(
    (set, get) => ({
      mode: null,
      setMode: (mode) => {
        const prev = get().mode;
        set({ mode });
        // Reload i při PRVNÍM výběru (prev === null): recipeStore/priceStore/
        // gamificationStore čtou getCurrentMode() jen jednou při načtení modulu
        // (persist klíč i seed dat), takže bez reloadu by zůstaly navždy
        // omylem naseedované podle výchozího módu "domácnost" — typicky se tak
        // novému provozu (restaurace/obchod) omylem nabídnou domácí recepty
        // místo gastro receptáře, dokud uživatel appku ručně neobnoví.
        if (prev !== mode && typeof window !== "undefined") {
          window.location.reload();
        }
      },
    }),
    { name: "app-mode" }
  )
);

// Čte aktuální mód přímo z localStorage (synchronně, bez React)
// Použije se jako suffix persist klíče ve storech
export function getCurrentMode(): "domacnost" | "provoz" {
  if (typeof window === "undefined") return "domacnost";
  try {
    const raw = localStorage.getItem("app-mode");
    if (!raw) return "domacnost";
    const parsed = JSON.parse(raw);
    return parsed?.state?.mode === "provoz" ? "provoz" : "domacnost";
  } catch {
    return "domacnost";
  }
}
