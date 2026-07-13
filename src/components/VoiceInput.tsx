"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader, HelpCircle, ChevronDown } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { Capacitor } from "@capacitor/core";

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
  // ── slovenské tvary (české tvary už výše: dve, sest atd. nedupluji) ──
  jedného: 1, jednej: 1, dvaja: 2, štyri: 4, styri: 4, päť: 5, pat: 5,
  šesť: 6, sedem: 7, osem: 8, deväť: 9, devat: 9, desať: 10, desat: 10,
  jedenásť: 11, dvanásť: 12, trinásť: 13,
  štrnásť: 14, strnast: 14, pätnásť: 15, šestnásť: 16,
  sedemnásť: 17, osemnásť: 18, devätnásť: 19, devatnast: 19,
  dvadsať: 20, dvadsat: 20, tridsať: 30, tridsat: 30, štyridsať: 40, styridsat: 40,
  päťdesiat: 50, patdesiat: 50, šesťdesiat: 60, sestdesiat: 60,
  sedemdesiat: 70, osemdesiat: 80, deväťdesiat: 90, devatdesiat: 90,
  dvesto: 200, tristo: 300, štyristo: 400, styristo: 400, päťsto: 500, patsto: 500,
  šesťsto: 600, seststo: 600, pol: 0.5, štvrť: 0.25, stvrt: 0.25,
};

// Násobky pro skládání čísel typu "pět set", "dvě stě", "tři tisíce"
const SCALES: Record<string, number> = {
  set: 100, sto: 100, stě: 100, ste: 100, sta: 100, stovek: 100,
  tisíc: 1000, tisic: 1000, tisíce: 1000, tisice: 1000, tisíců: 1000, tisicu: 1000,
  // ── slovenské tvary (sta/tisíc/tisíce už výše) ──
  stovák: 100, stoviek: 100, tisícov: 1000, tisicov: 1000,
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
  // ── slovenské tvary (balenie/plechovka/konzerva už výše) ──
  gramov: "g", kilogramov: "kg", kilá: "kg", kíl: "kg",
  dekagramov: "dkg",
  mililiter: "ml", mililitra: "ml", mililitrov: "ml",
  liter: "l", litra: "l", litrov: "l", litre: "l",
  lyžica: "lžíce", lyžice: "lžíce", lyžíc: "lžíce",
  lyžička: "lžička", lyžičky: "lžička", lyžičiek: "lžička",
  hrnček: "hrnek", hrnčeky: "hrnek", hrnčekov: "hrnek",
  kusov: "ks",
  balíčok: "balení",
  fľaša: "ks", fľaše: "ks", fľaška: "ks",
  strúčik: "stroužky", strúčiky: "stroužky", strúčikov: "stroužky",
  vetvička: "větvičky", vetvičky: "větvičky",
  plátok: "plátky", plátkov: "plátky",
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

    const name = lemmatizeName(nameParts.join(" ").trim());
    if (name.length > 1) {
      const norm = normalizeUnit(quantity, unit);
      results.push({ name: capitalize(name), quantity: norm.quantity, unit: norm.unit });
    }
  }

  return results;
}

// Převod skloňovaných tvarů potravin do 1. pádu ("brambor" → "brambory",
// "mléka" → "mléko"). Slovník nejčastějších položek; co tam není, necháme být.
const LEMMA: Record<string, string> = {
  brambor: "brambory", brambory: "brambory",
  mléka: "mléko", mleka: "mléko", mléko: "mléko",
  másla: "máslo", masla: "máslo", máslo: "máslo", másel: "máslo",
  vajec: "vejce", vajíčka: "vejce", vajicka: "vejce", vejce: "vejce",
  rýže: "rýže", ryze: "rýže",
  mouky: "mouka", mouka: "mouka",
  cukru: "cukr", cukr: "cukr",
  soli: "sůl", sůl: "sůl", sul: "sůl",
  chleba: "chléb", chléb: "chléb", chleb: "chléb",
  rohlíků: "rohlíky", rohlíky: "rohlíky", rohliku: "rohlíky", rohliky: "rohlíky",
  housek: "housky", housky: "housky",
  sýra: "sýr", syra: "sýr", sýr: "sýr", syr: "sýr",
  šunky: "šunka", sunky: "šunka", šunka: "šunka",
  jogurtů: "jogurt", jogurty: "jogurt", jogurtu: "jogurt", jogurt: "jogurt",
  cibule: "cibule", cibuli: "cibule",
  česneku: "česnek", cesneku: "česnek", česnek: "česnek",
  rajčat: "rajčata", rajčata: "rajčata", rajcat: "rajčata", rajče: "rajčata",
  paprik: "paprika", papriky: "paprika", papriku: "paprika", paprika: "paprika",
  okurek: "okurky", okurky: "okurky", okurku: "okurky",
  mrkve: "mrkev", mrkví: "mrkev", mrkev: "mrkev",
  jablek: "jablka", jablka: "jablka", jablko: "jablka",
  banánů: "banány", banány: "banány", bananu: "banány", banany: "banány",
  kuřete: "kuřecí maso", kuřecího: "kuřecí maso", kureciho: "kuřecí maso",
  hovězího: "hovězí maso", hoveziho: "hovězí maso",
  vepřového: "vepřové maso", veproveho: "vepřové maso",
  těstovin: "těstoviny", těstoviny: "těstoviny", testovin: "těstoviny",
  kávy: "káva", kavy: "káva", káva: "káva", kava: "káva",
  čaje: "čaj", caje: "čaj", čaj: "čaj",
  // víceslovné fráze, jak je hlasovka přepíše ve skloňovaném tvaru
  "kuřecích prsou": "kuřecí prsa", "kurecich prsou": "kuřecí prsa",
  "kuřecí prsa": "kuřecí prsa", "kuřecích prsa": "kuřecí prsa",
  "kuřecího masa": "kuřecí maso", "kureciho masa": "kuřecí maso",
  "hovězího masa": "hovězí maso", "hoveziho masa": "hovězí maso",
  "vepřového masa": "vepřové maso", "veproveho masa": "vepřové maso",
  "mletého masa": "mleté maso", "mleteho masa": "mleté maso",
  "kysané smetany": "kysaná smetana", "kysane smetany": "kysaná smetana",
  "zakysané smetany": "zakysaná smetana", "zakysane smetany": "zakysaná smetana",
  "šlehačky": "šlehačka", "slehacky": "šlehačka",
  "sýru eidam": "sýr eidam", "syru eidam": "sýr eidam",
  "sýra eidam": "sýr eidam", "syra eidam": "sýr eidam",
  // ── slovenské názvy → český kanonický tvar (zobrazení si přeloží zpět).
  //    Klíče zde se nesmí krýt s českými výše (TS hlídá duplicity). ──
  zemiaky: "brambory", zemiakov: "brambory", zemiak: "brambory",
  mlieko: "mléko", mlieka: "mléko",
  maslo: "máslo",
  vajcia: "vejce", vajicia: "vejce",
  ryža: "rýže",
  múka: "mouka", múky: "mouka", muka: "mouka",
  cukor: "cukr",
  soľ: "sůl", sol: "sůl",
  chlieb: "chléb",
  rožky: "rohlíky", rožkov: "rohlíky", rozky: "rohlíky", rožok: "rohlíky",
  žemle: "housky", žemľa: "housky", zemle: "housky",
  jogurtov: "jogurt",
  cibuľa: "cibule",
  cesnak: "česnek", cesnaku: "česnek",
  paradajky: "rajčata", paradajok: "rajčata", paradajka: "rajčata",
  uhorky: "okurky", uhorka: "okurky", uhoriek: "okurky",
  mrkva: "mrkev", mrkvy: "mrkev",
  jablká: "jablka", jabĺk: "jablka",
  banánov: "banány",
  kura: "kuřecí maso", kurča: "kuřecí maso", kuracie: "kuřecí maso",
  hovädzie: "hovězí maso", hovadzie: "hovězí maso",
  bravčové: "vepřové maso", bravcove: "vepřové maso",
  cestoviny: "těstoviny", cestovín: "těstoviny",
  čaju: "čaj",
  // víceslovné slovenské fráze
  "kuracie prsia": "kuřecí prsa", "kuracích pŕs": "kuřecí prsa", "kuracích prs": "kuřecí prsa",
  "mleté mäso": "mleté maso", "mletého mäsa": "mleté maso",
  "kyslá smotana": "kysaná smetana", "kyslej smotany": "kysaná smetana",
  "smotana": "smetana", "smotany": "smetana",
  "šľahačka": "šlehačka", "šľahačky": "šlehačka",
};

// Jednotlivá poslední slova ve skloňovaném tvaru → 1. pád. Použije se, když
// víceslovná fráze není ve slovníku celá ("nějaký sýr eidam" → "...eidam").
const LEMMA_WORD: Record<string, string> = {
  prsou: "prsa", prsa: "prsa", prsíčka: "prsa", prsicka: "prsa",
  masa: "maso", maso: "maso",
  smetany: "smetana", smetana: "smetana",
  filé: "filé", filet: "filé", filety: "filé",
  sýra: "sýr", syra: "sýr", sýru: "sýr", syru: "sýr",
  jogurtu: "jogurt", jogurtů: "jogurt",
};

function lemmatizeName(name: string): string {
  const words = name.split(/\s+/);
  // jednoslovný název: zkus slovníky
  if (words.length === 1) {
    return LEMMA[words[0]] ?? LEMMA_WORD[words[0]] ?? name;
  }
  // víceslovný: nejdřív zkus celé spojení (např. "kuřecích prsou" → "kuřecí prsa")
  if (LEMMA[name]) return LEMMA[name];
  // jinak lemmatizuj poslední (hlavní) slovo — typicky "kuřecí prsou" → "...prsa"
  const last = words[words.length - 1];
  const lemmaLast = LEMMA[last] ?? LEMMA_WORD[last];
  if (lemmaLast) {
    words[words.length - 1] = lemmaLast;
    return words.join(" ");
  }
  // u některých spojení je skloňované první (hlavní) slovo — "sýra eidam" → "sýr eidam"
  const lemmaFirst = LEMMA_WORD[words[0]];
  if (lemmaFirst) {
    words[0] = lemmaFirst;
    return words.join(" ");
  }
  return name;
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

export function VoiceInput({ onResult, label }: Props) {
  const t = useT();
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "listening" | "processing">("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Nativní rozpoznávání řeči (jen v appce přes Capacitor plugin). Web tohle
  // nepoužije — tam běží webkitSpeechRecognition níže. WebView totiž webový
  // SpeechRecognition nemá, proto v appce voláme nativní Android rozpoznávání.
  const startNative = useCallback(async () => {
    setError(null);
    setTranscript("");
    try {
      const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");

      // Oprávnění mikrofonu (nativně)
      const perm = await SpeechRecognition.checkPermissions();
      if (perm.speechRecognition !== "granted") {
        const req = await SpeechRecognition.requestPermissions();
        if (req.speechRecognition !== "granted") {
          setError(t("voice.input.notAllowed"));
          return;
        }
      }

      setState("listening");
      // partialResults = průběžný přepis; jazyk dle locale.
      await SpeechRecognition.removeAllListeners();
      await SpeechRecognition.addListener("partialResults", (data: { matches: string[] }) => {
        if (data?.matches?.length) setTranscript(data.matches[0]);
      });

      const result = await SpeechRecognition.start({
        language: locale === "sk" ? "sk-SK" : "cs-CZ",
        maxResults: 1,
        partialResults: true,
        popup: false,
      });

      // Po dokončení: vezmi finální text a naparsuj položky.
      const text = (result?.matches && result.matches[0]) || "";
      await SpeechRecognition.removeAllListeners();
      if (text) {
        setTranscript(text);
        setState("processing");
        const items = parseSpokenText(text);
        setTimeout(() => {
          onResult(items);
          setState("idle");
          setTranscript("");
        }, 300);
      } else {
        setState("idle");
      }
    } catch (e: any) {
      // Uživatel přerušil / žádná řeč / jiná chyba
      const msg = String(e?.message || e || "");
      if (/no match|no speech|didn.?t understand/i.test(msg)) setError(t("voice.input.noSpeech"));
      else if (/denied|not allowed|permission/i.test(msg)) setError(t("voice.input.notAllowed"));
      setState("idle");
      try {
        const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
        await SpeechRecognition.removeAllListeners();
      } catch {}
    }
  }, [onResult, t, locale]);

  const startListening = useCallback(() => {
    // V nativní appce použij nativní rozpoznávání (WebView web API nemá).
    if (Capacitor.isNativePlatform()) {
      startNative();
      return;
    }

    setError(null);
    setTranscript("");

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(t("voice.input.noBrowser"));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = locale === "sk" ? "sk-SK" : "cs-CZ";
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
        setError(t("voice.input.noSpeech"));
      } else if (event.error === "not-allowed") {
        setError(t("voice.input.notAllowed"));
      } else {
        setError(t("voice.input.error"));
      }
      setState("idle");
    };

    recognition.onend = () => {
      if (state === "listening") setState("idle");
    };

    recognition.start();
  }, [onResult, state, t, locale]);

  const stopListening = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      import("@capacitor-community/speech-recognition")
        .then(({ SpeechRecognition }) => SpeechRecognition.stop())
        .catch(() => {});
      setState("idle");
      return;
    }
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
            <span>{t("voice.input.listening")}</span>
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
          <><Loader size={16} className="animate-spin" /> {t("voice.input.processing")}</>
        ) : (
          <><Mic size={16} /> {label ?? t("voice.input.dictate")}</>
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
        {t("voice.input.example")}
      </p>

      {/* Příručka: jak správně diktovat */}
      <button
        type="button"
        onClick={() => setShowGuide(v => !v)}
        className="w-full flex items-center justify-center gap-1.5 text-xs"
        style={{ color: "var(--green-dark)", padding: "2px 0" }}
      >
        <HelpCircle size={13} />
        <span>{t("voice.input.howTitle")}</span>
        <ChevronDown
          size={13}
          style={{ transform: showGuide ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        />
      </button>

      {showGuide && (
        <div
          className="text-xs rounded-xl"
          style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", padding: "12px 14px", color: "var(--text-secondary)", lineHeight: 1.55 }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--text-primary)" }}>
            {t("voice.guide.order")} <span style={{ color: "var(--green-dark)" }}>{t("voice.guide.orderHl")}</span>.
          </p>

          <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--text-primary)" }}>{t("voice.guide.bestTitle")}</p>
          <ul style={{ margin: "0 0 10px", paddingLeft: 16, listStyle: "disc" }}>
            <li>{t("voice.guide.best1")}</li>
            <li>{t("voice.guide.best2")}</li>
            <li>{t("voice.guide.best3")}</li>
            <li>{t("voice.guide.best4a")} <strong>„a"</strong> {t("voice.guide.best4b")}</li>
          </ul>

          <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--text-primary)" }}>{t("voice.guide.tipsTitle")}</p>
          <ul style={{ margin: 0, paddingLeft: 16, listStyle: "disc" }}>
            <li>{t("voice.guide.tip1a")} <em>{t("voice.guide.tip1b")}</em>{t("voice.guide.tip1c")}</li>
            <li>{t("voice.guide.tip2")}</li>
            <li>{t("voice.guide.tip3")}</li>
            <li>{t("voice.guide.tip4a")} <strong>{t("voice.guide.tip4b")}</strong> {t("voice.guide.tip4c")}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
