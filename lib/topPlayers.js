// lib/topPlayers.js
// Usa el campo "search_rank" que Sleeper trae en cada jugador (su ranking
// interno de relevancia fantasy, funciona como proxy de ADP) para armar
// un top 300, y cruza con los rosters de tu liga para ver quién lo tiene,
// más sus puntos acumulados en la temporada y la proyección de la próxima semana.

import { getAllPlayers, getLeagueRosters, getLeagueUsers, getRegularSeasonState } from "./sleeper";
import { getSeasonPointsByPlayer, getWeekProjectionsByPlayer } from "./seasonStats";

const FANTASY_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

export async function getTopPlayers(leagueId, limit = 300) {
  const { season, week: nextWeek, lastCompletedWeek } = await getRegularSeasonState();

  const [players, rosters, users, seasonPoints, nextWeekProjections] = await Promise.all([
    getAllPlayers(),
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
    lastCompletedWeek > 0 ? getSeasonPointsByPlayer(season, lastCompletedWeek) : Promise.resolve({}),
    getWeekProjectionsByPlayer(season, nextWeek),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const teamNameByRosterId = Object.fromEntries(
    rosters.map((r) => {
      const user = userById[r.owner_id] || {};
      const teamName = user.metadata?.team_name || user.display_name || "Equipo sin nombre";
      return [r.roster_id, teamName];
    })
  );

  const ownerByPlayerId = {};
  for (const roster of rosters) {
    for (const playerId of roster.players || []) {
      ownerByPlayerId[playerId] = teamNameByRosterId[roster.roster_id];
    }
  }

  const ranked = Object.entries(players)
    .filter(([, p]) => {
      if (typeof p.search_rank !== "number") return false;
      if (!p.fantasy_positions?.some((pos) => FANTASY_POSITIONS.includes(pos))) return false;
      return true;
    })
    .map(([playerId, p]) => ({
      playerId,
      name: `${p.first_name} ${p.last_name}`,
      position: p.position || "?",
      nflTeam: p.team || "FA",
      rank: p.search_rank,
      leagueOwner: ownerByPlayerId[playerId] || null,
      seasonPoints: seasonPoints[playerId] ?? 0,
      nextGameProjection: nextWeekProjections[playerId] ?? null,
      injuryStatus: p.injury_status || null,
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit);

  return { players: ranked, nextWeek };
}
