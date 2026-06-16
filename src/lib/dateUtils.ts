import { getCurrentLocale } from "@/store/localeStore";

// BCP-47 tag pro Intl podle zvoleného jazyka (čte se synchronně z localStorage).
function dateLocale(): string {
  return getCurrentLocale() === "sk" ? "sk-SK" : "cs-CZ";
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(dateLocale(), {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(dateLocale(), {
    day: "numeric",
    month: "short",
  });
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}
