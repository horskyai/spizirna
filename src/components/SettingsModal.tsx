"use client";

import { useState, useMemo, useEffect } from "react";
import { X, User, LogOut, Crown, Info, Target, Bell, Trash2, ChevronRight, LifeBuoy, Shield, FileText, HelpCircle, Store, Award, Flame, Smartphone, Plus } from "lucide-react";
import { useAuthStore, type DeviceRow } from "@/store/authStore";
import { useModeStore } from "@/store/modeStore";
import { useBusinessStore } from "@/store/businessStore";
import { useFoodLogStore } from "@/store/foodLogStore";
import { useFeaturesStore } from "@/store/featuresStore";
import { useGamificationStore, type BadgeState } from "@/store/gamificationStore";
import { useT, useLocale } from "@/lib/i18n";
import { formatDateShort } from "@/lib/dateUtils";

// Kontaktní e-mail podpory (appkový Gmail).
const SUPPORT_EMAIL = "spizirnacz@gmail.com";

const APP_VERSION = "1.0.0";
const EXPIRY_NOTIF_KEY = "expiry-notifications";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const { profile, user, signOut, isTrialActive } = useAuthStore();
  const supportSubject = locale === "sk" ? "Špajza – podpora" : "Spižírna – podpora";
  const supportHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(supportSubject)}`;
  // Denní cíl má smysl jen v domácnosti — v provozovně se sekce skrývá.
  const mode = useModeStore((s) => s.mode);
  const goal = useFoodLogStore((s) => s.goal);
  const setGoal = useFoodLogStore((s) => s.setGoal);
  const calorieTracking = useFeaturesStore((s) => s.calorieTracking);
  const setCalorieTracking = useFeaturesStore((s) => s.setCalorieTracking);
  // Název provozovny — jen v provozním režimu.
  const businessName = useBusinessStore((s) => s.name);
  const setBusinessName = useBusinessStore((s) => s.setName);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    const err = await deleteAccount();
    if (err) { setDeleteError(err); setDeleting(false); }
    // při úspěchu appka sama přesměruje na "/" (localStorage.clear + replace)
  };

  // Odznaky — počítáme přes metodu storu, ale přepočet vážeme na surová čísla
  // (stejný vzor jako ProgressBadge), ať se getBadges() nevolá v reaktivním selektoru.
  const unlockedCount = useGamificationStore((s) => Object.keys(s.unlockedBadges).length);
  const totalCooked = useGamificationStore((s) => s.totalCooked);
  const totalScanned = useGamificationStore((s) => s.totalScanned);
  const totalSaved = useGamificationStore((s) => s.totalSaved);
  const streak = useGamificationStore((s) => s.streak);
  const badges = useMemo(
    () => useGamificationStore.getState().getBadges(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unlockedCount, totalCooked, totalScanned, totalSaved, streak],
  );
  const [notif, setNotif] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(EXPIRY_NOTIF_KEY) !== "off";
  });

  const toggleNotif = () => {
    const next = !notif;
    setNotif(next);
    localStorage.setItem(EXPIRY_NOTIF_KEY, next ? "on" : "off");
  };

  const resetAllData = () => {
    localStorage.clear();
    window.location.replace("/");
  };

  const updateGoal = (field: keyof typeof goal, value: string) => {
    setGoal({ ...goal, [field]: parseInt(value) || 0 });
  };

  // Plán odpovídá režimu: domácnost je zdarma, provoz je placený (299 Kč/měs).
  const planLabel = mode === "provoz"
    ? t("settings.planProvozPaid")
    : t("settings.planDomacnostFree");

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "—";
  const email = profile?.email || user?.email || "";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <div
        className="relative animate-slide-up"
        style={{
          background: "var(--bg-primary)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "90dvh",
          display: "flex",
          flexDirection: "column",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{t("settings.title")}</h2>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={15} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Účet ── */}
          <Section icon={<User size={15} />} title={t("settings.account")}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 2px 10px" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--green-dark)" }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{displayName}</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</p>
              </div>
            </div>

            {!confirmSignOut ? (
              <button
                onClick={() => setConfirmSignOut(true)}
                style={rowBtn("#FDE8E8", "#C0392B")}
              >
                <LogOut size={15} /> {t("settings.signOut")}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", margin: "4px 0" }}>{t("settings.signOutConfirm")}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setConfirmSignOut(false)} style={{ ...rowBtn("var(--bg-primary)", "var(--text-secondary)"), flex: 1, border: "1.5px solid var(--border)" }}>
                    {t("common.cancel")}
                  </button>
                  <button onClick={() => { signOut(); onClose(); }} style={{ ...rowBtn("#C0392B", "white"), flex: 1 }}>
                    {t("settings.signOut")}
                  </button>
                </div>
              </div>
            )}
          </Section>

          {/* ── Moje zařízení ── seznam + odebrat + přidat slot */}
          <Section icon={<Smartphone size={15} />} title={t("device.settingsTitle")}>
            <DevicesSection t={t} />
          </Section>

          {/* ── Plán ── tlačítka zatím ŠABLONA, bez napojení na platby */}
          <Section icon={<Crown size={15} />} title={t("settings.plan")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 2px 10px" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{planLabel}</span>
              {isTrialActive() && profile?.trial_ends_at && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green-dark)", background: "var(--green-light)", padding: "4px 10px", borderRadius: 99 }}>
                  {t("settings.trialEnds").replace("{date}", formatDateShort(profile.trial_ends_at))}
                </span>
              )}
            </div>
            {/* TODO: napojit na platby (Stripe / App Store / Google Play) */}
            <button onClick={() => { /* TODO: zmenit plan */ }} style={rowBtn("var(--green-light)", "var(--green-dark)")}>
              <Crown size={15} /> {t("settings.changePlan")}
            </button>
            {mode === "provoz" && (
              <button onClick={() => { /* TODO: zrusit predplatne */ }} style={{ ...rowBtn("transparent", "var(--text-secondary)"), marginTop: 8 }}>
                {t("settings.cancelPlan")}
              </button>
            )}
          </Section>

          {/* ── Sledování kalorií ── volitelná funkce, jen v domácnosti.
              Zapnutím se zobrazí tab "Jídlo", kalorie u produktů a denní cíl. */}
          {mode !== "provoz" && (
            <Section icon={<Flame size={15} />} title={t("settings.calorieTracking")}>
              <button
                onClick={() => setCalorieTracking(!calorieTracking)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "2px", background: "transparent" }}
              >
                <span style={{ fontSize: 13, color: "var(--text-primary)", textAlign: "left" }}>{t("settings.calorieTrackingLabel")}</span>
                <span style={{
                  width: 44, height: 26, borderRadius: 99, flexShrink: 0, position: "relative",
                  background: calorieTracking ? "var(--green-primary)" : "var(--border)", transition: "background 0.2s",
                }}>
                  <span style={{
                    position: "absolute", top: 3, left: calorieTracking ? 21 : 3, width: 20, height: 20, borderRadius: "50%",
                    background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </span>
              </button>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>{t("settings.calorieTrackingHint")}</p>
            </Section>
          )}

          {/* ── Denní cíl ── jen v domácnosti + když je sledování kalorií zapnuté */}
          {mode !== "provoz" && calorieTracking && (
          <Section icon={<Target size={15} />} title={t("settings.goal")}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {([
                { key: "calories_kcal" as const, label: t("settings.goalCalories"), unit: "kcal" },
                { key: "protein_g" as const, label: t("settings.goalProtein"), unit: "g" },
                { key: "carbs_g" as const, label: t("settings.goalCarbs"), unit: "g" },
                { key: "fat_g" as const, label: t("settings.goalFat"), unit: "g" },
              ]).map((f) => (
                <div key={f.key} style={{ background: "var(--bg-primary)", borderRadius: 12, padding: "8px 10px", border: "1.5px solid var(--border)" }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 2 }}>{f.label}</label>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <input
                      type="number"
                      value={goal[f.key]}
                      onChange={(e) => updateGoal(f.key, e.target.value)}
                      style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}
                    />
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
          )}

          {/* ── Název provozovny ── jen v provozu */}
          {mode === "provoz" && (
          <Section icon={<Store size={15} />} title={t("settings.businessName")}>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t("settings.businessNamePlaceholder")}
              style={{ width: "100%", background: "var(--bg-primary)", borderRadius: 12, padding: "12px 14px", border: "1.5px solid var(--border)", outline: "none", fontSize: 15, color: "var(--text-primary)" }}
            />
          </Section>
          )}

          {/* ── Notifikace ── */}
          <Section icon={<Bell size={15} />} title={t("settings.notifications")}>
            <button
              onClick={toggleNotif}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "2px", background: "transparent" }}
            >
              <span style={{ fontSize: 13, color: "var(--text-primary)", textAlign: "left" }}>{t("settings.expiryAlerts")}</span>
              <span style={{
                width: 44, height: 26, borderRadius: 99, flexShrink: 0, position: "relative",
                background: notif ? "var(--green-primary)" : "var(--border)", transition: "background 0.2s",
              }}>
                <span style={{
                  position: "absolute", top: 3, left: notif ? 21 : 3, width: 20, height: 20, borderRadius: "50%",
                  background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </span>
            </button>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>{t("settings.expiryAlertsHint")}</p>
          </Section>

          {/* ── Odznaky ── jen v domácnosti (gamifikace běží zatím tam) */}
          {mode !== "provoz" && (
            <Section icon={<Award size={15} />} title={t("game.badges.title")}>
              <BadgesSection badges={badges} t={t} />
            </Section>
          )}

          {/* ── Správa dat ── */}
          <Section icon={<Trash2 size={15} />} title={t("settings.data")}>
            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)} style={rowBtn("#FDE8E8", "#C0392B")}>
                <Trash2 size={15} /> {t("settings.resetData")}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", margin: "4px 0", lineHeight: 1.4 }}>{t("settings.resetDataConfirm")}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setConfirmReset(false)} style={{ ...rowBtn("var(--bg-primary)", "var(--text-secondary)"), flex: 1, border: "1.5px solid var(--border)" }}>
                    {t("common.cancel")}
                  </button>
                  <button onClick={resetAllData} style={{ ...rowBtn("#C0392B", "white"), flex: 1 }}>
                    {t("settings.resetData")}
                  </button>
                </div>
              </div>
            )}
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>{t("settings.dataHint")}</p>
          </Section>

          {/* ── Smazat účet ── nevratné, GDPR. Volá Edge Function delete-account. */}
          <Section icon={<Trash2 size={15} />} title={t("settings.deleteAccount")}>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={rowBtn("#FDE8E8", "#C0392B")}>
                <Trash2 size={15} /> {t("settings.deleteAccount")}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 13, color: "#C0392B", textAlign: "center", margin: "4px 0", lineHeight: 1.4, fontWeight: 600 }}>{t("settings.deleteAccountConfirm")}</p>
                {deleteError && (
                  <p style={{ fontSize: 12, color: "#C0392B", textAlign: "center", margin: 0 }}>{deleteError}</p>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setConfirmDelete(false); setDeleteError(null); }} disabled={deleting} style={{ ...rowBtn("var(--bg-primary)", "var(--text-secondary)"), flex: 1, border: "1.5px solid var(--border)" }}>
                    {t("common.cancel")}
                  </button>
                  <button onClick={handleDeleteAccount} disabled={deleting} style={{ ...rowBtn("#C0392B", "white"), flex: 1, opacity: deleting ? 0.6 : 1 }}>
                    {deleting ? t("settings.deleteAccountBusy") : t("settings.deleteAccountConfirmBtn")}
                  </button>
                </div>
              </div>
            )}
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>{t("settings.deleteAccountHint")}</p>
          </Section>

          {/* ── Odkazy ── Soukromí a Podmínky vedou na stránky v projektu.
              Podpora zatím bez URL (doplnit kontaktní e-mail/stránku). */}
          <Section icon={<LifeBuoy size={15} />} title={t("settings.links")}>
            <LinkRow icon={<HelpCircle size={16} />} label={t("settings.faq")} href="/faq" />
            <LinkRow icon={<LifeBuoy size={16} />} label={t("settings.support")} href={supportHref} />
            <LinkRow icon={<Shield size={16} />} label={t("settings.privacy")} href="/soukromi" />
            <LinkRow icon={<FileText size={16} />} label={t("settings.terms")} href="/podminky" last />
          </Section>

          {/* ── O aplikaci ── */}
          <Section icon={<Info size={15} />} title={t("settings.about")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("settings.version")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{APP_VERSION}</span>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", borderRadius: 16, padding: "12px 14px", border: "1.5px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <span style={{ color: "var(--green-primary)" }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// Řádek odkazu. S `href` otevře cíl (interní stránku v nové záložce),
// bez něj zůstává neaktivní (zatím bez URL — např. podpora).
function LinkRow({ icon, label, href, last }: { icon: React.ReactNode; label: string; href?: string; last?: boolean }) {
  const style: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 2px",
    background: "transparent", textAlign: "left", textDecoration: "none",
    borderBottom: last ? "none" : "1px solid var(--border)",
  };
  const inner = (
    <>
      <span style={{ color: "var(--text-secondary)", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 14, color: "var(--text-primary)" }}>{label}</span>
      <ChevronRight size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
    </>
  );
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{inner}</a>;
  }
  return <button style={style}>{inner}</button>;
}

// Mřížka odznaků: získané barevně + datum, nezískané zašedlé + progress n/goal.
// Získané řadíme nahoru a podle data získání (nejnovější první).
function BadgesSection({ badges, t }: { badges: BadgeState[]; t: ReturnType<typeof useT> }) {
  const unlocked = badges.filter((b) => b.unlocked);
  const sorted = [...badges].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.unlocked && b.unlocked) return (b.unlockedAt || "").localeCompare(a.unlockedAt || "");
    // nezískané: nejblíž ke splnění první
    return (b.current / b.goal) - (a.current / a.goal);
  });

  return (
    <>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 2px 10px" }}>
        {t("game.badges.progress" as Parameters<typeof t>[0]).replace("{n}", String(unlocked.length)).replace("{total}", String(badges.length))}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {sorted.map((b) => {
          const name = t(`game.badge.${b.id}.name` as Parameters<typeof t>[0]);
          const sub = b.unlocked
            ? (b.unlockedAt ? t("game.badges.unlockedOn" as Parameters<typeof t>[0]).replace("{date}", formatDateShort(b.unlockedAt)) : "")
            : t("game.badges.locked" as Parameters<typeof t>[0]).replace("{n}", String(b.current)).replace("{goal}", String(b.goal));
          return (
            <div
              key={b.id}
              title={`${name} · ${t(`game.badge.${b.id}.desc` as Parameters<typeof t>[0])}`}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                gap: 3, padding: "10px 4px", borderRadius: 12,
                background: b.unlocked ? "var(--green-light)" : "var(--bg-primary)",
                border: `1.5px solid ${b.unlocked ? "var(--green-primary)" : "var(--border)"}`,
                opacity: b.unlocked ? 1 : 0.55,
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1, filter: b.unlocked ? "none" : "grayscale(1)" }}>{b.emoji}</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, lineHeight: 1.15, color: b.unlocked ? "var(--green-dark)" : "var(--text-secondary)", overflowWrap: "anywhere" }}>{name}</span>
              <span style={{ fontSize: 8.5, color: "var(--text-tertiary)", lineHeight: 1.1 }}>{sub}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// Seznam přihlášených zařízení účtu + odebrání + přidání slotu (testovací).
function DevicesSection({ t }: { t: ReturnType<typeof useT> }) {
  const { listDevices, removeDevice, addDeviceSlot, currentDeviceId } = useAuthStore();
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [busy, setBusy] = useState(false);
  const thisId = currentDeviceId();

  const reload = async () => setDevices(await listDevices());
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleRemove = async (rowId: string) => {
    setBusy(true);
    await removeDevice(rowId);
    await reload();
    setBusy(false);
  };
  const handleAddSlot = async () => {
    setBusy(true);
    await addDeviceSlot();
    await reload();
    setBusy(false);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
        {devices.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "2px" }}>{t("device.yourDevices")}…</p>
        )}
        {devices.map((d) => {
          const isThis = d.device_id === thisId;
          return (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 2px", borderBottom: "1px solid var(--border)" }}>
              <Smartphone size={16} style={{ color: isThis ? "var(--green-primary)" : "var(--text-tertiary)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflowWrap: "anywhere" }}>
                  {d.device_name || t("device.unknownDevice")}{isThis ? ` · ${t("device.thisDevice")}` : ""}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "1px 0 0" }}>
                  {t("device.lastSeen").replace("{date}", formatDateShort(d.last_seen_at))}
                </p>
              </div>
              {!isThis && (
                <button onClick={() => handleRemove(d.id)} disabled={busy}
                  style={{ flexShrink: 0, color: "#C0392B", background: "transparent", border: "none", padding: 4, opacity: busy ? 0.5 : 1 }}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={handleAddSlot} disabled={busy} style={{ ...rowBtn("var(--green-light)", "var(--green-dark)"), opacity: busy ? 0.5 : 1 }}>
        <Plus size={15} /> {t("device.addSlot")}
      </button>
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>{t("device.addSlotHint")}</p>
    </>
  );
}

function rowBtn(bg: string, color: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    width: "100%", padding: "11px", borderRadius: 12, fontSize: 14, fontWeight: 700,
    background: bg, color,
  };
}
