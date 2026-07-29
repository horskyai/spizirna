"use client";

import { useState } from "react";
import { Lock, Delete } from "lucide-react";
import { useEmployeeStore } from "@/store/employeeStore";
import { useT } from "@/lib/i18n";

// Malá lišta/tlačítko pro majitele: v režimu zaměstnance klik → zadá PIN →
// odemkne plný přístup. Zobrazuje se nenápadně (např. v hlavičce kasy).
export function EmployeeUnlockButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        title={t("emp.zadejPin")}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <Lock size={14} /> {t("emp.odemknout")}
      </button>
      {open && <PinDialog onClose={() => setOpen(false)} />}
    </>
  );
}

// Modální numpad na zadání PINu. `onUnlocked` (volitelný) se zavolá navíc
// po úspěšném odemčení — použije se tam, kde má odemčení hned pokračovat
// další akcí (např. otevřít Nastavení, na které zaměstnanec sáhl).
export function PinDialog({ onClose, onUnlocked }: { onClose: () => void; onUnlocked?: () => void }) {
  const t = useT();
  const unlock = useEmployeeStore((s) => s.unlock);
  const [pin, setPin] = useState("");
  const [chyba, setChyba] = useState(false);

  const zkus = (next: string) => {
    setChyba(false);
    // Po 4+ číslicích a stisku „odemknout" se ověří; tady jen skládáme.
    setPin(next.slice(0, 6));
  };
  const odemkni = () => {
    if (unlock(pin)) { onClose(); onUnlocked?.(); }
    else { setChyba(true); setPin(""); }
  };

  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div className="relative rounded-t-3xl px-5 pt-5 pb-8 animate-slide-up"
        style={{ background: "var(--bg-primary)", paddingBottom: "max(28px, env(safe-area-inset-bottom, 28px))" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: "var(--green-dark)" }}>
            <Lock size={22} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{t("emp.zadejPin")}</p>
        </div>

        {/* Tečky PINu */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 6 }}>
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <span key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < pin.length ? "var(--green-primary)" : "var(--border)" }} />
          ))}
        </div>
        <p style={{ height: 18, textAlign: "center", fontSize: 12, color: "#C0392B", fontWeight: 600 }}>{chyba ? t("emp.spatnyPin") : ""}</p>

        {/* Numpad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxWidth: 280, margin: "0 auto 14px" }}>
          {KEYS.map((k, i) => k === "" ? <div key={i} /> : (
            <button key={i}
              onClick={() => k === "⌫" ? setPin((p) => p.slice(0, -1)) : zkus(pin + k)}
              style={{ padding: "16px 0", borderRadius: 14, fontSize: 22, fontWeight: 700, background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {k === "⌫" ? <Delete size={20} /> : k}
            </button>
          ))}
        </div>

        <button onClick={odemkni} disabled={pin.length < 4} className="btn-primary" style={{ opacity: pin.length >= 4 ? 1 : 0.5 }}>
          <Lock size={16} /> {t("emp.odemknout")}
        </button>
      </div>
    </div>
  );
}
