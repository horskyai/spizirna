-- ============================================================================
-- SPIŽÍRNA — Sdílení PROVOZU, Etapa 2: PRODEJKY živě
-- Zaměstnanec prodá → majitel vidí tržby. Sklad se NEodečítá podruhé (odečet
-- řeší ten, kdo prodává; prodejka v cloudu je jen evidence tržby).
-- Spustit v Supabase → SQL Editor → Run. Jen přidává.
-- ============================================================================

create table if not exists public.shared_provoz_prodejky (
  id            uuid primary key default gen_random_uuid(),
  provozovna_id uuid not null references public.provozovny(id) on delete cascade,
  client_id     text not null,             -- id prodejky z klienta
  payload       jsonb not null,            -- celá Prodejka jako JSON
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id),
  deleted       boolean not null default false,  -- storno = deleted
  unique (provozovna_id, client_id)
);
create index if not exists idx_sh_prov_prodejky on public.shared_provoz_prodejky(provozovna_id);

alter table public.shared_provoz_prodejky enable row level security;

drop policy if exists shprod_select on public.shared_provoz_prodejky;
create policy shprod_select on public.shared_provoz_prodejky
  for select using (public.is_member_of_provozovna(provozovna_id));
drop policy if exists shprod_write on public.shared_provoz_prodejky;
create policy shprod_write on public.shared_provoz_prodejky
  for all using (public.is_member_of_provozovna(provozovna_id))
          with check (public.is_member_of_provozovna(provozovna_id));

-- HOTOVO (Etapa 2).
