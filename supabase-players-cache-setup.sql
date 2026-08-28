-- Corre esto en Supabase: Dashboard -> SQL Editor -> New query -> pega y Run.
-- Es adicional a los otros SQL — corre los cuatro en total.

create table if not exists players_cache (
  id text primary key default 'sleeper_players',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table players_cache enable row level security;
