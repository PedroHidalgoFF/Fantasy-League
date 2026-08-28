-- Corre esto en Supabase: Dashboard -> SQL Editor -> New query -> pega y Run.
-- Es adicional a supabase-setup.sql (la tabla "posts") — corre ambos.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
