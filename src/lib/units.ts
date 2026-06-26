// Práce s jednotkami množství. Cíl: uvnitř appky držet jen základní jednotky
// (g, ml, ks), aby šly hodnoty sčítat bez chyb typu "1 kg + 300 g = 301 kg".
// Větší/menší jednotky (kg, l, dkg) se při ukládání převedou na základní;
// na zobrazení se z g/ml zase odvodí kg/l (viz formatQuantity).

export type BaseUnit = "g" | "ml" | "ks";

// Převede množství v libovolné jednotce na základní jednotku produktu.
// kg→g, l→ml, dkg→g; cokoli neznámého spadne na "ks".
export function toBaseUnit(quantity: number, unit: string): { quantity: number; unit: BaseUnit } {
  const u = unit.toLowerCase().trim();
  switch (u) {
    case "kg":
      return { quantity: quantity * 1000, unit: "g" };
    case "dkg":
    case "dag":
      return { quantity: quantity * 10, unit: "g" };
    case "g":
    case "mg": // mg je drobnost, držíme v g
      return { quantity, unit: "g" };
    case "l":
      return { quantity: quantity * 1000, unit: "ml" };
    case "ml":
      return { quantity, unit: "ml" };
    case "ks":
      return { quantity, unit: "ks" };
    default:
      // balení, lžíce, hrnek… – nemáme společný základ, bereme jako kusy
      return { quantity, unit: "ks" };
  }
}

// Sečte dvě množství. Když mají kompatibilní základ (oba hmotnost / oba objem /
// oba kusy), vrátí součet v základní jednotce. Když jsou nekompatibilní
// (např. g + ks), vrátí null — volající ať raději založí samostatný záznam.
export function addQuantities(
  a: { quantity: number; unit: string },
  b: { quantity: number; unit: string },
): { quantity: number; unit: BaseUnit } | null {
  const ba = toBaseUnit(a.quantity, a.unit);
  const bb = toBaseUnit(b.quantity, b.unit);
  if (ba.unit !== bb.unit) return null;
  return { quantity: round2(ba.quantity + bb.quantity), unit: ba.unit };
}

// Zobrazení: z g/ml udělá kg/l, když je hodnota dost velká (1300 g → "1,3 kg").
// Desetinný oddělovač je čárka (CZ/SK). Kusy zaokrouhlí na celé.
export function formatQuantity(quantity: number, unit: string): string {
  const u = unit.toLowerCase().trim();
  if (u === "g" && quantity >= 1000) return `${cz(round2(quantity / 1000))} kg`;
  if (u === "ml" && quantity >= 1000) return `${cz(round2(quantity / 1000))} l`;
  if (u === "ks") return `${Math.round(quantity)} ks`;
  return `${cz(round2(quantity))} ${unit}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function cz(n: number): string {
  return String(n).replace(".", ",");
}
