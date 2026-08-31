// lib/powerRankingsV2.js
//
// Power Rankings basados en la CALIDAD de roster (no en récord), usando el
// campo "search_rank" que Sleeper ya trae en su diccionario de jugadores —
// el mismo dato que usamos en Top 300 y en el buscador de Player Stats.
//
// ANTES esto usaba un endpoint no-oficial de ESPN, pero resultó no ser
// confiable (devolvía 0 jugadores emparejados en producción). search_rank
// es mucho más simple y ya sabemos que funciona: no depende de ningún
// servicio externo, ya está cacheado en Supabase, y sirve como proxy de
// ADP/relevancia igual de bien.
//
// METODOLOGÍA:
//   1. Por posición (QB/RB/WR/TE), ordenamos a TODOS los jugadores
//      relevantes por su search_rank (menor = mejor) y lo convertimos a un
//      percentil (0 a 1, donde 1 es el mejor de su posición).
//   2. Por equipo: promediamos el percentil de los titulares en cada
//      posición, más un 5to valor de BANCA (mejor percentil entre
//      suplentes, refleja profundidad).
//   3. Promedio ponderado de esas 5 categorías = Power Score.

import { getAllPlayers, getLeagueRosters, getLeagueUsers } from "./sleeper";

const WEIGHTS = { QB: 0.2, RB: 0.25, WR: 0.25, TE: 0.15, BENCH: 0.15 };
const SKILL_POSITIONS = ["QB", "RB", "WR", "TE"];

// playerId -> percentil (1 = mejor de su posición, 0 = el peor)
function buildPositionalPercentiles(players) {
  const byPosition = {};
  for (const [playerId, p] of Object.entries(players)) {
    if (typeof p.search_rank !== "number") continue;
    if (!SKILL_POSITIONS.includes(p.position)) continue;
    if (!byPosition[p.position]) byPosition[p.position] = [];
    byPosition[p.position].push({ playerId, rank: p.search_rank });
  }

  const percentileByPlayerId = {};
  Object.entries(byPosition).forEach(([, list]) => {
    list.sort((a, b) => a.rank - b.rank); // menor search_rank = mejor
    const n = list.length;
    list.forEach((entry, index) => {
      const percentile = n > 1 ? 1 - index / (n - 1) : 1;
      percentileByPlayerId[entry.playerId] = Math.round(percentile * 1000) / 1000;
    });
  });

  return percentileByPlayerId;
}

export async function computePowerRankingsV2(leagueId) {
  const [players, rosters, users] = await Promise.all([
    getAllPlayers(),
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
  ]);

  const percentileByPlayerId = buildPositionalPercentiles(players);
  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));

  const rankings = rosters.map((roster) => {
    const user = userById[roster.owner_id] || {};
    const teamName = user.metadata?.team_name || user.display_name || `Team ${roster.roster_id}`;

    const starterIds = (roster.starters || []).filter((id) => id && id !== "0");
    const allIds = roster.players || [];
    const benchIds = allIds.filter((id) => !starterIds.includes(id));

    const byPosition = { QB: [], RB: [], WR: [], TE: [] };
    starterIds.forEach((id) => {
      const pos = players[id]?.position;
      if (byPosition[pos] && percentileByPlayerId[id] != null) {
        byPosition[pos].push(percentileByPlayerId[id]);
      }
    });

    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    const categoryScores = {
      QB: avg(byPosition.QB),
      RB: avg(byPosition.RB),
      WR: avg(byPosition.WR),
      TE: avg(byPosition.TE),
    };

    const benchPercentiles = benchIds
      .map((id) => (SKILL_POSITIONS.includes(players[id]?.position) ? percentileByPlayerId[id] : null))
      .filter((pct) => pct != null);
    categoryScores.BENCH = benchPercentiles.length ? Math.max(...benchPercentiles) : null;

    let weightedSum = 0;
    let weightUsed = 0;
    Object.entries(WEIGHTS).forEach(([category, weight]) => {
      const score = categoryScores[category];
      if (score == null) return;
      weightedSum += score * weight;
      weightUsed += weight;
    });

    const powerScore = weightUsed > 0 ? Math.round((weightedSum / weightUsed) * 1000) / 1000 : 0;

    return {
      rosterId: roster.roster_id,
      teamName,
      avatar: user.avatar || null,
      powerScore,
      categoryScores,
    };
  });

  rankings.sort((a, b) => b.powerScore - a.powerScore);
  rankings.forEach((r, i) => (r.rank = i + 1));

  return {
    rankings,
    unmatchedPlayers: [],
    computedAt: new Date().toISOString(),
    methodUsed: "sleeper_search_rank",
  };
}
