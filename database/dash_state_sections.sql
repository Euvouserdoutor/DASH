-- DASH only. Apply in a dedicated Supabase project for this repository.
-- No existing tables or user data are altered by these statements.
create table if not exists public.dash_state_sections (
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null check (section in ('portfolio','alerts','watchlist','settings')),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, section),
  constraint dash_state_payload_kind check (
    (section = 'settings' and jsonb_typeof(payload) = 'object')
    or (section <> 'settings' and jsonb_typeof(payload) = 'array')
  ),
  constraint dash_state_payload_size check (pg_column_size(payload) <= 262144)
);

alter table public.dash_state_sections enable row level security;
revoke all on table public.dash_state_sections from public, anon, authenticated;
grant select, insert, update on table public.dash_state_sections to authenticated;

create policy "dash_own_state_select" on public.dash_state_sections
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "dash_own_state_insert" on public.dash_state_sections
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "dash_own_state_update" on public.dash_state_sections
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

comment on table public.dash_state_sections is
  'DASH app authenticated state; data scoped to Supabase Auth user_id';
