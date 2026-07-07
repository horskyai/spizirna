"use client";

import { useState } from "react";
import { Store, UtensilsCrossed, Check } from "lucide-react";
import { useBusinessStore, TypProvozu } from "@/store/businessStore";
import { useLocale } from "@/lib/i18n";

type L10n = { cs: string; sk: string };

interface TypCard {
  id: TypProvozu;
  icon: React.ReactNode;
  title: L10n;
  desc: L10n;
  body: L10n[];
}

const CARDS: TypCard[] = [
  {
    id: "restaurace",
    icon: <UtensilsCrossed size={30} />,
    title: { cs: "Restaurace / jídelna", sk: "Reštaurácia / jedáleň" },
    desc: { cs: "Vaříte a prodáváte jídla", sk: "Varíte a predávate jedlá" },
    body: [
      { cs: "Menu jídel s denními porcemi (ráno navaříš, kasa hlídá kolik zbývá)", sk: "Menu jedál s dennými porciami (ráno navaríš, pokladňa stráži koľko zostáva)" },
      { cs: "Prodáváš i nápoje a kusové zboží", sk: "Predávaš aj nápoje a kusový tovar" },
      { cs: "Recepty a sklad surovin", sk: "Recepty a sklad surovín" },
    ],
  },
  {
    id: "obchod",
    icon: <Store size={30} />,
    title: { cs: "Obchod s potravinami", sk: "Obchod s potravinami" },
    desc: { cs: "Prodáváte kusové zboží", sk: "Predávate kusový tovar" },
    body: [
      { cs: "Naskladníš zboží → objeví se v kase k prodeji", sk: "Naskladníš tovar → objaví sa v pokladni na predaj" },
      { cs: "Prodej odečítá kusy ze skladu (Pepsi 525 → 524)", sk: "Predaj odčíta kusy zo skladu (Pepsi 525 → 524)" },
      { cs: "Jednoduché — bez receptů a porcí", sk: "Jednoduché — bez receptov a porcií" },
    ],
  },
];

// Výběr typu provozu (obchod / restaurace) — jednou při prvním vstupu do provozu.
export function BusinessTypeSelect({ onDone }: { onDone: () => void }) {
  const locale = useLocale();
  const l = (t: L10n) => (locale === "sk" ? t.sk : t.cs);
  const setTypProvozu = useBusinessStore((s) => s.setTypProvozu);
  const [vybrano, setVybrano] = useState<TypProvozu | null>(null);

  const potvrdit = () => {
    if (!vybrano) return;
    setTypProvozu(vybrano);
    onDone();
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)", display: "flex", flexDirection: "column", padding: "max(32px, env(safe-area-inset-top, 32px)) 20px 24px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            {locale === "sk" ? "Aký máte prevádzku?" : "Jaký máte provoz?"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {locale === "sk"
              ? "Podľa toho prispôsobíme aplikáciu. Vyberáte len raz."
              : "Podle toho přizpůsobíme aplikaci. Vybíráte jen jednou."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          {CARDS.map((c) => {
            const active = vybrano === c.id;
            return (
              <button key={c.id} onClick={() => setVybrano(c.id)}
                style={{
                  textAlign: "left", padding: "18px 18px", borderRadius: 20,
                  background: active ? "var(--green-light)" : "white",
                  border: `2px solid ${active ? "var(--green-primary)" : "var(--border)"}`,
                  boxShadow: active ? "0 4px 16px rgba(76,175,130,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
                  transition: "all 0.15s ease", position: "relative",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "var(--green-primary)" : "var(--green-light)", color: active ? "white" : "var(--green-dark)" }}>
                    {c.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>{l(c.title)}</p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{l(c.desc)}</p>
                  </div>
                  {active && (
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--green-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={16} color="white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                  {c.body.map((b, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      <span style={{ color: "var(--green-primary)", flexShrink: 0 }}>•</span>
                      <span>{l(b)}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <button onClick={potvrdit} disabled={!vybrano} className="btn-primary" style={{ marginTop: 20, opacity: vybrano ? 1 : 0.5 }}>
          <Check size={16} /> {locale === "sk" ? "Pokračovať" : "Pokračovat"}
        </button>
      </div>
    </div>
  );
}
