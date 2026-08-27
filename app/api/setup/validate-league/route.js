import { NextResponse } from "next/server";
import { getLeague, getStandings } from "../../../../lib/sleeper";

export async function POST(request) {
  const { leagueId } = await request.json();

  if (!leagueId || !/^\d+$/.test(leagueId.trim())) {
    return NextResponse.json({ error: "That doesn't look like a valid Sleeper league ID." }, { status: 400 });
  }

  try {
    const [league, standings] = await Promise.all([
      getLeague(leagueId.trim()),
      getStandings(leagueId.trim()),
    ]);

    if (!league || league.error) {
      return NextResponse.json({ error: "League not found. Double-check the ID." }, { status: 404 });
    }

    return NextResponse.json({
      leagueName: league.name,
      season: league.season,
      teams: standings.map((t) => ({
        rosterId: t.rosterId,
        teamName: t.teamName,
        avatar: t.avatar,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: "Couldn't reach Sleeper. Try again in a bit." }, { status: 500 });
  }
}
