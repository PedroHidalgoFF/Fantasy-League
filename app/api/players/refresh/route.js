import { NextResponse } from "next/server";
import { refreshPlayersCache } from "../../../../lib/playersCache";

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshPlayersCache();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
