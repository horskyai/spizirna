"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  display_name: string;
  plan: "free" | "basic" | "family";
  trial_ends_at: string;
  family_id?: string;
}

interface AuthStore {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  init: () => Promise<void>;
  // signUp vrací { error, needsConfirmation } — pokud je v Supabase vypnuté
  // potvrzování e-mailem, vznikne rovnou session a needsConfirmation = false.
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<string | null>;
  // Pošle e-mail s odkazem na obnovu hesla (text e-mailu řídí Supabase šablona).
  resetPassword: (email: string) => Promise<string | null>;
  // Nastaví nové heslo přihlášenému uživateli (po kliknutí na odkaz z e-mailu).
  updatePassword: (newPassword: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  isTrialActive: () => boolean;
  isPaidPlan: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      set({ user: session.user, session, profile, loading: false });
    } else {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({ user: session.user, session, profile });
      } else {
        set({ user: null, session: null, profile: null });
      }
    });
  },

  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
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
