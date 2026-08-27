// lib/teamRoster.js
import { getLeagueRosters, getLeagueUsers, getAllPlayers } from "./sleeper";

function mapPlayer(id, players) {
  const p = players[id];
  return {
    playerId: id,
    name: p ? `${p.first_name} ${p.last_name}` : `Jugador ${id}`,
    position: p?.position || "?",
    nflTeam: p?.team || "FA",
  };
}

export async function getAllTeamsForSelector(leagueId) {
  const [rosters, users] = await Promise.all([getLeagueRosters(leagueId), getLeagueUsers(leagueId)]);
  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  return rosters
    .map((r) => {
      const user = userById[r.owner_id] || {};
      return {
        rosterId: r.roster_id,
        teamName: user.metadata?.team_name || user.display_name || "Equipo sin nombre",
      };
    })
    .sort((a, b) => a.teamName.localeCompare(b.teamName));
}

export async function getTeamRosterSplit(leagueId, rosterId) {
  const [rosters, users, players] = await Promise.all([
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
    getAllPlayers(),
  ]);

  const roster = rosters.find((r) => r.roster_id === Number(rosterId));
  if (!roster) return null;

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const user = userById[roster.owner_id] || {};
  const teamName = user.metadata?.team_name || user.display_name || "Equipo sin nombre";

  const starterIds = (roster.starters || []).filter((id) => id && id !== "0");
  const allIds = roster.players || [];
  const benchIds = allIds.filter((id) => !starterIds.includes(id));

  return {
    rosterId: roster.roster_id,
    teamName,
    avatar: user.avatar || null,
    starters: starterIds.map((id) => mapPlayer(id, players)),
    bench: benchIds.map((id) => mapPlayer(id, players)),
  };
}
