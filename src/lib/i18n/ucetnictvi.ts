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
