"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useT } from "@/lib/i18n";
import { Smartphone, Trash2, Plus, LogOut } from "lucide-react";
import { formatDateShort } from "@/lib/dateUtils";

// Obrazovka po přihlášení, když má účet plný počet zařízení a tohle je nové.
// Uživatel může odhlásit staré zařízení (uvolní slot) nebo přidat slot za 59 Kč.
export function DeviceLimitScreen() {
  const t = useT();
  const { deviceLimitHit, removeDevice, addDeviceSlot, signOut } = useAuthStore();
  const [busy, setBusy] = useState(false);

  if (!deviceLimitHit) return null;
  const { limit, devices } = deviceLimitHit;

  const handleRemove = async (rowId: string) => {
    setBusy(true);
    await removeDevice(rowId);
    setBusy(false);
  };

  const handleAddSlot = async () => {
    setBusy(true);
    await addDeviceSlot();
    setBusy(false);
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", padding: "24px 20px", paddingTop: "max(48px, env(safe-area-inset-top, 48px))" }}>
      <div style={{ maxWidth: 420, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Hlavička */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF3E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Smartphone size={30} style={{ color: "#B85C00" }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
            {t("device.limitTitle")}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
            {t("device.limitDesc").replace("{n}", String(limit))}
          </p>
        </div>

        {/* Seznam zařízení */}
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
          {t("device.yourDevices")}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {devices.map((d) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "white", borderRadius: 14, padding: "12px 14px", border: "1.5px solid var(--border)" }}>
              <Smartphone size={18} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflowWrap: "anywhere" }}>
                  {d.device_name || t("device.unknownDevice")}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "1px 0 0" }}>
                  {t("device.lastSeen").replace("{date}", formatDateShort(d.last_seen_at))}
                </p>
              </div>
              <button
                onClick={() => handleRemove(d.id)}
                disabled={busy}
                style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#C0392B", background: "#FDE8E8", border: "none", borderRadius: 99, padding: "6px 12px", opacity: busy ? 0.5 : 1 }}
              >
                <Trash2 size={13} /> {t("device.logout")}
              </button>
            </div>
          ))}
        </div>

        {/* Přidat slot za 59 Kč (zatím testovací) */}
        <button
          onClick={handleAddSlot}
          disabled={busy}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: busy ? 0.5 : 1 }}
        >
          <Plus size={18} /> {t("device.addSlot")}
        </button>
        <p style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", margin: "8px 0 0", lineHeight: 1.4 }}>
          {t("device.addSlotHint")}
        </p>

        {/* Odhlásit se */}
        <button
          onClick={() => signOut()}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", background: "transparent", border: "none", padding: 12, marginTop: "auto" }}
        >
          <LogOut size={15} /> {t("device.signOut")}
        </button>
      </div>
    </div>
  );
}
