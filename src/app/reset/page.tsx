"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import { Lock, Check } from "lucide-react";

// Stránka, na kterou přistane uživatel po kliknutí na odkaz z resetovacího e-mailu.
// Supabase z URL hash vytvoří dočasnou session (událost PASSWORD_RECOVERY),
// pak tu uživatel zadá nové heslo.
export default function ResetPasswordPage() {
  const t = useT();
  const { updatePassword } = useAuthStore();
  const [ready, setReady] = useState(false);     // máme platnou recovery session?
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    // Když už session je (token zpracovaný), jsme připraveni.
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const submit = async () => {
    setError(null);
    if (pw1.length < 8) { setError(t("auth.errPassword")); return; }
    if (pw1 !== pw2) { setError(t("auth.errPasswordMatch")); return; }
    setLoading(true);
    const err = await updatePassword(pw1);
    setLoading(false);
    if (err) { setError(err); return; }
    setDone(true);
  };

  const goToApp = () => { window.location.href = "/"; };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center" style={{ background: "var(--bg-primary)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "var(--green-light)" }}>
          <Check size={36} style={{ color: "var(--green-primary)" }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{t("auth.newPasswordDone")}</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{t("auth.newPasswordDoneHint")}</p>
        <button onClick={goToApp} className="btn-primary" style={{ width: "auto", paddingLeft: 32, paddingRight: 32 }}>
          {t("auth.goToApp")}
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center" style={{ background: "var(--bg-primary)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("auth.resetLinkInvalid")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh px-5 justify-center" style={{ background: "var(--bg-primary)", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)", boxShadow: "0 6px 20px rgba(76,175,130,0.4)" }}>
          <Lock size={26} color="white" />
        </div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{t("auth.newPasswordTitle")}</h1>
        <p className="text-xs mt-1 text-center px-6" style={{ color: "var(--text-secondary)" }}>{t("auth.newPasswordHint")}</p>
      </div>
      <div className="space-y-2.5">
        <div style={{ position: "relative" }}>
          <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
          <input
            type="password"
            value={pw1}
            onChange={e => setPw1(e.target.value)}
            placeholder={t("auth.newPasswordPlaceholder")}
            style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 16, fontSize: 15, outline: "none", background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
          <input
            type="password"
            value={pw2}
            onChange={e => setPw2(e.target.value)}
            placeholder={t("auth.newPasswordConfirm")}
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 16, fontSize: 15, outline: "none", background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        {!error && <p className="text-xs px-1" style={{ color: "var(--text-tertiary)" }}>{t("auth.passwordHint")}</p>}
        {error && <p className="text-sm px-1" style={{ color: "#C0392B" }}>{error}</p>}
        <button onClick={submit} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? t("auth.loading") : t("auth.newPasswordSave")}
        </button>
      </div>
    </div>
  );
}
