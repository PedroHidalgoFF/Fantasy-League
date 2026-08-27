import { NextResponse } from "next/server";

const ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const seasontype = searchParams.get("seasontype"); // 1=pre, 2=regular, 3=post
  const week = searchParams.get("week");

  let url = ESPN_SCOREBOARD_URL;
  if (year && seasontype && week) {
    url += `?dates=${year}&seasontype=${seasontype}&week=${week}`;
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "ESPN unavailable" }, { status: 502 });
    }
    const data = await res.json();

    const games = (data.events || []).map((event) => {
      const competition = event.competitions?.[0];
      const competitors = competition?.competitors || [];
      const home = competitors.find((c) => c.homeAway === "home");
      const away = competitors.find((c) => c.homeAway === "away");
      const status = event.status || {};
      const situation = competition?.situation;
      const broadcast = competition?.broadcasts?.[0]?.names?.[0] || null;

      const mapTeam = (c) => ({
        name: c?.team?.shortDisplayName || c?.team?.displayName || "TBD",
        abbreviation: c?.team?.abbreviation || "",
        logo: c?.team?.logo || null,
        score: c?.score ?? null,
        record: c?.records?.find((r) => r.type === "total")?.summary || null,
        winner: c?.winner || false,
        hasPossession: situation?.possession === c?.id,
      });

      return {
        id: event.id,
        date: event.date,
        home: mapTeam(home),
        away: mapTeam(away),
        state: status.type?.state || "pre", // "pre" | "in" | "post"
        statusText: status.type?.shortDetail || "",
        downDistance: situation?.shortDownDistanceText || null,
        completed: status.type?.completed || false,
        broadcast,
      };
    });

    return NextResponse.json({
      games,
      updatedAt: Date.now(),
      meta: {
        week: data.week?.number || null,
        seasonType: data.season?.type || null,
        year: data.season?.year || null,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}
