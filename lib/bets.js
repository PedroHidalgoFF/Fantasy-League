// lib/bets.js
// Apuestas amistosas entre dos equipos de la liga. La gente las propone
// desde /bets, quedan "pending" hasta que el admin las aprueba (o las
// ajusta) desde /admin, y el resultado se calcula solo comparando los
// puntos reales de esa semana entre los dos equipos — no se guarda un
// "ganador" fijo en la base de datos, así se mantiene correcto aunque los
// puntos de esa semana sigan cambiando.

import { getSupabase } from "./supabase";
import { getMatchups } from "./sleeper";

export async function submitBet({
  leagueId,
  week,
  teamARosterId,
  teamAName,
  teamBRosterId,
  teamBName,
  wager,
  submittedBy,
}) {
  const supabase = getSupabase();
  const { error } = await supabase.from("bets").insert({
    league_id: leagueId,
    week,
    team_a_roster_id: String(teamARosterId),
    team_a_name: teamAName,
    team_b_roster_id: String(teamBRosterId),
    team_b_name: teamBName,
    wager,
    submitted_by: submittedBy || null,
    status: "pending",
  });
  if (error) throw new Error(error.message);
}

export async function getBets(leagueId, { status = null } = {}) {
  const supabase = getSupabase();
  let query = supabase
    .from("bets")
    .select("*")
    .eq("league_id", leagueId)
    .order("week", { ascending: false })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error("Error leyendo apuestas:", error.message);
    return [];
  }
  return data || [];
}

export async function updateBet(id, updates) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("bets")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// Compara los puntos reales de los dos equipos en la semana de la apuesta.
// Devuelve null si esa semana todavía no tiene puntos reales (no se ha
// jugado, o el matchup no existe todavía).
export async function resolveBetOutcome(leagueId, bet) {
  try {
    const matchups = await getMatchups(leagueId, bet.week);
    const teamA = matchups.find((m) => String(m.roster_id) === String(bet.team_a_roster_id));
    const teamB = matchups.find((m) => String(m.roster_id) === String(bet.team_b_roster_id));
    if (!teamA || !teamB) return null;

    const pointsA = teamA.points || 0;
    const pointsB = teamB.points || 0;
    if (pointsA === 0 && pointsB === 0) return null;

    if (pointsA === pointsB) {
      return { tie: true, pointsA, pointsB };
    }

    const winnerIsA = pointsA > pointsB;
    return {
      tie: false,
      pointsA,
      pointsB,
      winnerName: winnerIsA ? bet.team_a_name : bet.team_b_name,
      loserName: winnerIsA ? bet.team_b_name : bet.team_a_name,
    };
  } catch (e) {
    console.error("Error resolviendo apuesta:", e.message);
    return null;
  }
}
