// lib/weeklyReportStats.js
//
// Dos estadísticas nuevas para el Reporte Semanal:
//
//   1) BEST/WORST COACH
//      Compara el lineup titular de esta semana vs. la semana pasada y mide
//      si los cambios (swaps) que hizo cada manager sumaron o restaron
//      puntos, usando los puntos reales de ESTA semana.
//
//   2) PRIME PLAYERS / SHIT PLAYERS / WIRE TARGETS
//      Compara puntos REALES vs. proyectados de Sleeper, uno por posición:
//        - Prime Players: en tu liga, quién MÁS superó su proyección.
//        - Shit Players: en tu liga, quién MÁS quedó por debajo.
//        - Wire Targets: agentes libres que anotaron muy por encima de lo esperado.
//
// Reutiliza las funciones que ya usamos en el resto del sitio (rosters,
// usuarios, diccionario de jugadores) para no duplicar llamadas ni lógica,
// y devuelve todo ya listo para mostrar: nombres, fotos, equipos.

import { getLeagueRosters, getLeagueUsers, getAllPlayers, getMatchups } from "./sleeper";
import { getWeekProjectionsByPlayer, getWeekStatsByPlayer } from "./seasonStats";
import { getPlayerImageUrl } from "./teamLogo";

const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

function playerInfo(playerId, players) {
  const p = players[playerId];
  return {
    playerId,
    name: p ? `${p.first_name} ${p.last_name}` : `Player ${playerId}`,
    position: p?.position || "?",
    nflTeam: p?.team || "FA",
    image: getPlayerImageUrl(playerId, p?.position, p?.team),
  };
}

// ---------------------------------------------------------------------------
// 1) BEST / WORST COACH
// ---------------------------------------------------------------------------

async function computeCoachRatings(leagueId, week, players, teamByRosterId) {
  const [prevMatchups, currMatchups] = await Promise.all([
    getMatchups(leagueId, week - 1),
    getMatchups(leagueId, week),
  ]);

  const prevByRoster = Object.fromEntries(prevMatchups.map((m) => [m.roster_id, m]));

  const results = currMatchups.map((curr) => {
    const prev = prevByRoster[curr.roster_id];
    const team = teamByRosterId[curr.roster_id] || { teamName: `Team ${curr.roster_id}`, avatar: null };

    if (!prev) {
      return { rosterId: curr.roster_id, teamName: team.teamName, avatar: team.avatar, impact: 0, swappedIn: [], swappedOut: [] };
    }

    const prevStarters = new Set(prev.starters || []);
    const currStarters = new Set(curr.starters || []);

    const swappedOutIds = [...prevStarters].filter((p) => !currStarters.has(p));
    const swappedInIds = [...currStarters].filter((p) => !prevStarters.has(p));

    // players_points de ESTA semana incluye a todo el roster (titulares y banca)
    const pointsMap = curr.players_points || {};

    const pointsIn = swappedInIds.reduce((sum, id) => sum + (pointsMap[id] || 0), 0);
    const pointsOut = swappedOutIds.reduce((sum, id) => sum + (pointsMap[id] || 0), 0);

    return {
      rosterId: curr.roster_id,
      teamName: team.teamName,
      avatar: team.avatar,
      impact: Math.round((pointsIn - pointsOut) * 10) / 10,
      swappedIn: swappedInIds.map((id) => ({ ...playerInfo(id, players), points: pointsMap[id] || 0 })),
      swappedOut: swappedOutIds.map((id) => ({ ...playerInfo(id, players), points: pointsMap[id] || 0 })),
    };
  });

  results.sort((a, b) => b.impact - a.impact);
  return results;
}

async function getBestAndWorstCoach(leagueId, week, players, teamByRosterId) {
  if (week < 2) return { bestCoach: null, worstCoach: null };

  const ratings = await computeCoachRatings(leagueId, week, players, teamByRosterId);
  const withChanges = ratings.filter((r) => r.swappedIn.length > 0 || r.swappedOut.length > 0);

  if (withChanges.length === 0) return { bestCoach: null, worstCoach: null };

  return {
    bestCoach: withChanges[0],
    worstCoach: withChanges[withChanges.length - 1],
  };
}

// ---------------------------------------------------------------------------
// 2) PRIME PLAYERS / SHIT PLAYERS / WIRE TARGETS
// ---------------------------------------------------------------------------

async function getOwnedPlayerIds(leagueId) {
  const rosters = await getLeagueRosters(leagueId);
  const owned = new Set();
  rosters.forEach((r) => (r.players || []).forEach((id) => owned.add(id)));
  return owned;
}

async function getWeeklyStandouts(leagueId, season, week, players, minActualForWire = 8) {
  const [projByPlayer, statsByPlayer, ownedIds] = await Promise.all([
    getWeekProjectionsByPlayer(season, week),
    getWeekStatsByPlayer(season, week),
    getOwnedPlayerIds(leagueId),
  ]);

  const allIds = new Set([...Object.keys(projByPlayer), ...Object.keys(statsByPlayer)]);
  const allRecords = [];

  allIds.forEach((playerId) => {
    const projected = projByPlayer[playerId];
    const actual = statsByPlayer[playerId];
    if (projected == null || actual == null) return;

    const info = playerInfo(playerId, players);
    if (!POSITIONS.includes(info.position)) return;

    allRecords.push({
      ...info,
      actual,
      projected,
      diff: Math.round((actual - projected) * 10) / 10,
    });
  });

  const ownedRecords = allRecords.filter((r) => ownedIds.has(r.playerId));
  const freeAgentRecords = allRecords.filter((r) => !ownedIds.has(r.playerId));

  const bestPerPosition = (records, comparator) => {
    const result = {};
    POSITIONS.forEach((pos) => {
      const inPos = records.filter((r) => r.position === pos);
      if (inPos.length === 0) return;
      result[pos] = inPos.reduce((best, r) => (comparator(r, best) ? r : best));
    });
    return result;
  };

  const primePlayers = bestPerPosition(ownedRecords, (r, best) => r.diff > best.diff);
  const shitPlayers = bestPerPosition(ownedRecords, (r, best) => r.diff < best.diff);
  const wireTargets = bestPerPosition(
    freeAgentRecords.filter((r) => r.actual >= minActualForWire),
    (r, best) => r.diff > best.diff
  );

  return { primePlayers, shitPlayers, wireTargets };
}

// ---------------------------------------------------------------------------
// Punto de entrada único para el Reporte Semanal
// ---------------------------------------------------------------------------

export async function getWeeklyReportExtras(leagueId, season, week) {
  if (!season || !week || week < 1) {
    return { bestCoach: null, worstCoach: null, primePlayers: {}, shitPlayers: {}, wireTargets: {} };
  }

  const [players, rosters, users] = await Promise.all([
    getAllPlayers(),
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const teamByRosterId = Object.fromEntries(
    rosters.map((r) => {
      const user = userById[r.owner_id] || {};
      const teamName = user.metadata?.team_name || user.display_name || "Team";
      return [r.roster_id, { teamName, avatar: user.avatar || null }];
    })
  );

  const [coach, standouts] = await Promise.all([
    getBestAndWorstCoach(leagueId, week, players, teamByRosterId),
    getWeeklyStandouts(leagueId, season, week, players),
  ]);

  return {
    bestCoach: coach.bestCoach,
    worstCoach: coach.worstCoach,
    primePlayers: standouts.primePlayers,
    shitPlayers: standouts.shitPlayers,
    wireTargets: standouts.wireTargets,
  };
}
