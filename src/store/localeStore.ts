import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "cs" | "sk";

interface LocaleStore {
  locale: Locale | null; // null = jazyk ještě nevybrán (první spuštění)
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: null,
      setLocale: (locale) => set({ locale }),
    }),
    { name: "app-locale" }
  )
);

// Čte aktuální jazyk přímo z localStorage (synchronně, bez Reactu).
// Výchozí čeština, pokud nic uloženého není.
export function getCurrentLocale(): Locale {
  if (typeof window === "undefined") return "cs";
  try {
    const raw = localStorage.getItem("app-locale");
    if (!raw) return "cs";
    const parsed = JSON.parse(raw);
    return parsed?.state?.locale === "sk" ? "sk" : "cs";
  } catch {
    return "cs";
  }
}
