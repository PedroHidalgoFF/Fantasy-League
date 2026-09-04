import { getStandings, getRegularSeasonState } from "../../lib/sleeper";
import { getBets, resolveBetOutcome } from "../../lib/bets";
import { getLeagueId } from "../../lib/session";
import { Handshake } from "lucide-react";
import BetForm from "../components/BetForm";

export const dynamic = "force-dynamic";

function BetCard({ bet }) {
  const { outcome } = bet;
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1.25rem",
        marginBottom: "1rem",
        background: "var(--surface)",
      }}
    >
      <div style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginBottom: "0.5rem" }}>
        Semana {bet.week}
        {bet.submitted_by ? ` · Propuesta por ${bet.submitted_by}` : ""}
      </div>
      <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>
        {bet.team_a_name} <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>vs</span> {bet.team_b_name}
      </div>
      <div style={{ color: "var(--text-soft)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>{bet.wager}</div>

      {!outcome && (
        <div style={{ color: "var(--text-faint)", fontSize: "0.82rem", fontWeight: 600 }}>Aún sin jugarse</div>
      )}
      {outcome && outcome.tie && (
        <div style={{ color: "#d97706", fontWeight: 700, fontSize: "0.85rem" }}>
          Empate — {outcome.pointsA.toFixed(1)} a {outcome.pointsB.toFixed(1)}
        </div>
      )}
      {outcome && !outcome.tie && (
        <div style={{ color: "var(--success)", fontWeight: 700, fontSize: "0.85rem" }}>
          🏆 Ganó {outcome.winnerName} ({outcome.pointsA.toFixed(1)}-{outcome.pointsB.toFixed(1)}) — {outcome.loserName}{" "}
          le debe: {bet.wager}
        </div>
      )}
    </div>
  );
}

export default async function BetsPage() {
  const leagueId = getLeagueId();

  if (!leagueId) {
    return (
      <main>
        <h1>Missing SLEEPER_LEAGUE_ID configuration</h1>
      </main>
    );
  }

  const [standings, approvedBets, { lastCompletedWeek }] = await Promise.all([
    getStandings(leagueId),
    getBets(leagueId, { status: "approved" }),
    getRegularSeasonState(),
  ]);

  const betsWithOutcome = await Promise.all(
    approvedBets.map(async (bet) => ({
      ...bet,
      outcome: bet.week <= lastCompletedWeek ? await resolveBetOutcome(leagueId, bet) : null,
    }))
  );

  const teamOptions = standings.map((t) => ({ rosterId: t.rosterId, teamName: t.teamName }));

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Handshake size={26} /> Apuestas
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0, marginBottom: "1.5rem" }}>
        Apuestas amistosas entre equipos. Propón una y el admin la aprueba (o la ajusta) antes de que aparezca aquí.
        El resultado se calcula solo con los puntos reales de esa semana.
      </p>

      <BetForm teams={teamOptions} currentWeek={Math.max(1, lastCompletedWeek + 1)} />

      <h2 style={{ marginTop: "2.5rem" }}>Apuestas activas</h2>
      {betsWithOutcome.length === 0 && (
        <p style={{ color: "var(--text-faint)", fontSize: "0.85rem" }}>Todavía no hay apuestas aprobadas.</p>
      )}
      {betsWithOutcome.map((bet) => (
        <BetCard key={bet.id} bet={bet} />
      ))}
    </main>
  );
}
