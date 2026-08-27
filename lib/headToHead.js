// lib/headToHead.js
// Recorre todas las semanas jugadas y arma el historial de enfrentamientos
// entre cada par de equipos que se han cruzado esta temporada.
//
// Nota: por ahora solo cubre la temporada actual. Sleeper permite encadenar
// temporadas anteriores vía "previous_league_id" si más adelante quieres
// historial multi-temporada (útil en ligas dinásticas o de varios años).

import { getRegularSeasonState, getLeagueRosters, getLeagueUsers, getMatchups } from "./sleeper";

export async function getHeadToHeadRecords(leagueId) {
  const { lastCompletedWeek } = await getRegularSeasonState();
  const weeks = Array.from({ length: lastCompletedWeek }, (_, i) => i + 1);

  const [rosters, users] = await Promise.all([
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const teamNameByRosterId = Object.fromEntries(
    rosters.map((r) => {
      const user = userById[r.owner_id] || {};
      const teamName = user.metadata?.team_name || user.display_name || "Equipo sin nombre";
      return [r.roster_id, teamName];
    })
  );

  const weeklyMatchups = await Promise.all(
    weeks.map((w) => getMatchups(leagueId, w).catch(() => []))
  );

  // rivalKey -> { teamAId, teamBId, teamAWins, teamBWins, ties, games: [] }
  const rivalries = {};

  weeklyMatchups.forEach((weekMatchups, idx) => {
    const week = weeks[idx];
    const byMatchupId = {};
    for (const m of weekMatchups) {
      if (!byMatchupId[m.matchup_id]) byMatchupId[m.matchup_id] = [];
      byMatchupId[m.matchup_id].push(m);
    }

    for (const pair of Object.values(byMatchupId)) {
      if (pair.length !== 2) continue;
      const [a, b] = pair;
      const key = [a.roster_id, b.roster_id].sort((x, y) => x - y).join("-");

      if (!rivalries[key]) {
        rivalries[key] = {
          teamAId: a.roster_id,
          teamBId: b.roster_id,
          teamAName: teamNameByRosterId[a.roster_id] || `Equipo ${a.roster_id}`,
          teamBName: teamNameByRosterId[b.roster_id] || `Equipo ${b.roster_id}`,
          teamAWins: 0,
          teamBWins: 0,
          ties: 0,
          games: [],
        };
      }

      const r = rivalries[key];
      const aScore = a.roster_id === r.teamAId ? a.points : b.points;
      const bScore = a.roster_id === r.teamAId ? b.points : a.points;

      if (aScore > bScore) r.teamAWins += 1;
      else if (bScore > aScore) r.teamBWins += 1;
      else r.ties += 1;

      r.games.push({ week, aScore, bScore });
    }
  });

  return Object.values(rivalries).sort((x, y) => y.games.length - x.games.length);
}
