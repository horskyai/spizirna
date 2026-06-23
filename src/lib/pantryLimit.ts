// Freemium limit pro domácnost: do FREE_LIMIT položek zdarma, nad to výzva
// k předplatnému. Měkký limit — položky se přidávají dál, jen se varuje.
// Provozovna limit nemá (má vlastní placený model).

export const FREE_LIMIT = 50;
// Od kolika položek začneme nenápadně upozorňovat, že se blíží limit.
export const WARN_FROM = 45;

export type LimitState = "ok" | "near" | "over";

// Vrátí stav vůči limitu podle počtu položek. Pro provoz vždy "ok".
export function getLimitState(count: number, isProvoz: boolean): LimitState {
  if (isProvoz) return "ok";
  if (count > FREE_LIMIT) return "over";
  if (count >= WARN_FROM) return "near";
  return "ok";
}
