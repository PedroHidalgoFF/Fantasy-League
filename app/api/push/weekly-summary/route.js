import { NextResponse } from "next/server";
import { getWeeklyMatchupData } from "../../../../lib/sleeper";
import { getPublishedPost } from "../../../../lib/posts";
import { sendPushToAll } from "../../../../lib/push";

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leagueId = process.env.SLEEPER_LEAGUE_ID;
    const { week } = await getWeeklyMatchupData(leagueId);
    const post = await getPublishedPost("weekly-report", week).catch(() => null);

    const body = post?.content
      ? post.content.length > 100
        ? `${post.content.slice(0, 100)}…`
        : post.content
      : "This week's recap is ready — check out the results.";

    const result = await sendPushToAll({
      title: "Weekly Recap is here",
      body,
      url: "/weekly-report",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
