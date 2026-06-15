"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader } from "lucide-react";

export interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
}

// Převod mluvených čísel na číslice (vč. hovorových / zkomolených tvarů,
// jak je často přepíše hlasové rozpoznávání — bez diakritiky apod.)
const NUMBERS: Record<string, number> = {
  jeden: 1, jedna: 1, jedno: 1, jednu: 1, jednou: 1,
  dva: 2, dvě: 2, dve: 2, dvakrát: 2, dvakrat: 2,
  tři: 3, tri: 3, čtyři: 4, ctyri: 4, pět: 5, pet: 5,
  šest: 6, sest: 6, sedm: 7, osm: 8, devět: 9, devet: 9, deset: 10,
  jedenáct: 11, jedenact: 11, dvanáct: 12, dvanact: 12, dvanácet: 12, dvanacet: 12,
  třináct: 13, trinact: 13, čtrnáct: 14, ctrnact: 14, patnáct: 15, patnact: 15,
  šestnáct: 16, sestnact: 16, sedmnáct: 17, sedmnact: 17, osmnáct: 18, osmnact: 18,
  devatenáct: 19, devatenact: 19, dvacet: 20, dvacít: 20, dvacit: 20,
  třicet: 30, tricet: 30, čtyřicet: 40, ctyricet: 40, padesát: 50, padesat: 50,
  šedesát: 60, sedesat: 60, sedmdesát: 70, sedmdesat: 70,
  osmdesát: 80, osmdesat: 80, devadesát: 90, devadesat: 90,
  dvěstě: 200, dveste: 200, třista: 300, trista: 300, čtyřista: 400, ctyrista: 400,
  pětset: 500, petset: 500, šestset: 600, sestset: 600,
  půl: 0.5, půlka: 0.5, pul: 0.5, pulka: 0.5, čtvrt: 0.25, ctvrt: 0.25,
};

// Násobky pro skládání čísel typu "pět set", "dvě stě", "tři tisíce"
const SCALES: Record<string, number> = {
  set: 100, sto: 100, stě: 100, ste: 100, sta: 100, stovek: 100,
  tisíc: 1000, tisic: 1000, tisíce: 1000, tisice: 1000, tisíců: 1000, tisicu: 1000,
};

const UNIT_ALIASES: Record<string, string> = {
  // krátké symboly (Google je u čísel často přepíše rovnou takto)
  g: "g", kg: "kg", dkg: "dkg", dag: "dkg", mg: "g", ml: "ml", l: "l",
  gram: "g", gramu: "g", gramů: "g", gramy: "g",
  kilogram: "kg", kilogramu: "kg", kilogramů: "kg", kilogramy: "kg",
  kilo: "kg", kila: "kg", kil: "kg",
  deko: "dkg", dekagram: "dkg", dekagramů: "dkg", deka: "dkg",
  mililitr: "ml", mililitru: "ml", mililitrů: "ml", mililitry: "ml",
  litr: "l", litru: "l", litrů: "l", litry: "l",
  lžíce: "lžíce", lžíci: "lžíce", lžic: "lžíce",
  lžička: "lžička", lžičky: "lžička", lžiček: "lžička",
  hrnek: "hrnek", hrnku: "hrnek", hrnků: "hrnek", hrnky: "hrnek",
  kus: "ks", kusy: "ks", kusu: "ks", kusů: "ks",
  balení: "balení", balenie: "balení", balíček: "balení", balíčky: "balení",
  plechovka: "ks", plechovky: "ks",
  lahev: "ks", lahve: "ks", láhev: "ks",
  konzerva: "ks", konzervy: "ks",
  stroužek: "stroužky", stroužky: "stroužky", stroužků: "stroužky",
  větvička: "větvičky", větvičky: "větvičky",
  plátky: "plátky", plátek: "plátky", plátků: "plátky",
  lístky: "listů", lístek: "listů",
};

// Vrací číselnou hodnotu slova, nebo null pokud to není číslo
function wordToNumber(w: string): number | null {
  const digit = parseFloat(w.replace(",", "."));
  if (!isNaN(digit)) return digit;
  if (w in NUMBERS) return NUMBERS[w];
  return null;
}

export function parseSpokenText(text: string): ParsedItem[] {
  // Normalizace: malá písmena, "a" jako oddělovač pryč, slova jako tokeny
  const words = text
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\s+a\s+/g, " ")
    .replace(/\s+(pak|dále|potom|ještě|taky|také|plus)\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  type Token =
    | { kind: "num"; value: number }
    | { kind: "scale"; value: number }
    | { kind: "unit"; value: string }
    | { kind: "word"; value: string };

  const tokens: Token[] = words.map((w): Token => {
    const n = wordToNumber(w);
    if (n !== null) return { kind: "num", value: n };
    if (w in SCALES) return { kind: "scale", value: SCALES[w] };
    if (w in UNIT_ALIASES) return { kind: "unit", value: UNIT_ALIASES[w] };
    return { kind: "word", value: w };
  });

  const results: ParsedItem[] = [];
  let i = 0;

  while (i < tokens.length) {
    let quantity = 1;
    let hasQuantity = false;
    let unit = "ks";
    let hasUnit = false;

    // 1) Množství — číslo, skládané se škálou ("pět set" = 500) i sčítané
    //    s navazujícími čísly ("dvacet pět" = 25, "sto dvacet" = 120)
    const t = tokens[i];
    if (t?.kind === "num") {
      quantity = t.value;
      hasQuantity = true;
      i++;
      // násobení škálou: "pět set", "dvě stě", "tři tisíce"
      while (tokens[i]?.kind === "scale") {
        quantity *= (tokens[i] as Extract<typeof tokens[number], { kind: "scale" }>).value;
        i++;
      }
      // sčítání menšího čísla: "dvacet pět" (20+5), "sto dvacet" (100+20),
      // skládá jen pokud je další číslo menší než dosavadní součet
      while (
        tokens[i]?.kind === "num" &&
        (tokens[i] as Extract<typeof tokens[number], { kind: "num" }>).value < quantity
      ) {
        quantity += (tokens[i] as Extract<typeof tokens[number], { kind: "num" }>).value;
        i++;
        while (tokens[i]?.kind === "scale") {
          quantity *= (tokens[i] as Extract<typeof tokens[number], { kind: "scale" }>).value;
          i++;
        }
      }
    } else if (t?.kind === "scale") {
      quantity = t.value; // "sto gramů"
      hasQuantity = true;
      i++;
    }

    // 2) Jednotka
    const u = tokens[i];
    if (u?.kind === "unit") {
      unit = u.value;
      hasUnit = true;
      i++;
    }

    // 3) Název = slova; jednotka může přijít i za názvem ("brambory 1200 g")
    const nameParts: string[] = [];
    while (i < tokens.length && tokens[i].kind === "word") {
      nameParts.push((tokens[i] as Extract<Token, { kind: "word" }>).value);
      i++;
    }
    // jednotka za názvem (jen pokud jsme ji ještě nezachytili před názvem)
    if (!hasUnit && tokens[i]?.kind === "unit") {
      unit = (tokens[i] as Extract<Token, { kind: "unit" }>).value;
      hasUnit = true;
      i++;
    }

    if (nameParts.length === 0) {
      // osamocené číslo/jednotka bez názvu — přeskoč, ať se nezacyklíme
      if (!hasQuantity && !hasUnit) i++;
      continue;
    }

    const name = nameParts.join(" ").trim();
    if (name.length > 1) {
      const norm = normalizeUnit(quantity, unit);
      results.push({ name: capitalize(name), quantity: norm.quantity, unit: norm.unit });
    }
  }

  return results;
}

// Hezčí jednotky: 1000+ g → kg, 1000+ ml → l (1200 g → 1.2 kg).
// Kusy se zaokrouhlí na celá čísla (nákupní seznam nemá "3,4 ks").
function normalizeUnit(quantity: number, unit: string): { quantity: number; unit: string } {
  if (unit === "g" && quantity >= 1000) return { quantity: round2(quantity / 1000), unit: "kg" };
  if (unit === "ml" && quantity >= 1000) return { quantity: round2(quantity / 1000), unit: "l" };
  if (unit === "dkg" && quantity >= 100) return { quantity: round2(quantity / 100), unit: "kg" };
  if (unit === "ks") return { quantity: Math.max(1, Math.round(quantity)), unit };
  return { quantity: round2(quantity), unit };
}

// Zaokrouhlí na 2 desetinná místa a zbaví plovoucí nepřesnosti (3.4000000000000004 → 3.4)
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Props {
  onResult: (items: ParsedItem[]) => void;
  label?: string;
}

export function VoiceInput({ onResult, label = "Nadiktovat" }: Props) {
  const [state, setState] = useState<"idle" | "listening" | "processing">("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript("");

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Váš prohlížeč nepodporuje hlasové zadávání. Zkuste Chrome nebo Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "cs-CZ";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => setState("listening");

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      if (result.isFinal) {
        setState("processing");
        const items = parseSpokenText(text);
        setTimeout(() => {
          onResult(items);
          setState("idle");
          setTranscript("");
        }, 400);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        setError("Nic jste neřekl. Zkuste znovu.");
      } else if (event.error === "not-allowed") {
        setError("Přístup k mikrofonu byl odmítnut.");
      } else {
        setError("Chyba rozpoznávání. Zkuste znovu.");
      }
      setState("idle");
    };

    recognition.onend = () => {
      if (state === "listening") setState("idle");
    };

    recognition.start();
  }, [onResult, state]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState("idle");
  }, []);

  const isActive = state === "listening" || state === "processing";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={isActive ? stopListening : startListening}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all"
        style={{
          background: state === "listening"
            ? "#FDE8E8"
            : state === "processing"
            ? "var(--green-light)"
            : "var(--bg-primary)",
          color: state === "listening"
            ? "#C0392B"
            : state === "processing"
            ? "var(--green-dark)"
            : "var(--text-secondary)",
          border: `1.5px solid ${state === "listening" ? "#FBBCBC" : state === "processing" ? "var(--green-primary)" : "var(--border)"}`,
        }}
      >
        {state === "listening" ? (
          <>
            <MicOff size={16} />
            <span>Poslouchám... (klepni pro stop)</span>
            <span style={{ display: "inline-flex", gap: 3 }}>
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  style={{
                    width: 4, height: 4, borderRadius: "50%",
                    background: "#C0392B",
                    animation: `bounce 0.8s ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </span>
          </>
        ) : state === "processing" ? (
          <><Loader size={16} className="animate-spin" /> Zpracovávám...</>
        ) : (
          <><Mic size={16} /> {label}</>
        )}
      </button>

      {transcript && state === "listening" && (
        <p className="text-xs px-3 py-2 rounded-xl italic" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>
          „{transcript}"
        </p>
      )}

      {error && (
        <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "#FDE8E8", color: "#C0392B" }}>
          {error}
        </p>
      )}

      <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
        Např. „2 kuřecí prsa, 300 gramů špaget, jeden litr mléka"
      </p>
    </div>
  );
}
