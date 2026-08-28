import { NextResponse } from "next/server";
import { getAllPlayers, getRegularSeasonState } from "../../../../lib/sleeper";
import { getSeasonStatBreakdown } from "../../../../lib/playerStats";
import { getPlayerImageUrl } from "../../../../lib/teamLogo";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);

  if (ids.length === 0) return NextResponse.json({ players: [] });

  try {
    const { season, lastCompletedWeek } = await getRegularSeasonState();
    const [players, breakdown] = await Promise.all([
      getAllPlayers(),
      getSeasonStatBreakdown(season, lastCompletedWeek),
    ]);

    const result = ids.map((id) => {
      const p = players[id];
      const stats = breakdown[id] || {};
      return {
        playerId: id,
        name: p ? `${p.first_name} ${p.last_name}` : `Player ${id}`,
        position: p?.position || "?",
        nflTeam: p?.team || "FA",
        image: getPlayerImageUrl(id, p?.position, p?.team),
        seasonPoints: stats.pts_ppr ?? 0,
        stats,
      };
    });

    return NextResponse.json({ players: result, week: lastCompletedWeek });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
