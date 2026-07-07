"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { getCurrentMode } from "@/store/modeStore";
import { useT } from "@/lib/i18n";
import { ChefHat, Mail, Lock, User } from "lucide-react";

export function AuthScreen() {
  const t = useT();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // "auth" = login/registrace, "reset" = zadání e-mailu, "resetSent" = potvrzení
  const [view, setView] = useState<"auth" | "reset" | "resetSent">("auth");
  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuthStore();

  // Přihlášení přes Google — přesměruje na Google a zpět (session zachytí init).
  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const err = await signInWithGoogle();
    if (err) { setError(err); setLoading(false); }
    // při úspěchu appka přesměruje na Google, loading necháváme (odejdeme ze stránky)
  };

  // Přeloží nejčastější anglické chyby ze Supabase do zvoleného jazyka.
  const translateError = (msg: string): string => {
    const m = msg.toLowerCase();
    if (m.includes("invalid login") || m.includes("invalid credentials")) return t("auth.errInvalidLogin");
    if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already")) return t("auth.errEmailTaken");
    if (m.includes("password") && (m.includes("6") || m.includes("8") || m.includes("characters"))) return t("auth.errPassword");
    if (m.includes("valid email") || m.includes("invalid email")) return t("auth.errEmail");
    return msg; // neznámou chybu necháme tak, jak přišla
  };

  const submit = async () => {
    setError(null);

    // Validace na straně appky — hezká hláška ještě před voláním Supabase
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(t("auth.errEmail")); return; }
    if (mode === "signup" && !name.trim()) { setError(t("auth.errEnterName")); return; }
    if (password.length < 8) { setError(t("auth.errPassword")); return; }

    setLoading(true);
    let err: string | null = null;
    if (mode === "login") {
      err = await signIn(email, password);
    } else {
      // Režim zvolený v onboardingu se uloží k účtu (jeden e-mail = jeden režim)
      const res = await signUp(email, password, name, getCurrentMode());
      err = res.error;
      // Obrazovku „zkontrolujte e-mail" ukážeme jen když Supabase vyžaduje
      // potvrzení. Pokud je potvrzování vypnuté, uživatel je rovnou přihlášen.
      if (!err && res.needsConfirmation) { setSuccess(true); setLoading(false); return; }
    }
    if (err) setError(translateError(err));
    setLoading(false);
  };

  const submitReset = async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(t("auth.errEmail")); return; }
    setLoading(true);
    const err = await resetPassword(email);
    setLoading(false);
    // Pro bezpečnost potvrzení ukážeme i tak (neprozrazujeme, zda účet existuje).
    if (err) { setError(translateError(err)); return; }
    setView("resetSent");
  };

  // Obrazovka: zadání e-mailu pro obnovu hesla
  if (view === "reset") {
    return (
      <div className="flex flex-col min-h-dvh px-5 justify-center" style={{ background: "var(--bg-primary)", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)", boxShadow: "0 6px 20px rgba(76,175,130,0.4)" }}>
            <Lock size={26} color="white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{t("auth.resetTitle")}</h1>
          <p className="text-xs mt-1 text-center px-6" style={{ color: "var(--text-secondary)" }}>{t("auth.resetHint")}</p>
        </div>
        <div className="space-y-2.5">
          <div style={{ position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              onKeyDown={e => e.key === "Enter" && submitReset()}
              style={{ width: "100%", paddingLeft: 42, paddingRight: 16, paddingTop: 15, paddingBottom: 15, borderRadius: 16, fontSize: 15, outline: "none", background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          {error && <p className="text-sm px-1" style={{ color: "#C0392B" }}>{error}</p>}
          <button onClick={submitReset} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? t("auth.loading") : t("auth.resetSend")}
          </button>
          <button onClick={() => { setView("auth"); setError(null); }} className="text-sm w-full text-center py-1" style={{ color: "var(--text-secondary)" }}>
            {t("auth.resetBack")}
          </button>
        </div>
      </div>
    );
  }

  // Obrazovka: potvrzení odeslání resetu
  if (view === "resetSent") {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center" style={{ background: "var(--bg-primary)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "var(--green-light)" }}>
          <Mail size={36} style={{ color: "var(--green-primary)" }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{t("auth.resetSentTitle")}</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          {t("auth.resetSent")} <b>{email}</b> {t("auth.resetSentTail")}
        </p>
        <button onClick={() => { setView("auth"); setMode("login"); setError(null); }} className="btn-primary" style={{ width: "auto", paddingLeft: 32, paddingRight: 32 }}>
          {t("auth.resetBack")}
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center" style={{ background: "var(--bg-primary)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "var(--green-light)" }}>
          <ChefHat size={36} style={{ color: "var(--green-primary)" }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{t("auth.checkEmail")}</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          {t("auth.confirmSent")} <b>{email}</b>.<br />
          {t("auth.confirmThenLogin")}
        </p>
        <button onClick={() => { setSuccess(false); setMode("login"); }} className="btn-primary" style={{ width: "auto", paddingLeft: 32, paddingRight: 32 }}>
          {t("auth.login")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: "var(--bg-primary)" }}>
      {/* ── Horní uvítací část — gradientní hero s logem ── */}
      <div
        className="flex flex-col items-center justify-center text-center px-6"
        style={{
          paddingTop: "calc(56px + env(safe-area-inset-top, 0px))",
          paddingBottom: 48,
          background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
          borderRadius: "0 0 32px 32px",
          boxShadow: "0 8px 32px rgba(46,125,90,0.35)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt={t("auth.appName")}
          width={80}
          height={80}
          className="rounded-2xl mb-4"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
        />
        <h1 className="text-2xl font-bold" style={{ color: "white", letterSpacing: "0.02em" }}>{t("auth.appName")}</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.85)" }}>{t("auth.tagline")}</p>

        {/* Tři rychlé výhody — ať hero není prázdné */}
        <div className="flex items-center justify-center gap-5 mt-6">
          {[
            { emoji: "📷", key: "auth.benefitScan" },
            { emoji: "🍳", key: "auth.benefitRecipes" },
            { emoji: "🔔", key: "auth.benefitExpiry" },
          ].map((b) => (
            <div key={b.key} className="flex flex-col items-center gap-1.5" style={{ width: 72 }}>
              <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(255,255,255,0.18)", fontSize: 20 }}>
                {b.emoji}
              </div>
              <span className="text-xs font-medium leading-tight" style={{ color: "rgba(255,255,255,0.9)" }}>{t(b.key)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Formulářová karta — pluje přes okraj hera ── */}
      <div className="flex-1 px-5" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="card animate-slide-up" style={{ padding: 20, marginTop: -24 }}>

      {/* Toggle */}
      <div className="flex rounded-2xl p-1 mb-5" style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)" }}>
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
            {m === "login" ? t("auth.login") : t("auth.signup")}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {mode === "signup" && (
          <div style={{ position: "relative" }}>
            <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t("auth.namePlaceholder")}
              style={{ width: "100%", paddingLeft: 42, paddingRight: 16, paddingTop: 15, paddingBottom: 15, borderRadius: 16, fontSize: 15, outline: "none", background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>
        )}
        <div style={{ position: "relative" }}>
          <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            style={{ width: "100%", paddingLeft: 42, paddingRight: 16, paddingTop: 15, paddingBottom: 15, borderRadius: 16, fontSize: 15, outline: "none", background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t("auth.passwordPlaceholder")}
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{ width: "100%", paddingLeft: 42, paddingRight: 16, paddingTop: 15, paddingBottom: 15, borderRadius: 16, fontSize: 15, outline: "none", background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {mode === "signup" && !error && (
          <p className="text-xs px-1" style={{ color: "var(--text-tertiary)" }}>{t("auth.passwordHint")}</p>
        )}

        {error && (
          <p className="text-sm px-1" style={{ color: "#C0392B" }}>{error}</p>
        )}

        {mode === "login" && (
          <button
            onClick={() => { setView("reset"); setError(null); }}
            className="text-xs w-full text-right px-1"
            style={{ color: "var(--green-primary)", fontWeight: 600 }}
          >
            {t("auth.forgotPassword")}
          </button>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="btn-primary"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? t("auth.loading") : mode === "login" ? t("auth.login") : t("auth.createAccount")}
        </button>

        {/* Oddělovač */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{t("auth.or")}</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Přihlášení přes Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: "14px 0", borderRadius: 16, fontSize: 15, fontWeight: 700, background: "white", color: "#3c4043", border: "1.5px solid var(--border)", opacity: loading ? 0.7 : 1 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          {t("auth.google")}
        </button>

        {mode === "signup" && (
          <p className="text-xs text-center px-4" style={{ color: "var(--text-tertiary)" }}>
            {t("auth.trialNote")} <b>{t("auth.trialDays")}</b>.<br />
            {t("auth.planNote")}
          </p>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
