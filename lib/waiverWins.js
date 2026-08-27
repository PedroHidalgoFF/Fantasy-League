// lib/waiverWins.js
// Encuentra los jugadores agregados por waiver/free agent que más puntos
// han dado a su equipo desde que fueron agregados.

import { getNFLState, getLeagueRosters, getLeagueUsers, getAllPlayers, getTransactions, getMatchups } from "./sleeper";

export async function getWaiverWireWins(leagueId) {
  const state = await getNFLState();
  const currentWeek = Math.max((state.week || 1) - 1, 1);
  const weeks = Array.from({ length: currentWeek }, (_, i) => i + 1);

  const [rosters, users, players] = await Promise.all([
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
    getAllPlayers(),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const teamNameByRosterId = Object.fromEntries(
    rosters.map((r) => {
      const user = userById[r.owner_id] || {};
      const teamName = user.metadata?.team_name || user.display_name || "Equipo sin nombre";
      return [r.roster_id, teamName];
    })
  );

  const [weeklyTransactions, weeklyMatchups] = await Promise.all([
    Promise.all(weeks.map((w) => getTransactions(leagueId, w).catch(() => []))),
    Promise.all(weeks.map((w) => getMatchups(leagueId, w).catch(() => []))),
  ]);

  // Índice rápido: semana -> roster_id -> matchup de ese equipo esa semana
  const matchupsByWeek = weeks.map((w, i) => {
    const map = {};
    for (const m of weeklyMatchups[i]) map[m.roster_id] = m;
    return map;
  });

  // Junta todos los adds por waiver o free agent
  const allAdds = [];
  weeklyTransactions.forEach((txs, idx) => {
    const week = weeks[idx];
    for (const t of txs) {
      if ((t.type === "waiver" || t.type === "free_agent") && t.status === "complete") {
        for (const [playerId, rosterId] of Object.entries(t.adds || {})) {
          allAdds.push({ playerId, rosterId, weekAdded: week });
        }
      }
    }
  });

  // Si un jugador fue agregado más de una vez (soltado y re-agregado),
  // nos quedamos con el add más antiguo para no duplicar.
  const uniqueAdds = new Map();
  for (const a of allAdds) {
    const key = `${a.playerId}-${a.rosterId}`;
    const existing = uniqueAdds.get(key);
    if (!existing || a.weekAdded < existing.weekAdded) {
      uniqueAdds.set(key, a);
    }
  }

  const results = [];
  for (const { playerId, rosterId, weekAdded } of uniqueAdds.values()) {
    let totalPoints = 0;
    for (let w = weekAdded; w <= currentWeek; w++) {
      const teamMatchup = matchupsByWeek[w - 1][rosterId];
      const pts = teamMatchup?.players_points?.[playerId];
      if (typeof pts === "number") totalPoints += pts;
    }

    const p = players[playerId];
    results.push({
      playerId,
      name: p ? `${p.first_name} ${p.last_name}` : `Jugador ${playerId}`,
      position: p?.position || "?",
      teamName: teamNameByRosterId[rosterId] || `Equipo ${rosterId}`,
      weekAdded,
      totalPoints: Math.round(totalPoints * 10) / 10,
    });
  }

  results.sort((a, b) => b.totalPoints - a.totalPoints);

  return results.slice(0, 10);
}
