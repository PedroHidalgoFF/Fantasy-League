import { NextResponse } from "next/server";
import { setLeagueCookies } from "../../../../lib/session";

export async function POST(request) {
  const { leagueId, rosterId } = await request.json();

  if (!leagueId || !rosterId) {
    return NextResponse.json({ error: "Missing league or team" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  setLeagueCookies(response, String(leagueId), String(rosterId));
  return response;
}
