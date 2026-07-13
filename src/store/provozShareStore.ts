import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

// Sdílení PROVOZU mezi telefony (majitel ↔ zaměstnanec). Napojeno na Supabase
// funkce create_provozovna / join_provozovna a tabulky shared_provoz_polozky /
// shared_provoz_menu. Drží i lokálně (persist), ať appka hned ví stav.
// Role: "owner" (majitel) | "employee" (zaměstnanec) — pro pozdější oprávnění.

export interface ProvozMember {
  user_id: string;
  role: string;
}

interface ProvozShareStore {
  provozovnaId: string | null;
  joinCode: string | null;
  role: "owner" | "employee" | null;
  members: ProvozMember[];
  loading: boolean;
  error: string | null;

  createProvozovna: (name?: string) => Promise<string | null>;
  joinProvozovna: (code: string) => Promise<boolean>;
  leaveProvozovna: () => Promise<void>;
  refreshProvozovna: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

export const useProvozShareStore = create<ProvozShareStore>()(
  persist(
    (set, get) => ({
      provozovnaId: null,
      joinCode: null,
      role: null,
      members: [],
      loading: false,
      error: null,

      createProvozovna: async (name) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase.rpc("create_provozovna", { prov_name: name ?? "" });
        set({ loading: false });
        if (error) { set({ error: error.message }); return null; }
        const row = Array.isArray(data) ? data[0] : data;
        if (!row?.provozovna_id) { set({ error: "Nepodařilo se vytvořit provozovnu" }); return null; }
        set({ provozovnaId: row.provozovna_id, joinCode: row.join_code, role: "owner" });
        get().refreshMembers();
        return row.join_code as string;
      },

      joinProvozovna: async (code) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase.rpc("join_provozovna", { code });
        set({ loading: false });
        if (error) { set({ error: error.message }); return false; }
        const pid = typeof data === "string" ? data : (data as any)?.[0] ?? null;
        if (!pid) { set({ error: "Neplatný kód" }); return false; }
        set({ provozovnaId: pid, role: "employee" });
        get().refreshProvozovna();
        get().refreshMembers();
        return true;
      },

      leaveProvozovna: async () => {
        const pid = get().provozovnaId;
        if (!pid) return;
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (uid) {
          await supabase.from("provozovna_members").delete().eq("provozovna_id", pid).eq("user_id", uid);
        }
        set({ provozovnaId: null, joinCode: null, role: null, members: [] });
      },

      refreshProvozovna: async () => {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid) { set({ provozovnaId: null, joinCode: null, role: null }); return; }
        const { data: mem } = await supabase
          .from("provozovna_members")
          .select("provozovna_id, role")
          .eq("user_id", uid)
          .limit(1)
          .maybeSingle();
        if (!mem?.provozovna_id) { set({ provozovnaId: null, joinCode: null, role: null, members: [] }); return; }
        const { data: prov } = await supabase
          .from("provozovny")
          .select("id, join_code")
          .eq("id", mem.provozovna_id)
          .maybeSingle();
        set({
          provozovnaId: mem.provozovna_id,
          joinCode: prov?.join_code ?? null,
          role: (mem.role as "owner" | "employee") ?? "employee",
        });
        get().refreshMembers();
      },

      refreshMembers: async () => {
        const pid = get().provozovnaId;
        if (!pid) { set({ members: [] }); return; }
        const { data } = await supabase
          .from("provozovna_members")
          .select("user_id, role")
          .eq("provozovna_id", pid);
        set({ members: (data ?? []) as ProvozMember[] });
      },
    }),
    { name: "provoz-share-store" }
  )
);
