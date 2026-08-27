// lib/supabase.js
// Cliente de Supabase para leer/guardar los posts del editor. Usa la
// "service role key" (nunca la expongas al navegador, solo se usa aquí
// del lado del servidor) para poder escribir sin restricciones de RLS.

import { createClient } from "@supabase/supabase-js";

let client = null;

export function getSupabase() {
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return client;
}
