// lib/matchupForecast.js
// Suma las proyecciones reales (por jugador, de Sleeper) de los titulares de
// cada equipo para la semana actual, y con eso calcula un "% de ganar"
// aproximado. No es el algoritmo exacto de Sleeper (ese no es público),
// pero usa los mismos datos de proyección que ellos.

import { getRegularSeasonState, getLeagueRosters, getLeagueUsers, getMatchups } from "./sleeper";
import { getWeekProjectionsByPlayer } from "./seasonStats";

export async function getUpcomingMatchupForecasts(leagueId) {
  const { season, week } = await getRegularSeasonState();

  const [rosters, users, matchups, projections] = await Promise.all([
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
    getMatchups(leagueId, week).catch(() => []),
    getWeekProjectionsByPlayer(season, week),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const rosterById = Object.fromEntries(rosters.map((r) => [r.roster_id, r]));

  const teamInfo = (rosterId) => {
    const roster = rosterById[rosterId];
    const user = userById[roster?.owner_id] || {};
    const settings = roster?.settings || {};
    return {
      teamName: user.metadata?.team_name || user.display_name || `Team ${rosterId}`,
      handle: user.display_name || null,
      avatar: user.avatar || null,
      wins: settings.wins ?? 0,
      losses: settings.losses ?? 0,
      ties: settings.ties ?? 0,
    };
  };

  const projectedTotal = (matchup) => {
    const starters = (matchup.starters || []).filter((id) => id && id !== "0");
    return starters.reduce((sum, id) => sum + (projections[id] || 0), 0);
  };

  const byMatchupId = {};
  for (const m of matchups) {
    if (!byMatchupId[m.matchup_id]) byMatchupId[m.matchup_id] = [];
    byMatchupId[m.matchup_id].push(m);
  }

  const forecasts = Object.values(byMatchupId)
    .filter((pair) => pair.length === 2)
    .map(([a, b]) => {
      const projA = Math.round(projectedTotal(a) * 10) / 10;
      const projB = Math.round(projectedTotal(b) * 10) / 10;
      const total = projA + projB;
      const winPctA = total > 0 ? Math.round((projA / total) * 100) : 50;
      const winPctB = 100 - winPctA;

      return {
        teamA: { ...teamInfo(a.roster_id), projected: projA, winPct: winPctA },
        teamB: { ...teamInfo(b.roster_id), projected: projB, winPct: winPctB },
      };
    });

  return { week, forecasts };
}
