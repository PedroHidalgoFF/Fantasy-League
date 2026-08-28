// lib/powerRankingsV2Cache.js
// Guarda el resultado de computePowerRankingsV2() en Supabase, para no
// tener que recalcularlo (y golpear el endpoint no-oficial de ESPN) en
// cada visita — solo se recalcula cuando corre el cron de refresh.

import { getSupabase } from "./supabase";

export async function getCachedPowerRankingsV2(leagueId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("power_rankings_v2_cache")
    .select("*")
    .eq("league_id", String(leagueId))
    .maybeSingle();

  if (error) {
    console.error("Error leyendo caché de Power Rankings v2:", error.message);
    return null;
  }
  return data;
}

export async function saveCachedPowerRankingsV2(leagueId, result) {
  const supabase = getSupabase();
  const payload = {
    league_id: String(leagueId),
    data: result,
    computed_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("power_rankings_v2_cache")
    .upsert(payload, { onConflict: "league_id" });

  if (error) throw new Error(error.message);
}
