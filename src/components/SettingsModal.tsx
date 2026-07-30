"use client";

import { useState, useMemo, useEffect } from "react";
import { X, User, LogOut, Crown, Info, Target, Bell, Trash2, ChevronRight, LifeBuoy, Shield, FileText, HelpCircle, Store, Award, Flame, Smartphone, Plus, Download, BarChart3, Lock, Users, Copy, Check, Sparkles, Wrench, Languages } from "lucide-react";
import { useNotifPrefsStore, NOTIF_META, NotifType } from "@/store/notifPrefsStore";
import { exportHouseholdJSON, exportPantryCSV } from "@/lib/exportData";
import { StatsModal } from "@/components/StatsModal";
import { PricesModal } from "@/components/PricesView";
import { useAuthStore, type DeviceRow } from "@/store/authStore";
import { useModeStore } from "@/store/modeStore";
import { useBusinessStore } from "@/store/businessStore";
import { useEmployeeStore } from "@/store/employeeStore";
import { useFoodLogStore } from "@/store/foodLogStore";
import { useFeaturesStore } from "@/store/featuresStore";
import { useGamificationStore, type BadgeState } from "@/store/gamificationStore";
import { useT, useLocale } from "@/lib/i18n";
import { useLocaleStore } from "@/store/localeStore";
import { formatDateShort } from "@/lib/dateUtils";
import { scheduleDailyNudges, cancelDailyNudges } from "@/lib/notifications";
import { usePantryStore } from "@/store/pantryStore";
import { useShoppingStore } from "@/store/shoppingStore";
import { useFamilyStore } from "@/store/familyStore";
import { syncNow, startRealtime, stopRealtime } from "@/lib/familySync";
import { useProvozShareStore } from "@/store/provozShareStore";
import { provozSyncNow, provozStartRealtime, provozStopRealtime } from "@/lib/provozSync";

// Kontaktní e-mail podpory (appkový Gmail).
const SUPPORT_EMAIL = "spizirnacz@gmail.com";

const APP_VERSION = "1.0.0";
const EXPIRY_NOTIF_KEY = "expiry-notifications";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { profile, user, signOut, isTrialActive } = useAuthStore();
  const supportSubject = locale === "sk" ? "Špajza – podpora" : "Spižírna – podpora";
  const supportHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(supportSubject)}`;
  // Denní cíl má smysl jen v domácnosti — v provozovně se sekce skrývá.
  const mode = useModeStore((s) => s.mode);
  const goal = useFoodLogStore((s) => s.goal);
  const setGoal = useFoodLogStore((s) => s.setGoal);
  const calorieTracking = useFeaturesStore((s) => s.calorieTracking);
  const setCalorieTracking = useFeaturesStore((s) => s.setCalorieTracking);
  const showStatsFeature = useFeaturesStore((s) => s.showStats);
  const setShowStatsFeature = useFeaturesStore((s) => s.setShowStats);
  // Název provozovny — jen v provozním režimu.
  const businessName = useBusinessStore((s) => s.name);
  const setBusinessName = useBusinessStore((s) => s.setName);
  const typProvozu = useBusinessStore((s) => s.typProvozu);
  const setTypProvozu = useBusinessStore((s) => s.setTypProvozu);
  const firma = useBusinessStore((s) => s.firma);
  const setFirma = useBusinessStore((s) => s.setFirma);
  const formatDokladu = useBusinessStore((s) => s.formatDokladu);
  const setFormatDokladu = useBusinessStore((s) => s.setFormatDokladu);
  const empEnabled = useEmployeeStore((s) => s.enabled);
  const enableEmp = useEmployeeStore((s) => s.enable);
  const disableEmp = useEmployeeStore((s) => s.disable);
  const lockEmp = useEmployeeStore((s) => s.lock);
  const [empPin, setEmpPin] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const devSetMode = useAuthStore((s) => s.devSetMode);
  // DEV nástroje jen pro vývojářský účet (skryté běžným uživatelům).
  const DEV_EMAILY = ["horsky.jiri@post.cz", "jiri.horsky@dius.ai"];
  const jeDev = DEV_EMAILY.includes((profile?.email || user?.email || "").toLowerCase());
  const devPrepni = async (cilMode: "domacnost" | "provoz", typ?: "obchod" | "restaurace") => {
    if (typ) setTypProvozu(typ); // nastav typ provozu PŘED přepnutím (přežije reload)
    await devSetMode(cilMode);   // zapíše DB + lokálně, pak reloadne
  };

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
    // Zapnutí → naplánuj přátelské notifikace; vypnutí → zruš je (jen v appce).
    if (next) {
      const expiringCount = usePantryStore.getState().getExpiringItems(3).length;
      const shoppingCount = useShoppingStore.getState().getItems("domacnost").filter((i) => !i.checked).length;
      scheduleDailyNudges({ expiringCount, shoppingCount, lastOpenedDaysAgo: 0 });
    } else {
      cancelDailyNudges();
    }
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
    <div className="settings-sheet" style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <div
        className="relative animate-slide-up settings-card"
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

          {/* ══ 2. SDÍLENÍ ══ nejdůležitější nová funkce, hned pod účtem ══ */}

          {/* ── Rodina / sdílení domácnosti ── jen v domácnosti */}
          {mode !== "provoz" && (
            <Section icon={<Users size={15} />} title={t("family.title")}>
              <FamilySection t={t} />
            </Section>
          )}

          {/* ── Sdílení provozovny (majitel ↔ zaměstnanec) ── jen v provozu ── */}
          {mode === "provoz" && (
            <Section icon={<Users size={15} />} title={t("provshare.title")}>
              <ProvozShareSection t={t} />
            </Section>
          )}

          {/* ══ 3. NASTAVENÍ REŽIMU ══ co se často ladí ══ */}

          {/* ── Jazyk aplikace ── jen v domácnosti, provoz běží natvrdo
              česky. Jde vybrat jen jednou při onboardingu (LanguageSelect),
              tohle je jediná cesta, jak si to jazyk později rozmyslet. */}
          {mode !== "provoz" && (
            <Section icon={<Languages size={15} />} title={t("settings.language")}>
              <div style={{ display: "flex", borderRadius: 12, padding: 3, background: "var(--bg-primary)", border: "1.5px solid var(--border)" }}>
                {([
                  { code: "cs" as const, label: t("settings.languageCzech") },
                  { code: "sk" as const, label: t("settings.languageSlovak") },
                ]).map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => setLocale(code)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                      background: locale === code ? "var(--green-primary)" : "transparent",
                      color: locale === code ? "white" : "var(--text-secondary)",
                      transition: "all 0.15s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Section>
          )}

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

          {/* ── Typ provozu ── jen v provozu; změna je zamčená přes potvrzení ── */}
          {mode === "provoz" && typProvozu && (
          <Section icon={<Store size={15} />} title={t("settings.typProvozu")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                {typProvozu === "obchod" ? t("settings.typObchod") : t("settings.typRestaurace")}
              </span>
              <button
                onClick={() => {
                  const cil = typProvozu === "obchod" ? "restaurace" : "obchod";
                  const cilLabel = cil === "obchod" ? t("settings.typObchod") : t("settings.typRestaurace");
                  if (confirm(t("settings.typZmenaQ").replace("{typ}", cilLabel))) {
                    setTypProvozu(cil);
                  }
                }}
                style={{ fontSize: 13, fontWeight: 600, color: "var(--green-primary)", background: "var(--green-light)", border: "none", borderRadius: 10, padding: "8px 14px" }}
              >
                {t("settings.typZmenit")}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>
              {t("settings.typHint")}
            </p>
          </Section>
          )}

          {/* ══ 4. FIRMA + ZAMĚSTNANEC ══ občasné provozní nastavení ══ */}

          {/* ── Údaje firmy pro účtenku / doklady ── jen v provozu ── */}
          {mode === "provoz" && (
          <Section icon={<FileText size={15} />} title={t("settings.firma")}>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "0 0 10px", lineHeight: 1.4 }}>{t("settings.firmaHint")}</p>

            {/* Formát dokladu — úzká účtenka / A4 faktura */}
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 6 }}>{t("settings.dokladFormat")}</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {([
                { id: "uctenka", label: t("settings.dokladUctenka"), desc: t("settings.dokladUctenkaDesc") },
                { id: "faktura", label: t("settings.dokladFaktura"), desc: t("settings.dokladFakturaDesc") },
              ] as const).map((f) => {
                const aktivni = formatDokladu === f.id;
                return (
                  <button key={f.id} onClick={() => setFormatDokladu(f.id)}
                    style={{ flex: 1, textAlign: "left", padding: "10px 12px", borderRadius: 12, background: aktivni ? "var(--green-light)" : "white", border: `1.5px solid ${aktivni ? "var(--green-primary)" : "var(--border)"}` }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: aktivni ? "var(--green-dark)" : "var(--text-primary)" }}>{f.label}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.3, marginTop: 2 }}>{f.desc}</span>
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "0 0 14px", lineHeight: 1.4 }}>{t("settings.dokladHint")}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {firma.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={firma.logoUrl} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", border: "1.5px solid var(--border)" }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--bg-primary)", border: "1.5px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: 10, textAlign: "center" }}>{t("settings.firmaLogo")}</div>
                )}
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--green-primary)", cursor: "pointer" }}>
                  {firma.logoUrl ? t("settings.firmaLogoZmenit") : t("settings.firmaLogoNahrat")}
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setFirma({ logoUrl: reader.result as string });
                      reader.readAsDataURL(file);
                    }} />
                </label>
                {firma.logoUrl && (
                  <button onClick={() => setFirma({ logoUrl: undefined })} style={{ fontSize: 12, color: "#C0392B", background: "transparent", border: "none" }}>{t("settings.firmaLogoOdebrat")}</button>
                )}
              </div>
              {/* Textová pole */}
              {([
                { key: "ico", label: t("settings.firmaIco"), ph: "např. 12345678" },
                { key: "dic", label: t("settings.firmaDic"), ph: "např. CZ12345678" },
                { key: "adresa", label: t("settings.firmaAdresa"), ph: t("settings.firmaAdresaPh") },
                { key: "telefon", label: t("settings.firmaTelefon"), ph: "+420 …" },
                { key: "email", label: t("settings.firmaEmail"), ph: "info@…" },
                { key: "patickaUctenky", label: t("settings.firmaPaticka"), ph: t("settings.firmaPatickaPh") },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 3 }}>{f.label}</label>
                  <input
                    type="text"
                    value={firma[f.key] ?? ""}
                    onChange={(e) => setFirma({ [f.key]: e.target.value })}
                    placeholder={f.ph}
                    style={{ width: "100%", background: "var(--bg-primary)", borderRadius: 12, padding: "10px 14px", border: "1.5px solid var(--border)", outline: "none", fontSize: 14, color: "var(--text-primary)" }}
                  />
                </div>
              ))}
              {/* Plátce DPH? — rozhoduje, jestli je na dokladu rozpad DPH */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!firma.platceDph}
                  onChange={(e) => setFirma({ platceDph: e.target.checked })}
                  style={{ width: 18, height: 18, marginTop: 1, accentColor: "var(--green-dark, #006d40)", flexShrink: 0 }}
                />
                <span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", display: "block" }}>{t("settings.firmaPlatceDph")}</span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{t("settings.firmaPlatceDphPozn")}</span>
                </span>
              </label>
            </div>
          </Section>
          )}

          {/* ── Režim zaměstnance ── jen v provozu: PIN-zámek na jednom zařízení ── */}
          {mode === "provoz" && (
          <Section icon={<Lock size={15} />} title={t("settings.empMode")}>
            {empEnabled ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green-dark)" }}>✓ {t("settings.empOn")}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {/* Zamknout hned (majitel předává tablet zaměstnanci) */}
                  <button
                    onClick={() => { lockEmp(); onClose(); }}
                    style={{ fontSize: 13, fontWeight: 700, color: "white", background: "var(--green-primary)", border: "none", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Lock size={14} /> {t("emp.zamknout")}
                  </button>
                  <button
                    onClick={() => { if (confirm(t("settings.empDisableQ"))) disableEmp(); }}
                    style={{ fontSize: 13, fontWeight: 600, color: "#C0392B", background: "#FDE8E8", border: "none", borderRadius: 10, padding: "8px 14px" }}
                  >
                    {t("settings.empDisable")}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.4 }}>{t("settings.empDesc")}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number" inputMode="numeric" value={empPin}
                    onChange={(e) => setEmpPin(e.target.value.slice(0, 6))}
                    placeholder={t("settings.empPinPlaceholder")}
                    style={{ flex: 1, background: "var(--bg-primary)", borderRadius: 12, padding: "12px 14px", border: "1.5px solid var(--border)", outline: "none", fontSize: 15, letterSpacing: "0.2em", color: "var(--text-primary)" }}
                  />
                  <button
                    onClick={() => { if (empPin.length >= 4) { enableEmp(empPin); setEmpPin(""); } }}
                    disabled={empPin.length < 4}
                    style={{ fontSize: 13, fontWeight: 700, color: "white", background: empPin.length >= 4 ? "var(--green-primary)" : "var(--border)", border: "none", borderRadius: 12, padding: "0 18px" }}
                  >
                    {t("settings.empEnable")}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>{t("settings.empHint")}</p>
              </div>
            )}
          </Section>
          )}

          {/* ── Notifikace ── */}
          <Section icon={<Bell size={15} />} title={t("settings.notifications")}>
            <button
              onClick={toggleNotif}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "2px", background: "transparent" }}
            >
              <span style={{ fontSize: 13, color: "var(--text-primary)", textAlign: "left" }}>{t("settings.notifMaster")}</span>
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
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>{t("settings.notifMasterHint")}</p>
          </Section>

          {/* ── Chytrá upozornění ── každý typ zvlášť zap/vyp (jen když jsou notif zapnuté) */}
          {notif && (
            <Section icon={<Sparkles size={15} />} title={t("settings.smartNotifs")}>
              <SmartNotifSection mode={mode === "provoz" ? "provoz" : "domacnost"} locale={locale} />
            </Section>
          )}

          {/* ── Odznaky ── jen v domácnosti (gamifikace běží zatím tam) */}
          {mode !== "provoz" && (
            <Section icon={<Award size={15} />} title={t("game.badges.title")}>
              <BadgesSection badges={badges} t={t} />
            </Section>
          )}

          {/* ── Moje statistiky ── jen domácnost. Přepínač + (když zapnuto) otevření přehledu. */}
          {mode !== "provoz" && (
            <Section icon={<BarChart3 size={15} />} title={t("settings.stats")}>
              <button
                onClick={() => setShowStatsFeature(!showStatsFeature)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "2px", background: "transparent" }}
              >
                <span style={{ fontSize: 13, color: "var(--text-primary)", textAlign: "left" }}>{t("settings.statsToggle")}</span>
                <span style={{
                  width: 44, height: 26, borderRadius: 99, flexShrink: 0, position: "relative",
                  background: showStatsFeature ? "var(--green-primary)" : "var(--border)", transition: "background 0.2s",
                }}>
                  <span style={{
                    position: "absolute", top: 3, left: showStatsFeature ? 21 : 3, width: 20, height: 20, borderRadius: "50%",
                    background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </span>
              </button>
              {showStatsFeature && (
                <button onClick={() => setShowStats(true)} style={{ ...rowBtn("var(--green-light)", "var(--green-dark)"), marginTop: 10 }}>
                  <BarChart3 size={15} /> {t("settings.statsOpen")}
                </button>
              )}
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>{t("settings.statsHint")}</p>
            </Section>
          )}

          {/* ── Ceny ── jen domácnost. Data se sbírají automaticky při skenování
              (viz ProductSheet), tohle je jediné místo, kde je jde zobrazit. */}
          {mode !== "provoz" && (
            <Section icon={<BarChart3 size={15} />} title={t("settings.prices")}>
              <button onClick={() => setShowPrices(true)} style={rowBtn("var(--green-light)", "var(--green-dark)")}>
                <BarChart3 size={15} /> {t("settings.pricesOpen")}
              </button>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>{t("settings.pricesHint")}</p>
            </Section>
          )}

          {/* ── Export dat ── jen domácnost (provoz exportuje ze své záložky). GDPR přenositelnost. */}
          {mode !== "provoz" && (
            <Section icon={<Download size={15} />} title={t("settings.export")}>
              <button
                onClick={exportHouseholdJSON}
                style={rowBtn("var(--green-light)", "var(--green-dark)")}
              >
                <Download size={15} /> {t("settings.exportJson")}
              </button>
              <button
                onClick={() => exportPantryCSV({
                  name: t("settings.export.name"),
                  brand: t("settings.export.brand"),
                  quantity: t("settings.export.quantity"),
                  unit: t("settings.export.unit"),
                  location: t("settings.export.location"),
                  purchased: t("settings.export.purchased"),
                  expires: t("settings.export.expires"),
                  price: t("settings.export.price"),
                  store: t("settings.export.store"),
                })}
                style={{ ...rowBtn("var(--bg-primary)", "var(--text-secondary)"), marginTop: 8, border: "1.5px solid var(--border)" }}
              >
                <FileText size={15} /> {t("settings.exportCsv")}
              </button>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 2px 0", lineHeight: 1.4 }}>{t("settings.exportHint")}</p>
            </Section>
          )}

          {/* ══ ÚČET & PLÁN ══ méně časté ══ */}

          {/* ── Moje zařízení ── jen v PROVOZU (víc zaměstnaneckých zařízení).
              V domácnosti sdílení řeší Rodina. */}
          {mode === "provoz" && (
            <Section icon={<Smartphone size={15} />} title={t("device.settingsTitle")}>
              <DevicesSection t={t} />
            </Section>
          )}

          {/* ── Plán ── info o plánu; platby (změna/zrušení) až s Play Billing.
              Trial JEN pro provoz (14 dní zdarma); domácnost trial nemá (má
              model 20 položek zdarma / 149 Kč). Odznak se ukazuje jen v provozu
              a jen dokud zkušebka běží. */}
          <Section icon={<Crown size={15} />} title={t("settings.plan")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 2px 10px" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{planLabel}</span>
              {mode === "provoz" && isTrialActive() && profile?.trial_ends_at && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green-dark)", background: "var(--green-light)", padding: "4px 10px", borderRadius: 99 }}>
                  {t("settings.trialEnds").replace("{date}", formatDateShort(profile.trial_ends_at))}
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.4, margin: "2px 2px 0" }}>
              {t("settings.planInfo")}
            </p>
          </Section>

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

          {/* ── DEV: přepínač režimu (jen vývojářský účet) ── */}
          {jeDev && (
            <Section icon={<Wrench size={15} />} title="DEV — přepnout režim">
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "0 2px 10px", lineHeight: 1.4 }}>
                Rychlé přepnutí účtu mezi režimy pro testování. Appka se po kliknutí znovu načte.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                {([
                  { lbl: "🏠 Domácnost", m: "domacnost" as const, typ: undefined, active: mode === "domacnost" },
                  { lbl: "🛒 Obchod s potravinami", m: "provoz" as const, typ: "obchod" as const, active: mode === "provoz" && typProvozu === "obchod" },
                  { lbl: "🍽️ Restaurace / jídelna", m: "provoz" as const, typ: "restaurace" as const, active: mode === "provoz" && typProvozu === "restaurace" },
                ]).map((o) => (
                  <button key={o.lbl} onClick={() => devPrepni(o.m, o.typ)} disabled={o.active}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: "left",
                      background: o.active ? "var(--green-light)" : "white",
                      border: `1.5px solid ${o.active ? "var(--green-primary)" : "var(--border)"}`,
                      color: o.active ? "var(--green-dark)" : "var(--text-primary)",
                      cursor: o.active ? "default" : "pointer", opacity: o.active ? 0.9 : 1,
                    }}>
                    <span>{o.lbl}</span>
                    {o.active && <span style={{ fontSize: 12, fontWeight: 700 }}>aktivní ✓</span>}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* ── O aplikaci ── */}
          <Section icon={<Info size={15} />} title={t("settings.about")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("settings.version")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{APP_VERSION}</span>
            </div>
          </Section>
        </div>
      </div>

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      {showPrices && <PricesModal onClose={() => setShowPrices(false)} />}
    </div>
  );
}

// Přepínače chytrých upozornění — každý typ zvlášť, podle režimu.
function SmartNotifSection({ mode, locale }: { mode: "domacnost" | "provoz"; locale: string }) {
  const prefs = useNotifPrefsStore((s) => s.prefs);
  const setEnabled = useNotifPrefsStore((s) => s.setEnabled);
  const items = NOTIF_META[mode];
  const isOn = (k: NotifType) => prefs[k] !== false;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {items.map((it) => {
        const on = isOn(it.key);
        return (
          <button
            key={it.key}
            onClick={() => setEnabled(it.key, !on)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 2px", background: "transparent" }}
          >
            <span style={{ fontSize: 13, color: "var(--text-primary)", textAlign: "left" }}>
              {locale === "sk" ? it.sk : it.cs}
            </span>
            <span style={{
              width: 44, height: 26, borderRadius: 99, flexShrink: 0, position: "relative",
              background: on ? "var(--green-primary)" : "var(--border)", transition: "background 0.2s",
            }}>
              <span style={{
                position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%",
                background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </span>
          </button>
        );
      })}
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

// Sdílení provozovny — majitel vytvoří provoz + pošle kód, zaměstnanec se připojí.
function ProvozShareSection({ t }: { t: ReturnType<typeof useT> }) {
  const { provozovnaId, joinCode, role, members, loading, error, createProvozovna, joinProvozovna, leaveProvozovna, refreshProvozovna } = useProvozShareStore();
  const [kod, setKod] = useState("");
  const [zkopirovano, setZkopirovano] = useState(false);

  useEffect(() => { refreshProvozovna(); }, [refreshProvozovna]);

  const handleCreate = async () => {
    const code = await createProvozovna();
    if (code) { provozStartRealtime(); provozSyncNow(); }
  };
  const handleJoin = async () => {
    if (!kod.trim()) return;
    const ok = await joinProvozovna(kod.trim());
    if (ok) { setKod(""); provozStartRealtime(); provozSyncNow(); }
  };
  const handleLeave = async () => { provozStopRealtime(); await leaveProvozovna(); };
  const kopirovat = () => {
    if (joinCode) {
      navigator.clipboard?.writeText(joinCode).catch(() => {});
      setZkopirovano(true); setTimeout(() => setZkopirovano(false), 1500);
    }
  };

  if (!provozovnaId) {
    return (
      <>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.4, margin: "0 2px 12px" }}>
          {t("provshare.hint")}
        </p>
        <button onClick={handleCreate} disabled={loading} className="btn-primary" style={{ width: "100%", marginBottom: 10 }}>
          <Users size={16} /> {t("provshare.create")}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={kod} onChange={(e) => setKod(e.target.value.toUpperCase())} placeholder={t("provshare.codePlaceholder")}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 12, fontSize: 14, border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)", letterSpacing: "0.05em" }} />
          <button onClick={handleJoin} disabled={loading || !kod.trim()} style={{ padding: "10px 16px", borderRadius: 12, background: "var(--green-primary)", color: "white", fontSize: 13, fontWeight: 700, opacity: !kod.trim() ? 0.5 : 1 }}>
            {t("provshare.join")}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: "var(--red)", margin: "8px 2px 0" }}>{error}</p>}
      </>
    );
  }

  return (
    <>
      <p style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.4, margin: "0 2px 10px" }}>
        {role === "owner" ? t("provshare.sharedOwner") : t("provshare.sharedEmployee")}
      </p>
      {/* Kód ukazujeme jen majiteli — ten ho rozdává zaměstnancům */}
      {role === "owner" && joinCode && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--green-light)", borderRadius: 12, padding: "10px 14px", marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--green-dark)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{t("provshare.yourCode")}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--green-dark)", letterSpacing: "0.08em", margin: "2px 0 0" }}>{joinCode}</p>
          </div>
          <button onClick={kopirovat} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, background: "white", border: "1.5px solid var(--green-primary)", color: "var(--green-dark)", fontSize: 12, fontWeight: 700 }}>
            {zkopirovano ? <><Check size={13} /> {t("family.copied")}</> : <><Copy size={13} /> {t("family.copy")}</>}
          </button>
        </div>
      )}
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 2px 8px" }}>
        {t("provshare.role")}: <b>{role === "owner" ? t("provshare.owner") : t("provshare.employee")}</b> · {t("provshare.members").replace("{n}", String(members.length))}
      </p>
      <button onClick={handleLeave} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center", padding: "10px", borderRadius: 12, background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--red)", fontSize: 13, fontWeight: 700 }}>
        <LogOut size={14} /> {t("provshare.leave")}
      </button>
    </>
  );
}

// Rodinné sdílení domácnosti — vytvořit rodinu / připojit se kódem / členové.
function FamilySection({ t }: { t: ReturnType<typeof useT> }) {
  const { familyId, joinCode, role, members, loading, error, createFamily, joinFamily, leaveFamily, refreshFamily } = useFamilyStore();
  const [kod, setKod] = useState("");
  const [zkopirovano, setZkopirovano] = useState(false);

  useEffect(() => { refreshFamily(); }, [refreshFamily]);

  const handleCreate = async () => {
    const code = await createFamily();
    if (code) { startRealtime(); syncNow(); }
  };
  const handleJoin = async () => {
    if (!kod.trim()) return;
    const ok = await joinFamily(kod.trim());
    if (ok) { setKod(""); startRealtime(); syncNow(); }
  };
  const handleLeave = async () => {
    stopRealtime();
    await leaveFamily();
  };
  const kopirovat = () => {
    if (joinCode) {
      navigator.clipboard?.writeText(joinCode).catch(() => {});
      setZkopirovano(true);
      setTimeout(() => setZkopirovano(false), 1500);
    }
  };

  // Není v rodině → nabídni vytvořit / připojit
  if (!familyId) {
    return (
      <>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.4, margin: "0 2px 12px" }}>
          {t("family.hint")}
        </p>
        <button onClick={handleCreate} disabled={loading} className="btn-primary" style={{ width: "100%", marginBottom: 10 }}>
          <Users size={16} /> {t("family.create")}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={kod}
            onChange={(e) => setKod(e.target.value.toUpperCase())}
            placeholder={t("family.codePlaceholder")}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 12, fontSize: 14, border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)", letterSpacing: "0.05em" }}
          />
          <button onClick={handleJoin} disabled={loading || !kod.trim()} style={{ padding: "10px 16px", borderRadius: 12, background: "var(--green-primary)", color: "white", fontSize: 13, fontWeight: 700, opacity: !kod.trim() ? 0.5 : 1 }}>
            {t("family.join")}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: "var(--red)", margin: "8px 2px 0" }}>{error}</p>}
      </>
    );
  }

  // V rodině → ukaž kód + členy + odejít
  return (
    <>
      <p style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.4, margin: "0 2px 10px" }}>
        {role === "owner" ? t("family.shared") : t("family.sharedMember")}
      </p>
      {/* Kód vidí a rozdává JEN zakladatel (owner). Připojený člen ho nepotřebuje
          a nesmí zvát další (limit 2 lidi). */}
      {role === "owner" && joinCode && members.length < 2 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--green-light)", borderRadius: 12, padding: "10px 14px", marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--green-dark)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{t("family.yourCode")}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--green-dark)", letterSpacing: "0.08em", margin: "2px 0 0" }}>{joinCode}</p>
          </div>
          <button onClick={kopirovat} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, background: "white", border: "1.5px solid var(--green-primary)", color: "var(--green-dark)", fontSize: 12, fontWeight: 700 }}>
            {zkopirovano ? <><Check size={13} /> {t("family.copied")}</> : <><Copy size={13} /> {t("family.copy")}</>}
          </button>
        </div>
      )}
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 2px 8px" }}>
        {t("family.members").replace("{n}", String(members.length))} / 2
      </p>
      <button onClick={handleLeave} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center", padding: "10px", borderRadius: 12, background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--red)", fontSize: 13, fontWeight: 700 }}>
        <LogOut size={14} /> {t("family.leave")}
      </button>
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
