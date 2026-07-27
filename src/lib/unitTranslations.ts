// Překlad jednotek surovin čeština → slovenština. Stejný princip jako
// tagTranslations.ts — jednotka není v datech dvojjazyčná, je to krátké
// klíčové slovo. Chybějící jednotka se zobrazí beze změny (fallback).
const UNIT_SK: Record<string, string> = {
  "dle chuti": "podľa chuti",
  "hrst": "hrsť",
  "lžička": "lyžička",
  "lžičky": "lyžičky",
  "lžíce": "lyžica",
  "plátek": "plátok",
  "plátků": "plátkov",
  "snítka": "vetvička",
  "stroužek": "strúčik",
  "stroužky": "strúčiky",
  "svazek": "zväzok",
  "špetka": "štipka",
  "stonek": "stonka",
};

export function translateUnit(unit: string): string {
  return UNIT_SK[unit.toLowerCase()] ?? unit;
}
