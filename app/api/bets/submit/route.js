import { NextResponse } from "next/server";
import { submitBet } from "../../../../lib/bets";
import { getLeagueId } from "../../../../lib/session";

export async function POST(request) {
  const leagueId = getLeagueId();
  if (!leagueId) {
    return NextResponse.json({ error: "No hay liga configurada" }, { status: 400 });
  }

  const body = await request.json();
  const { week, teamARosterId, teamAName, teamBRosterId, teamBName, wager, submittedBy } = body;

  if (!week || !teamARosterId || !teamBRosterId || !teamAName || !teamBName || !wager) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }
  if (String(teamARosterId) === String(teamBRosterId)) {
    return NextResponse.json({ error: "Elige dos equipos distintos" }, { status: 400 });
  }

  try {
    await submitBet({
      leagueId,
      week: Number(week),
      teamARosterId,
      teamAName,
      teamBRosterId,
      teamBName,
      wager,
      submittedBy,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
