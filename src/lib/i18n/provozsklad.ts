import type { Translation } from "./dict";

// Přehled skladu v tabu "Spižírna" pro režim provozovna (ProvozSkladView).
export const provozsklad: Record<string, Translation> = {
  "provozsklad.emptyTitle": { cs: "Sklad je prázdný", sk: "Sklad je prázdny" },
  "provozsklad.emptySubtitle": {
    cs: "Přidej položky do skladu naskenováním, ručně nebo hlasem v sekci Provoz.",
    sk: "Pridaj položky do skladu naskenovaním, ručne alebo hlasom v sekcii Prevádzka.",
  },
  "provozsklad.goToProvoz": { cs: "Přejít do Provozu", sk: "Prejsť do Prevádzky" },
  "provozsklad.searchPlaceholder": { cs: "Hledat ve skladu...", sk: "Hľadať v sklade..." },
  "provozsklad.count": { cs: "{n} položek ve skladu", sk: "{n} položiek v sklade" },
  "provozsklad.openInventory": { cs: "Otevřít inventuru", sk: "Otvoriť inventúru" },
  "provozsklad.minStock": { cs: "min. {n} {unit}", sk: "min. {n} {unit}" },
  "provozsklad.belowMin": { cs: "Pod minimem", sk: "Pod minimom" },

  // Dnešní přehled (karta navrch skladu v provozovně)
  "provozsklad.summary.belowMinItems": { cs: "{n} položek je pod minimem", sk: "{n} položiek je pod minimom" },
  "provozsklad.summary.belowMinOne": { cs: "1 položka je pod minimem", sk: "1 položka je pod minimom" },
};
