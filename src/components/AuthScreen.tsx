"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { ChefHat, Mail, Lock, User } from "lucide-react";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signIn, signUp } = useAuthStore();

  const submit = async () => {
    setError(null);
    setLoading(true);
    let err: string | null = null;
    if (mode === "login") {
      err = await signIn(email, password);
    } else {
      if (!name.trim()) { setError("Zadejte jméno"); setLoading(false); return; }
      err = await signUp(email, password, name);
      if (!err) { setSuccess(true); setLoading(false); return; }
    }
    if (err) setError(err);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center" style={{ background: "var(--bg-primary)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "var(--green-light)" }}>
          <ChefHat size={36} style={{ color: "var(--green-primary)" }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Zkontrolujte email</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Poslali jsme vám potvrzovací odkaz na <b>{email}</b>.<br />
          Po potvrzení se přihlaste.
        </p>
        <button onClick={() => { setSuccess(false); setMode("login"); }} className="btn-primary" style={{ width: "auto", paddingLeft: 32, paddingRight: 32 }}>
          Přihlásit se
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh px-5 justify-center" style={{ background: "var(--bg-primary)", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)", boxShadow: "0 6px 20px rgba(76,175,130,0.4)" }}>
          <ChefHat size={28} color="white" />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Spižírna</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Chytrá správa potravin</p>
      </div>

      {/* Toggle */}
      <div className="flex rounded-2xl p-1 mb-4" style={{ background: "white", border: "1.5px solid var(--border)" }}>
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: mode === m ? "var(--green-primary)" : "transparent",
              color: mode === m ? "white" : "var(--text-secondary)",
            }}
          >
            {m === "login" ? "Přihlásit se" : "Registrace"}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-2.5">
        {mode === "signup" && (
          <div style={{ position: "relative" }}>
            <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jméno"
              style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 16, fontSize: 15, outline: "none", background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>
        )}
        <div style={{ position: "relative" }}>
          <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 16, fontSize: 15, outline: "none", background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Heslo"
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 16, fontSize: 15, outline: "none", background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {error && (
          <p className="text-sm px-1" style={{ color: "#C0392B" }}>{error}</p>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="btn-primary"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Načítám..." : mode === "login" ? "Přihlásit se" : "Vytvořit účet"}
        </button>

        {mode === "signup" && (
          <p className="text-xs text-center px-4" style={{ color: "var(--text-tertiary)" }}>
            Po registraci máte <b>14 dní zdarma</b>.<br />
            Základní plán 99 Kč/měsíc, Rodinný 149 Kč/měsíc.
          </p>
        )}
      </div>
    </div>
  );
}
