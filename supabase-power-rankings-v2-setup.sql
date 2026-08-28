-- Corre esto en Supabase: Dashboard -> SQL Editor -> New query -> pega y Run.
-- Es adicional a supabase-setup.sql y supabase-push-setup.sql — corre los tres.

create table if not exists power_rankings_v2_cache (
  id uuid primary key default gen_random_uuid(),
  league_id text not null unique,
  data jsonb not null,
  computed_at timestamptz not null default now()
);

alter table power_rankings_v2_cache enable row level security;
