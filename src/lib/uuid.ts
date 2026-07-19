// Bezpečné generování ID napříč appkou. `crypto.randomUUID()` starší Android
// WebView (před Chromium 92) nepodporuje — na takovém zařízení by tiše
// selhal každý klik, co něco přidává (recept do košíku, produkt do spižírny...).
// Postupný fallback: randomUUID → getRandomValues (mnohem širší podpora) → Math.random.
export function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // verze 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // varianta
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  // Poslední záchrana bez crypto API vůbec — funkčně stačí, jen ne kryptograficky bezpečné.
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 11);
}
