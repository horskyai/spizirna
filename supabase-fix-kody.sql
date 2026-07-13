-- ============================================================================
-- OPRAVA: gen_random_bytes (pgcrypto) neexistuje → generuj kód bez pgcrypto.
-- Přepisuje create_family i create_provozovna. Spustit v SQL Editoru → Run.
-- ============================================================================

-- Rodina: kód SPIZ-XXXX z md5(random) — bez pgcrypto, funguje vždy.
create or replace function public.create_family(family_name text default 'Naše domácnost')
returns table (family_id uuid, join_code text)
language plpgsql security definer set search_path = public as $$
declare new_id uuid; code text;
begin
  code := 'SPIZ-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
  insert into public.families (name, owner_id, join_code)
    values (coalesce(nullif(family_name,''),'Naše domácnost'), auth.uid(), code)
    returning id into new_id;
  insert into public.family_members (family_id, user_id, role)
    values (new_id, auth.uid(), 'owner') on conflict do nothing;
  return query select new_id, code;
end; $$;

-- Provozovna: kód PROV-XXXX z md5(random).
create or replace function public.create_provozovna(prov_name text default 'Moje provozovna')
returns table (provozovna_id uuid, join_code text)
language plpgsql security definer set search_path = public as $$
declare new_id uuid; code text;
begin
  code := 'PROV-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
  insert into public.provozovny (name, owner_id, join_code)
    values (coalesce(nullif(prov_name,''),'Moje provozovna'), auth.uid(), code)
    returning id into new_id;
  insert into public.provozovna_members (provozovna_id, user_id, role)
    values (new_id, auth.uid(), 'owner') on conflict do nothing;
  return query select new_id, code;
end; $$;
