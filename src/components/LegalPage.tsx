"use client";

import { ArrowLeft } from "lucide-react";

// Sdílený vzhled právních stránek (soukromí, podmínky). Statický text uvnitř.
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "max(20px, env(safe-area-inset-top, 20px)) 20px 64px" }}>
        <a
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "var(--green-dark)", textDecoration: "none", marginBottom: 20 }}
        >
          <ArrowLeft size={16} /> Spižírna
        </a>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 6 }}>{updated}</p>

        <div className="legal-body" style={{ marginTop: 20, color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.65 }}>
          {children}
        </div>
      </div>

      <style>{`
        .legal-body h2 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 24px 0 8px; }
        .legal-body p { margin: 0 0 12px; }
        .legal-body ul { margin: 0 0 12px; padding-left: 20px; }
        .legal-body li { margin-bottom: 6px; }
        .legal-body b { color: var(--text-primary); }
      `}</style>
    </div>
  );
}
