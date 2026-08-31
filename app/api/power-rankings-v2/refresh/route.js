import { NextResponse } from "next/server";
import { computePowerRankingsV2 } from "../../../../lib/powerRankingsV2";
import { saveCachedPowerRankingsV2 } from "../../../../lib/powerRankingsV2Cache";

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  if (!leagueId) {
    return NextResponse.json({ error: "SLEEPER_LEAGUE_ID not configured" }, { status: 500 });
  }

  try {
    const result = await computePowerRankingsV2(leagueId);
    await saveCachedPowerRankingsV2(leagueId, result);

    return NextResponse.json({
      ok: true,
      teamsRanked: result.rankings.length,
      methodUsed: result.methodUsed,
    });
  } catch (err) {
    console.error("[power-rankings-v2 refresh] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
