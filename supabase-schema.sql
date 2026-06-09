-- =============================================
-- SPIŽÍRNA — databázové schéma
-- Spusť v Supabase → SQL Editor
-- =============================================

-- Profily uživatelů
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  plan text default 'free' check (plan in ('free', 'basic', 'family')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now()
);

-- Rodiny (skupiny)
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Členové rodiny
create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique(family_id, user_id)
);

-- Spižírna (pantry items)
create table if not exists pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  family_id uuid references families(id) on delete cascade,
  product_name text not null,
  brand text,
  ean_code text,
  image_url text,
  calories_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  quantity numeric not null default 1,
  unit text not null default 'ks',
  location text not null default 'spiz' check (location in ('lednice','mrazak','spiz','linka')),
  expires_at date,
  price_paid numeric,
  store text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Nákupní seznam
create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  family_id uuid references families(id) on delete cascade,
  name text not null,
  quantity numeric default 1,
  unit text default 'ks',
  checked boolean default false,
  recipe_id uuid,
  recipe_name text,
  created_at timestamptz default now()
);

-- Recepty (uživatelské — defaultní jsou v kódu)
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  family_id uuid references families(id) on delete cascade,
  name text not null,
  description text,
  category text,
  servings integer default 4,
  prep_time_min integer default 0,
  cook_time_min integer default 30,
  tags text[] default '{}',
  calories_per_serving numeric,
  ingredients jsonb default '[]',
  instructions text[] default '{}',
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table profiles enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table pantry_items enable row level security;
alter table shopping_items enable row level security;
alter table recipes enable row level security;

-- Profily: každý vidí jen svůj
create policy "profiles_self" on profiles
  for all using (auth.uid() = id);

-- Rodiny: vidí owner a členové
create policy "families_member" on families
  for all using (
    owner_id = auth.uid() or
    id in (select family_id from family_members where user_id = auth.uid())
  );

-- Členové rodiny
create policy "family_members_view" on family_members
  for all using (
    user_id = auth.uid() or
    family_id in (select id from families where owner_id = auth.uid())
  );

-- Spižírna: vlastní položky NEBO rodinné
create policy "pantry_own_or_family" on pantry_items
  for all using (
    user_id = auth.uid() or
    family_id in (select family_id from family_members where user_id = auth.uid())
  );

-- Nákupní seznam: vlastní NEBO rodinný
create policy "shopping_own_or_family" on shopping_items
  for all using (
    user_id = auth.uid() or
    family_id in (select family_id from family_members where user_id = auth.uid())
  );

-- Recepty: vlastní NEBO rodinné
create policy "recipes_own_or_family" on recipes
  for all using (
    user_id = auth.uid() or
    family_id in (select family_id from family_members where user_id = auth.uid())
  );

-- =============================================
-- Automatické vytvoření profilu po registraci
-- =============================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Realtime pro spižírnu a nákupní seznam (pro rodinný mód)
alter publication supabase_realtime add table pantry_items;
alter publication supabase_realtime add table shopping_items;
