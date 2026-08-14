import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface LeafletPage {
  page_number: number;
  image_url: string;
}

export interface Leaflet {
  id: string;
  retailer: string;
  title: string | null;
  num_pages: number;
  updated_at: string;
  pages: LeafletPage[];
}

interface LeafletsStore {
  leaflets: Leaflet[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchLeaflets: () => Promise<void>;
}

// Čte veřejná data (žádné přihlášení) — naplní je cron job na serveru
// (src/app/api/cron/sync-leaflets), appka jen čte hotové obrázky stránek.
export const useLeafletsStore = create<LeafletsStore>((set, get) => ({
  leaflets: [],
  loading: false,
  loaded: false,
  error: null,

  fetchLeaflets: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const { data: leaflets, error: leafletsErr } = await supabase
        .from("leaflets")
        .select("id, retailer, title, num_pages, updated_at")
        .order("updated_at", { ascending: false });
      if (leafletsErr) throw leafletsErr;

      const ids = (leaflets ?? []).map((l) => l.id);
      let pagesByLeaflet: Record<string, LeafletPage[]> = {};
      if (ids.length > 0) {
        const { data: pages, error: pagesErr } = await supabase
          .from("leaflet_pages")
          .select("leaflet_id, page_number, image_url")
          .in("leaflet_id", ids)
          .order("page_number", { ascending: true });
        if (pagesErr) throw pagesErr;
        pagesByLeaflet = (pages ?? []).reduce<Record<string, LeafletPage[]>>((acc, p) => {
          (acc[p.leaflet_id] ??= []).push({ page_number: p.page_number, image_url: p.image_url });
          return acc;
        }, {});
      }

      const result: Leaflet[] = (leaflets ?? []).map((l) => ({
        ...l,
        pages: pagesByLeaflet[l.id] ?? [],
      }));
      set({ leaflets: result, loading: false, loaded: true });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), loading: false, loaded: true });
    }
  },
}));
