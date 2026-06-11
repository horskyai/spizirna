"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader } from "lucide-react";

export interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
}

// Převod mluvených čísel na číslice
const NUMBERS: Record<string, number> = {
  jeden: 1, jedna: 1, jedno: 1, "jednu": 1,
  dva: 2, dvě: 2, dve: 2,
  tři: 3, čtyři: 4, pět: 5, šest: 6, sedm: 7, osm: 8, devět: 9, deset: 10,
  jedenáct: 11, dvanáct: 12, třináct: 13, čtrnáct: 14, patnáct: 15,
  šestnáct: 16, sedmnáct: 17, osmnáct: 18, devatenáct: 19, dvacet: 20,
  půl: 0.5, "půlka": 0.5, čtvrt: 0.25,
};

const UNIT_ALIASES: Record<string, string> = {
  gram: "g", gramu: "g", gramů: "g", gramy: "g",
  kilogram: "kg", kilogramu: "kg", kilogramů: "kg", kilogramy: "kg", kilo: "kg",
  dekagram: "dkg", dekagramů: "dkg",
  mililitr: "ml", mililitru: "ml", mililitrů: "ml", mililitry: "ml",
  litr: "l", litru: "l", litrů: "l", litry: "l",
  lžíce: "lžíce", lžíci: "lžíce", lžic: "lžíce",
  lžička: "lžička", lžičky: "lžička", lžiček: "lžička",
  hrnek: "hrnek", hrnku: "hrnek", hrnků: "hrnek", hrnky: "hrnek",
  kus: "ks", kusy: "ks", kusu: "ks", kusů: "ks",
  balení: "balení", balenie: "balení",
  stroužek: "stroužky", stroužky: "stroužky", stroužků: "stroužky",
  větvička: "větvičky", větvičky: "větvičky",
  plátky: "plátky", plátek: "plátky", plátků: "plátky",
  lístky: "listů", lístek: "listů",
};

export function parseSpokenText(text: string): ParsedItem[] {
  const results: ParsedItem[] = [];

  // Rozdělíme na položky podle: čárka, "a", "pak", "dále", "taky", "také"
  const segments = text
    .toLowerCase()
    .split(/,|\sa\s|\spak\s|\sdále\s|\staky\s|\stakté\s|\splus\s/i)
    .map(s => s.trim())
    .filter(s => s.length > 1);

  for (const segment of segments) {
    const words = segment.trim().split(/\s+/);
    let quantity = 1;
    let unit = "ks";
    let nameStart = 0;

    // Hledáme číslo (číslici nebo slovo)
    let i = 0;
    if (words[i]) {
      const num = parseFloat(words[i]);
      if (!isNaN(num)) {
        quantity = num;
        i++;
      } else if (NUMBERS[words[i]]) {
        quantity = NUMBERS[words[i]];
        i++;
      }
    }

    // Hledáme jednotku
    if (words[i] && UNIT_ALIASES[words[i]]) {
      unit = UNIT_ALIASES[words[i]];
      i++;
    } else if (words[i] === "g" || words[i] === "kg" || words[i] === "ml" || words[i] === "l") {
      unit = words[i];
      i++;
    }

    nameStart = i;
    const name = words.slice(nameStart).join(" ").trim();

    if (name.length > 1) {
      results.push({ name: capitalize(name), quantity, unit });
    }
  }

  return results;
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
