-- ============================================================================
-- Push notifikace: tabulka FCM tokenů (kam poslat push konkrétnímu uživateli).
-- Každé zařízení uživatele má token; při změně sdílených dat pošleme push
-- ostatním členům rodiny/provozovny. Spustit v SQL Editoru → Run.
-- ============================================================================

create table if not exists public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  token       text not null,              -- FCM registrační token zařízení
  platform    text not null default 'android',
  updated_at  timestamptz not null default now(),
  unique (user_id, token)
);
create index if not exists idx_push_tokens_user on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;

-- Uživatel spravuje jen své tokeny.
drop policy if exists pt_select on public.push_tokens;
create policy pt_select on public.push_tokens
  for select using (user_id = auth.uid());
drop policy if exists pt_write on public.push_tokens;
create policy pt_write on public.push_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Edge Function (service_role) čte tokeny všech členů rodiny/provozu — service_role
-- RLS obchází, takže žádná extra policy pro čtení napříč uživateli není potřeba.
