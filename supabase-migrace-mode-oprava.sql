-- =============================================
-- OPRAVA: "Database error saving new user" při registraci
-- Spusť v Supabase → SQL Editor
-- =============================================
-- Příčina: trigger vkládal app_mode i když byl prázdný string (''),
-- což neprošlo přes CHECK (mode in ('domacnost','provoz')) → registrace spadla.
-- Oprava: prázdný/neplatný režim ulož jako NULL (CHECK NULL povoluje),
-- a celé vkládání obal tak, aby registrace nikdy nespadla kvůli profilu.

create or replace function handle_new_user()
returns trigger as $$
declare
  v_mode text;
begin
  -- normalizace režimu: jen 'domacnost'/'provoz' projde, jinak NULL
  v_mode := nullif(new.raw_user_meta_data->>'app_mode', '');
  if v_mode is not null and v_mode not in ('domacnost', 'provoz') then
    v_mode := null;
  end if;

  insert into profiles (id, email, display_name, mode)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    v_mode
  );
  return new;
end;
$$ language plpgsql security definer;
