// lib/topPlayers.js
// Usa el campo "search_rank" que Sleeper trae en cada jugador (su ranking
// interno de relevancia fantasy, funciona como proxy de ADP) para armar
// un top 300, y cruza con los rosters de tu liga para ver quién lo tiene.

import { getAllPlayers, getLeagueRosters, getLeagueUsers } from "./sleeper";

const FANTASY_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

export async function getTopPlayers(leagueId, limit = 300) {
  const [players, rosters, users] = await Promise.all([
    getAllPlayers(),
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

  // playerId -> nombre del equipo de tu liga que lo tiene (si aplica)
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
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit);

  return ranked;
}
