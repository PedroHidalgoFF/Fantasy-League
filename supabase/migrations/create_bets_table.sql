-- Corre esto UNA VEZ en el SQL Editor de tu proyecto de Supabase.
-- Igual que la tabla "posts" que ya tienes, esta tabla se lee/escribe
-- siempre desde el servidor con la service role key (lib/supabase.js),
-- así que no necesita políticas de RLS para funcionar con este sitio.

create table if not exists bets (
  id bigint generated always as identity primary key,
  league_id text not null,
  week int not null,
  team_a_roster_id text not null,
  team_a_name text not null,
  team_b_roster_id text not null,
  team_b_name text not null,
  wager text not null,
  submitted_by text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bets_league_week_idx on bets (league_id, week);
create index if not exists bets_league_status_idx on bets (league_id, status);
