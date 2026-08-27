// lib/powerRankingsBreakdown.js
import { getStandings, getLeagueRosters, getAllPlayers, getNFLState } from "./sleeper";
import { calculatePowerRankings } from "./powerRankings";
import { getSeasonPointsByPlayer } from "./seasonStats";

const SKILL_POSITIONS = ["QB", "RB", "WR", "TE"];

export async function getPowerRankingsWithBreakdown(leagueId) {
  const state = await getNFLState();
  const lastCompletedWeek = Math.max((state.week || 1) - 1, 0);

  const [standings, rosters, players, seasonPoints] = await Promise.all([
    getStandings(leagueId),
    getLeagueRosters(leagueId),
    getAllPlayers(),
    lastCompletedWeek > 0
      ? getSeasonPointsByPlayer(state.season, lastCompletedWeek)
      : Promise.resolve({}),
  ]);

  const rankings = calculatePowerRankings(standings);
  const rosterByRosterId = Object.fromEntries(rosters.map((r) => [r.roster_id, r]));

  return rankings.map((team) => {
    const roster = rosterByRosterId[team.rosterId];
    const breakdown = { QB: 0, RB: 0, WR: 0, TE: 0 };

    for (const playerId of roster?.players || []) {
      const pos = players[playerId]?.position;
      if (SKILL_POSITIONS.includes(pos)) {
        breakdown[pos] += seasonPoints[playerId] || 0;
      }
    }

    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const segments = SKILL_POSITIONS.map((pos) => ({
      position: pos,
      points: Math.round(breakdown[pos] * 10) / 10,
      pct: total > 0 ? (breakdown[pos] / total) * 100 : 25,
    }));

    return { ...team, segments, totalSkillPoints: Math.round(total * 10) / 10 };
  });
}
