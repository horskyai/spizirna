-- ============================================================================
-- SPIŽÍRNA — Sdílení PROVOZU mezi telefony (majitel ↔ zaměstnanec)
-- Etapa 1: sklad (polozky) + menu kasy + ceny. Prodejky = etapa 2.
-- ----------------------------------------------------------------------------
-- Spustit v Supabase → SQL Editor → New query → vložit → Run.
-- Bezpečné: jen PŘIDÁVÁ nové tabulky/funkce/politiky.
-- ============================================================================

-- 1) Provozovna (sdílená jednotka) + pozvánkový kód + role u členů
create table if not exists public.provozovny (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Moje provozovna',
  owner_id    uuid not null references auth.users(id),
  join_code   text unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.provozovna_members (
  id            uuid primary key default gen_random_uuid(),
  provozovna_id uuid not null references public.provozovny(id) on delete cascade,
  user_id       uuid not null references auth.users(id),
  role          text not null default 'employee',  -- 'owner' | 'employee'
  joined_at     timestamptz not null default now(),
  unique (provozovna_id, user_id)
);
create index if not exists idx_prov_members_prov on public.provozovna_members(provozovna_id);
create index if not exists idx_prov_members_user on public.provozovna_members(user_id);

-- 2) Sdílený SKLAD (položky provozu)
create table if not exists public.shared_provoz_polozky (
  id            uuid primary key default gen_random_uuid(),
  provozovna_id uuid not null references public.provozovny(id) on delete cascade,
  client_id     text not null,
  payload       jsonb not null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id),
  deleted       boolean not null default false,
  unique (provozovna_id, client_id)
);
create index if not exists idx_sh_prov_pol on public.shared_provoz_polozky(provozovna_id);

-- 3) Sdílené MENU kasy
create table if not exists public.shared_provoz_menu (
  id            uuid primary key default gen_random_uuid(),
  provozovna_id uuid not null references public.provozovny(id) on delete cascade,
  client_id     text not null,
  payload       jsonb not null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id),
  deleted       boolean not null default false,
  unique (provozovna_id, client_id)
);
create index if not exists idx_sh_prov_menu on public.shared_provoz_menu(provozovna_id);

-- ============================================================================
-- 4) Bezpečná funkce členství (SECURITY DEFINER, proti RLS rekurzi)
-- ============================================================================
create or replace function public.is_member_of_provozovna(pid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.provozovna_members
    where provozovna_members.provozovna_id = pid
      and provozovna_members.user_id = auth.uid()
  );
$$;

-- Je aktuální uživatel MAJITEL dané provozovny? (pro budoucí oprávnění)
create or replace function public.is_owner_of_provozovna(pid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.provozovna_members
    where provozovna_members.provozovna_id = pid
      and provozovna_members.user_id = auth.uid()
      and provozovna_members.role = 'owner'
  );
$$;

-- ============================================================================
-- 5) RLS
--   Etapa 1: člen čte i píše (majitel i zaměstnanec můžou měnit sklad/menu).
--   Etapa 3 později zpřísní: zaměstnanec jen čte ceny apod. (přes is_owner_*).
-- ============================================================================
alter table public.provozovny            enable row level security;
alter table public.provozovna_members    enable row level security;
alter table public.shared_provoz_polozky enable row level security;
alter table public.shared_provoz_menu    enable row level security;

-- provozovny: člen vidí svou provozovnu
drop policy if exists prov_select on public.provozovny;
create policy prov_select on public.provozovny
  for select using (public.is_member_of_provozovna(id));

-- members: člen vidí členy své provozovny
drop policy if exists provm_select on public.provozovna_members;
create policy provm_select on public.provozovna_members
  for select using (public.is_member_of_provozovna(provozovna_id));

-- sklad
drop policy if exists shpp_select on public.shared_provoz_polozky;
create policy shpp_select on public.shared_provoz_polozky
  for select using (public.is_member_of_provozovna(provozovna_id));
drop policy if exists shpp_write on public.shared_provoz_polozky;
create policy shpp_write on public.shared_provoz_polozky
  for all using (public.is_member_of_provozovna(provozovna_id))
          with check (public.is_member_of_provozovna(provozovna_id));

-- menu
drop policy if exists shpm_select on public.shared_provoz_menu;
create policy shpm_select on public.shared_provoz_menu
  for select using (public.is_member_of_provozovna(provozovna_id));
drop policy if exists shpm_write on public.shared_provoz_menu;
create policy shpm_write on public.shared_provoz_menu
  for all using (public.is_member_of_provozovna(provozovna_id))
          with check (public.is_member_of_provozovna(provozovna_id));

-- ============================================================================
-- 6) Funkce: vytvořit provozovnu (majitel) / připojit se kódem (zaměstnanec)
-- ============================================================================
create or replace function public.create_provozovna(prov_name text default 'Moje provozovna')
returns table (provozovna_id uuid, join_code text)
language plpgsql security definer set search_path = public as $$
declare new_id uuid; code text;
begin
  code := 'PROV-' || upper(substr(replace(encode(gen_random_bytes(4),'hex'),'0','a'),1,4));
  insert into public.provozovny (name, owner_id, join_code)
    values (coalesce(nullif(prov_name,''),'Moje provozovna'), auth.uid(), code)
    returning id into new_id;
  insert into public.provozovna_members (provozovna_id, user_id, role)
    values (new_id, auth.uid(), 'owner') on conflict do nothing;
  return query select new_id, code;
end; $$;

create or replace function public.join_provozovna(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  select id into pid from public.provozovny where join_code = upper(trim(code));
  if pid is null then raise exception 'Neplatný kód provozovny'; end if;
  insert into public.provozovna_members (provozovna_id, user_id, role)
    values (pid, auth.uid(), 'employee') on conflict do nothing;
  return pid;
end; $$;

grant execute on function public.create_provozovna(text) to authenticated;
grant execute on function public.join_provozovna(text) to authenticated;
grant execute on function public.is_member_of_provozovna(uuid) to authenticated;
grant execute on function public.is_owner_of_provozovna(uuid) to authenticated;

-- ============================================================================
-- HOTOVO (Etapa 1). Prodejky (etapa 2) + jemná oprávnění (etapa 3) přijdou zvlášť.
-- ============================================================================
