-- ============================================================================
-- Rodina: limit MAX 2 lidi. join_family odmítne 3. člena.
-- (Jen zakladatel má kód — v UI; DB navíc hlídá počet členů.)
-- Spustit v SQL Editoru → Run.
-- ============================================================================
create or replace function public.join_family(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid; pocet int;
begin
  select id into fid from public.families where join_code = upper(trim(code));
  if fid is null then raise exception 'Neplatný kód rodiny'; end if;

  -- Už jsem členem? (opakované připojení nevadí)
  if exists (select 1 from public.family_members where family_id = fid and user_id = auth.uid()) then
    return fid;
  end if;

  -- Limit 2 lidi — když jsou už 2, odmítni.
  select count(*) into pocet from public.family_members where family_id = fid;
  if pocet >= 2 then
    raise exception 'Rodina je plná (max 2 členové). Pro více je potřeba předplatné.';
  end if;

  insert into public.family_members (family_id, user_id, role)
    values (fid, auth.uid(), 'member') on conflict do nothing;
  return fid;
end; $$;
