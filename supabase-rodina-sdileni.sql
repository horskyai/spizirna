-- ============================================================================
-- SPIŽÍRNA — Rodinné sdílení domácnosti (spížírna + nákupní seznam)
-- ----------------------------------------------------------------------------
-- Spustit v Supabase → SQL Editor → New query → vložit → Run.
-- Bezpečné: jen PŘIDÁVÁ (nové sloupce/tabulky/politiky), nemaže existující data.
-- Naváže na existující tabulky families / family_members / profiles.
-- ============================================================================

-- 1) Pozvánkový kód do families (krátký, unikátní, pro připojení člena)
alter table public.families
  add column if not exists join_code text unique;

-- 2) Sdílená SPÍŽÍRNA (jedna řada = jedna položka spížírny rodiny)
create table if not exists public.shared_pantry_items (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families(id) on delete cascade,
  -- klientský lokální identifikátor (aby šlo párovat s localStorage a dedupovat)
  client_id     text not null,
  payload       jsonb not null,             -- celý PantryItem jako JSON
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id),
  deleted       boolean not null default false,
  unique (family_id, client_id)
);
create index if not exists idx_shared_pantry_family on public.shared_pantry_items(family_id);

-- 3) Sdílený NÁKUPNÍ SEZNAM
create table if not exists public.shared_shopping_items (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families(id) on delete cascade,
  client_id     text not null,
  payload       jsonb not null,             -- celý ShoppingItem jako JSON
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id),
  deleted       boolean not null default false,
  unique (family_id, client_id)
);
create index if not exists idx_shared_shopping_family on public.shared_shopping_items(family_id);

-- ============================================================================
-- 4) BEZPEČNÁ funkce "je uživatel členem této rodiny?" (SECURITY DEFINER)
--    Zabraňuje nekonečné RLS rekurzi (family_members ↔ shared_* politiky).
-- ============================================================================
create or replace function public.is_member_of_family(fid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.family_members
    where family_members.family_id = fid
      and family_members.user_id = auth.uid()
  );
$$;

-- ============================================================================
-- 5) RLS — do sdílených dat vidí/píše jen člen dané rodiny
-- ============================================================================
alter table public.shared_pantry_items   enable row level security;
alter table public.shared_shopping_items enable row level security;

-- pantry
drop policy if exists sp_select on public.shared_pantry_items;
create policy sp_select on public.shared_pantry_items
  for select using (public.is_member_of_family(family_id));
drop policy if exists sp_write on public.shared_pantry_items;
create policy sp_write on public.shared_pantry_items
  for all using (public.is_member_of_family(family_id))
          with check (public.is_member_of_family(family_id));

-- shopping
drop policy if exists ss_select on public.shared_shopping_items;
create policy ss_select on public.shared_shopping_items
  for select using (public.is_member_of_family(family_id));
drop policy if exists ss_write on public.shared_shopping_items;
create policy ss_write on public.shared_shopping_items
  for all using (public.is_member_of_family(family_id))
          with check (public.is_member_of_family(family_id));

-- ============================================================================
-- 6) Funkce: VYTVOŘIT rodinu (vrátí kód). Zakladatel se stane členem (owner).
-- ============================================================================
create or replace function public.create_family(family_name text default 'Naše domácnost')
returns table (family_id uuid, join_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  code text;
begin
  -- vygeneruj krátký čitelný kód SPIZ-XXXX (bez matoucích znaků)
  code := 'SPIZ-' || upper(substr(replace(encode(gen_random_bytes(4), 'hex'), '0', 'a'), 1, 4));

  insert into public.families (name, owner_id, join_code)
  values (coalesce(nullif(family_name, ''), 'Naše domácnost'), auth.uid(), code)
  returning id into new_id;

  insert into public.family_members (family_id, user_id, role)
  values (new_id, auth.uid(), 'owner')
  on conflict do nothing;

  return query select new_id, code;
end;
$$;

-- ============================================================================
-- 7) Funkce: PŘIPOJIT se k rodině pomocí kódu. Vrátí family_id (nebo chybu).
-- ============================================================================
create or replace function public.join_family(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
begin
  select id into fid from public.families where join_code = upper(trim(code));
  if fid is null then
    raise exception 'Neplatný kód rodiny';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (fid, auth.uid(), 'member')
  on conflict do nothing;

  return fid;
end;
$$;

-- Zpřístupni funkce přihlášeným uživatelům
grant execute on function public.create_family(text) to authenticated;
grant execute on function public.join_family(text) to authenticated;
grant execute on function public.is_member_of_family(uuid) to authenticated;

-- ============================================================================
-- HOTOVO. Po spuštění: appka může volat create_family / join_family
-- a číst/psát shared_pantry_items + shared_shopping_items.
-- ============================================================================
