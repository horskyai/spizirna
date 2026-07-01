"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  display_name: string;
  plan: "free" | "basic" | "family";
  // Režim vázaný na účet — jeden e-mail = jeden režim (domácnost/provoz).
  mode?: "domacnost" | "provoz" | null;
  trial_ends_at: string;
  family_id?: string;
}

// Zařízení evidované u účtu (z DB funkce register_device při LIMIT stavu).
export interface DeviceRow {
  id: string;
  device_id: string;
  device_name: string | null;
  last_seen_at: string;
}

interface AuthStore {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  // Když je účet přihlášený na max počtu zařízení a tohle je nové → blokace.
  // null = v pořádku; objekt = "plno", appka ukáže obrazovku Limit zařízení.
  deviceLimitHit: { limit: number; devices: DeviceRow[] } | null;
  registerCurrentDevice: () => Promise<void>;
  removeDevice: (rowId: string) => Promise<void>;
  addDeviceSlot: () => Promise<void>;
  listDevices: () => Promise<DeviceRow[]>;
  currentDeviceId: () => string;
  init: () => Promise<void>;
  // signUp vrací { error, needsConfirmation } — pokud je v Supabase vypnuté
  // potvrzování e-mailem, vznikne rovnou session a needsConfirmation = false.
  signUp: (email: string, password: string, name: string, mode: "domacnost" | "provoz") => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<string | null>;
  // Pošle e-mail s odkazem na obnovu hesla (text e-mailu řídí Supabase šablona).
  resetPassword: (email: string) => Promise<string | null>;
  // Nastaví nové heslo přihlášenému uživateli (po kliknutí na odkaz z e-mailu).
  updatePassword: (newPassword: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  // Nevratně smaže účet a všechna data (přes Edge Function delete-account).
  deleteAccount: () => Promise<string | null>;
  isTrialActive: () => boolean;
  isPaidPlan: () => boolean;
}

// Trvalé ID tohoto zařízení — uložené v localStorage, přežije odhlášení.
const DEVICE_ID_KEY = "device-id";
function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// Přátelský název zařízení z user-agenta ("Chrome · Android").
function deviceName(): string {
  if (typeof navigator === "undefined") return "Neznámé zařízení";
  const ua = navigator.userAgent;
  const os = /Android/i.test(ua) ? "Android"
    : /iPhone|iPad|iPod/i.test(ua) ? "iOS"
    : /Windows/i.test(ua) ? "Windows"
    : /Mac/i.test(ua) ? "Mac"
    : "Web";
  const browser = /Edg/i.test(ua) ? "Edge"
    : /Chrome/i.test(ua) ? "Chrome"
    : /Firefox/i.test(ua) ? "Firefox"
    : /Safari/i.test(ua) ? "Safari"
    : "Prohlížeč";
  return `${browser} · ${os}`;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  deviceLimitHit: null,

  registerCurrentDevice: async () => {
    const { data, error } = await supabase.rpc("register_device", {
      p_device_id: getDeviceId(),
      p_device_name: deviceName(),
    });
    if (error) return; // síťová chyba → nezablokujeme uživatele
    if (data?.status === "LIMIT") {
      set({ deviceLimitHit: { limit: data.limit, devices: data.devices ?? [] } });
    } else {
      set({ deviceLimitHit: null });
    }
  },

  removeDevice: async (rowId) => {
    await supabase.rpc("remove_device", { p_device_row_id: rowId });
    // Po uvolnění slotu zkus zaregistrovat tohle zařízení znovu.
    await get().registerCurrentDevice();
  },

  addDeviceSlot: async () => {
    // DOČASNÉ (testovací na Vercelu): zvýší limit bez reálné platby.
    // Později nahradí Google Play Billing.
    await supabase.rpc("add_device_slot");
    await get().registerCurrentDevice();
  },

  listDevices: async () => {
    const { data } = await supabase
      .from("user_devices")
      .select("id, device_id, device_name, last_seen_at")
      .order("last_seen_at", { ascending: false });
    return (data as DeviceRow[]) ?? [];
  },

  currentDeviceId: () => getDeviceId(),

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      set({ user: session.user, session, profile, loading: false });
      await get().registerCurrentDevice();
    } else {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({ user: session.user, session, profile });
        await get().registerCurrentDevice();
      } else {
        set({ user: null, session: null, profile: null, deviceLimitHit: null });
      }
    });
  },

  signUp: async (email, password, name, mode) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // app_mode uloží DB trigger handle_new_user do profiles.mode
      options: { data: { display_name: name, app_mode: mode } },
    });
    // Když je session rovnou k dispozici, potvrzování e-mailem je vypnuté
    // a uživatel je přihlášený (onAuthStateChange ho pustí dovnitř).
    const needsConfirmation = !error && !data.session;
    return { error: error?.message ?? null, needsConfirmation };
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  },

  resetPassword: async (email) => {
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return error?.message ?? null;
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error?.message ?? null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },

  deleteAccount: async () => {
    // Zavolej Edge Function s access tokenem přihlášeného uživatele.
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return "not_authenticated";
    const { error } = await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (error) return error.message;
    // Účet smazán → lokální odhlášení + vyčištění všech lokálních dat.
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, deviceLimitHit: null });
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.replace("/");
    }
    return null;
  },

  isTrialActive: () => {
    const { profile } = get();
    if (!profile) return false;
    return new Date(profile.trial_ends_at) > new Date();
  },

  isPaidPlan: () => {
    const { profile } = get();
    if (!profile) return false;
    return profile.plan === "basic" || profile.plan === "family";
  },
}));

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*, family_members(family_id)")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return {
    ...data,
    family_id: data.family_members?.[0]?.family_id,
  };
}
