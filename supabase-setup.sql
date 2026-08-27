-- Corre esto una sola vez en Supabase: Dashboard -> SQL Editor -> New query
-- pega esto completo y dale "Run".

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  page text not null,              -- 'home' | 'weekly-report'
  week int,                        -- número de semana (null para 'home')
  content text not null default '',
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

-- No exponemos esta tabla al navegador (solo se usa con la service role key
-- del lado del servidor), así que no hace falta configurar RLS para que
-- funcione el sitio. Si quieres bloquear aún más el acceso público por
-- defecto, puedes activar RLS sin agregar ninguna política:
alter table posts enable row level security;
