import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

// Rodinné sdílení domácnosti (spížírna + nákup). Napojeno na Supabase
// funkce create_family / join_family a tabulky shared_pantry_items /
// shared_shopping_items. familyId si držíme i lokálně (persist), ať appka
// hned ví, že je v rodině, bez čekání na síť.

export interface FamilyMember {
  user_id: string;
  role: string;
  email?: string;
  display_name?: string;
}

interface FamilyStore {
  familyId: string | null;
  joinCode: string | null;
  role: "owner" | "member" | null;  // owner = zakladatel (vidí kód, zve), member = připojený
  members: FamilyMember[];
  loading: boolean;
  error: string | null;

  // Vytvoří novou rodinu, uživatel se stane vlastníkem. Vrátí kód.
  createFamily: (name?: string) => Promise<string | null>;
  // Připojí se k rodině pomocí kódu.
  joinFamily: (code: string) => Promise<boolean>;
  // Odejde z rodiny (přestane sdílet). Lokální data zůstanou.
  leaveFamily: () => Promise<void>;
  // Načte aktuální rodinu uživatele (po přihlášení / startu).
  refreshFamily: () => Promise<void>;
  // Načte seznam členů.
  refreshMembers: () => Promise<void>;
}

export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set, get) => ({
      familyId: null,
      joinCode: null,
      role: null,
      members: [],
      loading: false,
      error: null,

      createFamily: async (name) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase.rpc("create_family", { family_name: name ?? "" });
        set({ loading: false });
        if (error) { set({ error: error.message }); return null; }
        const row = Array.isArray(data) ? data[0] : data;
        if (!row?.family_id) { set({ error: "Nepodařilo se vytvořit rodinu" }); return null; }
        set({ familyId: row.family_id, joinCode: row.join_code, role: "owner" });
        get().refreshMembers();
        return row.join_code as string;
      },

      joinFamily: async (code) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase.rpc("join_family", { code });
        set({ loading: false });
        if (error) { set({ error: error.message }); return false; }
        const fid = typeof data === "string" ? data : (data as any)?.[0] ?? null;
        if (!fid) { set({ error: "Neplatný kód" }); return false; }
        set({ familyId: fid, role: "member" });
        // dotáhni kód (kvůli zobrazení) + členy
        get().refreshFamily();
        get().refreshMembers();
        return true;
      },

      leaveFamily: async () => {
        const fid = get().familyId;
        if (!fid) return;
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (uid) {
          await supabase.from("family_members").delete().eq("family_id", fid).eq("user_id", uid);
        }
        set({ familyId: null, joinCode: null, role: null, members: [] });
      },

      refreshFamily: async () => {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid) { set({ familyId: null, joinCode: null, role: null }); return; }
        // najdi členství → rodinu (i s rolí)
        const { data: mem } = await supabase
          .from("family_members")
          .select("family_id, role")
          .eq("user_id", uid)
          .limit(1)
          .maybeSingle();
        if (!mem?.family_id) { set({ familyId: null, joinCode: null, role: null, members: [] }); return; }
        const { data: fam } = await supabase
          .from("families")
          .select("id, join_code")
          .eq("id", mem.family_id)
          .maybeSingle();
        set({
          familyId: mem.family_id,
          joinCode: fam?.join_code ?? null,
          role: (mem.role as "owner" | "member") ?? "member",
        });
        get().refreshMembers();
      },

      refreshMembers: async () => {
        const fid = get().familyId;
        if (!fid) { set({ members: [] }); return; }
        const { data } = await supabase
          .from("family_members")
          .select("user_id, role")
          .eq("family_id", fid);
        set({ members: (data ?? []) as FamilyMember[] });
      },
    }),
    { name: "family-store" }
  )
);
