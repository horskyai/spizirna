-- =============================================
-- MIGRACE: režim (domácnost/provoz) vázaný na účet
-- Spusť v Supabase → SQL Editor (jednorázově)
-- =============================================
-- Cíl: jeden e-mail = jeden režim. Režim se uloží k profilu při registraci
-- a nemění se. Při přihlášení appka načte režim z účtu (ne z telefonu).

-- 1) Přidat sloupec mode do profiles (pokud ještě není)
alter table profiles
  add column if not exists mode text check (mode in ('domacnost', 'provoz'));

-- 2) Upravit trigger, aby při registraci uložil i režim z metadat.
--    Režim appka pošle při signUp v options.data.app_mode.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, display_name, mode)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'app_mode'
  );
  return new;
end;
$$ language plpgsql security definer;

-- (trigger on_auth_user_created už existuje a volá tuto funkci — neměníme ho)
