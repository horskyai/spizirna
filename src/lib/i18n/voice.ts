import type { Translation } from "./dict";

// Překlady pro hlasové zadávání: VoiceInput (příručka) a VoiceReviewModal.
export const voice: Record<string, Translation> = {
  // ── VoiceReviewModal ──
  "voice.review.title": { cs: "Zkontroluj položky", sk: "Skontroluj položky" },
  "voice.review.subtitle": { cs: "uprav a potvrď", sk: "uprav a potvrď" },
  "voice.review.namePlaceholder": { cs: "Název produktu", sk: "Názov produktu" },
  "voice.review.allRemoved": { cs: "Všechny položky byly odebrány", sk: "Všetky položky boli odobraté" },
  "voice.review.gallery": { cs: "Galerie", sk: "Galéria" },
  "voice.review.photo": { cs: "Fotit", sk: "Fotiť" },
  "voice.review.addToPantry": { cs: "Přidat {label} do spižírny", sk: "Pridať {label} do špajze" },

  // pluralizace počtu položek (1 / 2–4 / 5+)
  "voice.count.one": { cs: "položka", sk: "položka" },
  "voice.count.few": { cs: "položky", sk: "položky" },
  "voice.count.many": { cs: "položek", sk: "položiek" },
  // tvar po číslovce v akuzativu ("Přidat 1 položku / 3 položky / 5 položek")
  "voice.countAcc.one": { cs: "položku", sk: "položku" },
  "voice.countAcc.few": { cs: "položky", sk: "položky" },
  "voice.countAcc.many": { cs: "položek", sk: "položiek" },

  // kategorie (zobrazované štítky — kanonická hodnota zůstává česká kvůli logice)
  "voice.cat.Maso": { cs: "Maso", sk: "Mäso" },
  "voice.cat.Ryby": { cs: "Ryby", sk: "Ryby" },
  "voice.cat.Mléčné výrobky": { cs: "Mléčné výrobky", sk: "Mliečne výrobky" },
  "voice.cat.Zelenina": { cs: "Zelenina", sk: "Zelenina" },
  "voice.cat.Ovoce": { cs: "Ovoce", sk: "Ovocie" },
  "voice.cat.Pekárenské výrobky": { cs: "Pekárenské výrobky", sk: "Pekárenské výrobky" },
  "voice.cat.Luštěniny": { cs: "Luštěniny", sk: "Strukoviny" },
  "voice.cat.Obiloviny": { cs: "Obiloviny", sk: "Obilniny" },
  "voice.cat.Nápoje": { cs: "Nápoje", sk: "Nápoje" },
  "voice.cat.Omáčky a koření": { cs: "Omáčky a koření", sk: "Omáčky a korenie" },
  "voice.cat.Sladkosti": { cs: "Sladkosti", sk: "Sladkosti" },
  "voice.cat.Mražené": { cs: "Mražené", sk: "Mrazené" },
  "voice.cat.Konzervy": { cs: "Konzervy", sk: "Konzervy" },
  "voice.cat.Jiné": { cs: "Jiné", sk: "Iné" },

  // ── VoiceInput (tlačítko + příručka) ──
  "voice.input.dictate": { cs: "Nadiktovat", sk: "Nadiktovať" },
  "voice.input.listening": { cs: "Poslouchám... (klepni pro stop)", sk: "Počúvam... (ťukni pre stop)" },
  "voice.input.processing": { cs: "Zpracovávám...", sk: "Spracúvam..." },
  "voice.input.noBrowser": {
    cs: "Váš prohlížeč nepodporuje hlasové zadávání. Zkuste Chrome nebo Safari.",
    sk: "Váš prehliadač nepodporuje hlasové zadávanie. Skúste Chrome alebo Safari.",
  },
  "voice.input.noSpeech": { cs: "Nic jste neřekl. Zkuste znovu.", sk: "Nič ste nepovedali. Skúste znova." },
  "voice.input.notAllowed": { cs: "Přístup k mikrofonu byl odmítnut.", sk: "Prístup k mikrofónu bol odmietnutý." },
  "voice.input.error": { cs: "Chyba rozpoznávání. Zkuste znovu.", sk: "Chyba rozpoznávania. Skúste znova." },
  "voice.input.example": {
    cs: "Např. „2 kuřecí prsa, 300 gramů špaget, jeden litr mléka\"",
    sk: "Napr. „2 kuracie prsia, 300 gramov špagiet, jeden liter mlieka\"",
  },
  "voice.input.howTitle": { cs: "Jak správně diktovat?", sk: "Ako správne diktovať?" },
  "voice.guide.order": {
    cs: "Diktuj jednu položku za druhou v pořadí:",
    sk: "Diktuj jednu položku za druhou v poradí:",
  },
  "voice.guide.orderHl": { cs: "množství → jednotka → název", sk: "množstvo → jednotka → názov" },
  "voice.guide.bestTitle": { cs: "✅ Funguje nejlépe", sk: "✅ Funguje najlepšie" },
  "voice.guide.best1": { cs: "„dvě stě gramů kuřecích prsou\"", sk: "„dvesto gramov kuracích pŕs\"" },
  "voice.guide.best2": { cs: "„jedno kilo brambor a tři cibule\"", sk: "„jedno kilo zemiakov a tri cibule\"" },
  "voice.guide.best3": { cs: "„půl litru mléka, sto gramů sýra eidam\"", sk: "„pol litra mlieka, sto gramov syra eidam\"" },
  "voice.guide.best4a": { cs: "Jednotlivé položky odděluj slovem", sk: "Jednotlivé položky oddeľuj slovom" },
  "voice.guide.best4b": { cs: "nebo krátkou pauzou.", sk: "alebo krátkou pauzou." },
  "voice.guide.tipsTitle": { cs: "💡 Tipy", sk: "💡 Tipy" },
  "voice.guide.tip1a": { cs: "Jednotku řekni nahlas:", sk: "Jednotku povedz nahlas:" },
  "voice.guide.tip1b": { cs: "gramů, kilo, litr, kusy, balení", sk: "gramov, kilo, liter, kusy, balenie" },
  "voice.guide.tip1c": { cs: ". Bez ní se počítá na kusy.", sk: ". Bez nej sa počíta na kusy." },
  "voice.guide.tip2": {
    cs: "Čísla můžeš říct slovy i jako číslici („dvě stě\" = 200).",
    sk: "Čísla môžeš povedať slovami aj ako číslicu („dvesto\" = 200).",
  },
  "voice.guide.tip3": {
    cs: "Klidně skloňuj („dvě kuřecí prsa\", „rohlíků\") — app to převede do základního tvaru.",
    sk: "Pokojne skloňuj („dve kuracie prsia\", „rožkov\") — app to prevedie do základného tvaru.",
  },
  "voice.guide.tip4a": { cs: "Po nadiktování ještě", sk: "Po nadiktovaní ešte" },
  "voice.guide.tip4b": { cs: "zkontroluj a uprav", sk: "skontroluj a uprav" },
  "voice.guide.tip4c": {
    cs: "položky v dalším kroku — název, množství i kategorii.",
    sk: "položky v ďalšom kroku — názov, množstvo aj kategóriu.",
  },
};
