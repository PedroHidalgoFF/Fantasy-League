// lib/playersCache.js
// El diccionario completo de jugadores de Sleeper (~5MB) NO debe pedirse en
// cada visita — Sleeper pide explícitamente máximo 1 llamada al día a ese
// endpoint. Lo guardamos en Supabase y solo se refresca vía cron 1x/día.

import { getSupabase } from "./supabase";

const CACHE_ID = "sleeper_players";

export async function getCachedPlayers() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("players_cache")
    .select("data, updated_at")
    .eq("id", CACHE_ID)
    .maybeSingle();

  if (error) {
    console.error("Error leyendo caché de jugadores:", error.message);
    return null;
  }
  return data;
}

// Solo debe llamarse desde el cron protegido (1x/día) — nunca desde una
// página normal.
export async function refreshPlayersCache() {
  const res = await fetch("https://api.sleeper.app/v1/players/nfl");
  if (!res.ok) throw new Error(`Sleeper respondió ${res.status}`);
  const players = await res.json();

  const supabase = getSupabase();
  const { error } = await supabase
    .from("players_cache")
    .upsert(
      { id: CACHE_ID, data: players, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

  if (error) throw new Error(error.message);
  return { playerCount: Object.keys(players).length };
}
