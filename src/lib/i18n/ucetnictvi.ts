import type { Translation } from "./dict";

// Účetnictví v provozním režimu — uzávěrka, DPH, zisk/marže, export.
export const ucetnictvi: Record<string, Translation> = {
  "provoz.tab.ucetnictvi": { cs: "Účetnictví", sk: "Účtovníctvo" },

  // Období
  "ucto.obdobi": { cs: "Období", sk: "Obdobie" },
  "ucto.dnes": { cs: "Dnes", sk: "Dnes" },
  "ucto.tyden": { cs: "Týden", sk: "Týždeň" },
  "ucto.mesic": { cs: "Měsíc", sk: "Mesiac" },
  "ucto.rok": { cs: "Rok", sk: "Rok" },
  "ucto.vlastni": { cs: "Vlastní", sk: "Vlastné" },
  "ucto.od": { cs: "Od", sk: "Od" },
  "ucto.do": { cs: "Do", sk: "Do" },

  // Uzávěrka
  "ucto.uzaverka": { cs: "Uzávěrka", sk: "Uzávierka" },
  "ucto.trzba": { cs: "Tržba celkem", sk: "Tržba spolu" },
  "ucto.uctenek": { cs: "Účtenek", sk: "Účteniek" },
  "ucto.uzavritDen": { cs: "Uzavřít den", sk: "Uzavrieť deň" },
  "ucto.denUzavren": { cs: "Den uzavřen ✓", sk: "Deň uzavretý ✓" },

  // Pokladní zásuvka (hotovost)
  "ucto.zasuvka.titul": { cs: "Pokladní zásuvka", sk: "Pokladničná zásuvka" },
  "ucto.zasuvka.ocekavano": { cs: "Má být:", sk: "Má byť:" },
  "ucto.zasuvka.pocatecni": { cs: "Počáteční vklad", sk: "Počiatočný vklad" },
  "ucto.zasuvka.pocatecniBtn": { cs: "Ranní vklad", sk: "Ranný vklad" },
  "ucto.zasuvka.trzbaHot": { cs: "Tržby hotově", sk: "Tržby hotovo" },
  "ucto.zasuvka.vraceni": { cs: "Vrácení hotově", sk: "Vrátené hotovo" },
  "ucto.zasuvka.vklad": { cs: "Vklad", sk: "Vklad" },
  "ucto.zasuvka.vyber": { cs: "Výběr", sk: "Výber" },
  "ucto.zasuvka.vklady": { cs: "Vklady", sk: "Vklady" },
  "ucto.zasuvka.vybery": { cs: "Výběry", sk: "Výbery" },
  "ucto.zasuvka.napocitano": { cs: "Napočítáno v zásuvce", sk: "Napočítané v zásuvke" },
  "ucto.zasuvka.sedi": { cs: "Sedí ✓", sk: "Sedí ✓" },
  "ucto.zasuvka.prebytek": { cs: "Přebytek", sk: "Prebytok" },
  "ucto.zasuvka.manko": { cs: "Manko", sk: "Manko" },

  "ucto.hotovost": { cs: "Hotovost", sk: "Hotovosť" },
  "ucto.karta": { cs: "Kartou", sk: "Kartou" },
  "ucto.zadneProdeje": { cs: "V tomto období žádný prodej", sk: "V tomto období žiadny predaj" },

  // Zisk / marže
  "ucto.zisk": { cs: "Zisk", sk: "Zisk" },
  "ucto.nakup": { cs: "Nákupní hodnota", sk: "Nákupná hodnota" },
  "ucto.marze": { cs: "Marže", sk: "Marža" },
  "ucto.ziskInfo": { cs: "Tržba − nákupní cena prodaného zboží", sk: "Tržba − nákupná cena predaného tovaru" },

  // DPH
  "ucto.dph": { cs: "DPH (daň z přidané hodnoty)", sk: "DPH (daň z pridanej hodnoty)" },
  "ucto.dphSazba": { cs: "Sazba", sk: "Sadzba" },
  "ucto.dphZaklad": { cs: "Základ", sk: "Základ" },
  "ucto.dphDan": { cs: "DPH", sk: "DPH" },
  "ucto.dphCelkem": { cs: "DPH celkem", sk: "DPH spolu" },
  "ucto.dphPozn": { cs: "Ceny jsou včetně DPH. Základ a daň se dopočítají zpětně.", sk: "Ceny sú vrátane DPH. Základ a daň sa dopočítajú spätne." },

  // Top produkty
  "ucto.top": { cs: "Nejprodávanější", sk: "Najpredávanejšie" },
  "ucto.kusu": { cs: "{n}×", sk: "{n}×" },

  // Export
  "ucto.export": { cs: "Export pro účetní", sk: "Export pre účtovníka" },
  "ucto.exportPdf": { cs: "PDF přehled", sk: "PDF prehľad" },
  "ucto.exportCsv": { cs: "CSV (prodeje)", sk: "CSV (predaje)" },
  "ucto.exportHlavicka": { cs: "Přehled prodejů", sk: "Prehľad predajov" },
  "ucto.datumOd": { cs: "od", sk: "od" },
  "ucto.datumDo": { cs: "do", sk: "do" },
};
