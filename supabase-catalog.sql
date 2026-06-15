-- ============================================================
-- Sdílený katalog produktů (komunitní databáze Spižírny)
-- Spustit v Supabase SQL editoru.
-- ============================================================

create table if not exists public.product_catalog (
  ean_code        text primary key,
  product_name    text not null,
  brand           text default '',
  category        text default '',
  subcategory     text default '',
  image_url       text default '',
  weight_g        numeric,
  volume_ml       numeric,
  pieces_count    numeric,
  unit            text default 'g',
  calories_kcal   numeric,
  protein_g       numeric,
  fat_g           numeric,
  saturated_fat_g numeric,
  carbs_g         numeric,
  sugar_g         numeric,
  fiber_g         numeric,
  salt_g          numeric,
  allergens       text[] default '{}',
  source          text default 'user_added',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Rychlé fulltextové hledání podle názvu (volitelné, pro budoucí vyhledávání)
create index if not exists product_catalog_name_idx
  on public.product_catalog using gin (to_tsvector('simple', product_name));

-- ============================================================
-- RLS: čtení i zápis pro kohokoliv (i anonymně, bez přihlášení).
-- Appka zatím nemá login, takže katalog plní rovnou anon klíč.
-- Zápis je "upsert" — kdokoliv může produkt přidat/aktualizovat.
-- Až přibude přihlašování, lze tyto politiky zúžit na 'authenticated'.
-- ============================================================
alter table public.product_catalog enable row level security;

drop policy if exists "catalog_read_all" on public.product_catalog;
create policy "catalog_read_all"
  on public.product_catalog for select
  using (true);

drop policy if exists "catalog_insert_anon" on public.product_catalog;
create policy "catalog_insert_anon"
  on public.product_catalog for insert
  to anon, authenticated
  with check (true);

drop policy if exists "catalog_update_anon" on public.product_catalog;
create policy "catalog_update_anon"
  on public.product_catalog for update
  to anon, authenticated
  using (true)
  with check (true);
