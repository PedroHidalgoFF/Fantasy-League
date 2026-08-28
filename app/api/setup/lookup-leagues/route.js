import { NextResponse } from "next/server";

const BASE_URL = "https://api.sleeper.app/v1";

export async function POST(request) {
  const { username } = await request.json();

  if (!username || !username.trim()) {
    return NextResponse.json({ error: "Enter a Sleeper username." }, { status: 400 });
  }

  try {
    const userRes = await fetch(`${BASE_URL}/user/${encodeURIComponent(username.trim())}`);
    if (!userRes.ok) {
      return NextResponse.json({ error: "Username not found on Sleeper." }, { status: 404 });
    }
    const user = await userRes.json();
    if (!user?.user_id) {
      return NextResponse.json({ error: "Username not found on Sleeper." }, { status: 404 });
    }

    // Buscamos ligas del año actual y del anterior (por si todavía no
    // empieza la temporada nueva o la liga sigue en pre-draft).
    const currentYear = new Date().getFullYear();
    const [thisYearLeagues, lastYearLeagues] = await Promise.all([
      fetch(`${BASE_URL}/user/${user.user_id}/leagues/nfl/${currentYear}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${BASE_URL}/user/${user.user_id}/leagues/nfl/${currentYear - 1}`).then((r) => (r.ok ? r.json() : [])),
    ]);

    const seen = new Set();
    const leagues = [...thisYearLeagues, ...lastYearLeagues]
      .filter((l) => {
        if (seen.has(l.league_id)) return false;
        seen.add(l.league_id);
        return true;
      })
      .map((l) => ({
        leagueId: l.league_id,
        name: l.name,
        season: l.season,
        avatar: l.avatar || null,
        status: l.status,
      }));

    return NextResponse.json({
      userId: user.user_id,
      displayName: user.display_name,
      avatar: user.avatar || null,
      leagues,
    });
  } catch (err) {
    return NextResponse.json({ error: "Couldn't reach Sleeper. Try again in a bit." }, { status: 500 });
  }
}
