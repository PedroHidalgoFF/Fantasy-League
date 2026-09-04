import { NextResponse } from "next/server";
import { getBets, getBetById, updateBet } from "../../../../lib/bets";
import { getLeagueId } from "../../../../lib/session";
import { sendPushToAll } from "../../../../lib/push";

// Esta ruta vive bajo /api/admin/, así que el middleware ya la protege con
// la sesión de admin — no hace falta repetir esa verificación aquí.

export async function GET() {
  const leagueId = getLeagueId();
  const bets = await getBets(leagueId);
  return NextResponse.json({ bets });
}

export async function POST(request) {
  const { id, status, wager, week, adminNote } = await request.json();
  if (!id || !status) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const updates = { status };
  if (wager !== undefined && wager !== null) updates.wager = wager;
  if (week !== undefined && week !== null) updates.week = Number(week);
  if (adminNote !== undefined) updates.admin_note = adminNote;

  try {
    await updateBet(id, updates);

    if (status === "approved") {
      try {
        const bet = await getBetById(id);
        if (bet) {
          await sendPushToAll({
            title: "We have a new bet MFs!! 😤",
            body: `${bet.team_a_name} vs ${bet.team_b_name} — entra para saber qué apostaron`,
            url: "/bets",
          });
        }
      } catch (e) {
        console.error("Error mandando push de apuesta:", e.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
