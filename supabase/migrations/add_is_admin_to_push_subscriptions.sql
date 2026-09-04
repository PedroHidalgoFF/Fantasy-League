-- Corre esto UNA VEZ en el SQL Editor de Supabase (además de
-- create_bets_table.sql). Agrega una bandera para distinguir tu propia
-- suscripción (la que activas desde /admin) de las del resto de la liga,
-- así se puede mandar un push de prueba solo a ti sin molestar a nadie más.

alter table push_subscriptions
  add column if not exists is_admin boolean not null default false;
