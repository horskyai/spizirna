// Vrátí aktuální mód z localStorage — použije se jako suffix persist klíče
// Funguje i na serveru (SSR) — tam vrátí "domacnost" jako fallback
export function getModeKey(): "domacnost" | "provoz" {
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
