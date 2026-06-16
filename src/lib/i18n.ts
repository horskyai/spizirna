"use client";

import { useLocaleStore, Locale } from "@/store/localeStore";
import { DICT } from "@/lib/i18n/dict";

// Klíč překladu. Slovník je modulární (viz src/lib/i18n/*), proto je klíč
// volný string — neexistující klíč translate() vrátí beze změny, takže appka
// nikdy nespadne na chybějícím překladu.
export type TranslationKey = string;

// Přeloží klíč do daného jazyka (čistá funkce, bez Reactu).
export function translate(key: TranslationKey, locale: Locale): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[locale] ?? entry.cs;
}

// React hook — vrátí překladovou funkci `t` navázanou na aktuální jazyk.
// Když jazyk ještě nebyl vybrán, použije se čeština.
export function useT(): (key: TranslationKey) => string {
  const locale = useLocaleStore((s) => s.locale) ?? "cs";
  return (key: TranslationKey) => translate(key, locale);
}

// Hook pro komponenty, které potřebují i samotný kód jazyka (např. pro výběr
// z dvojjazyčného objektu { cs, sk }).
export function useLocale(): Locale {
  return useLocaleStore((s) => s.locale) ?? "cs";
}
