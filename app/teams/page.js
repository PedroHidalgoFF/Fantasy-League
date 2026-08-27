import { getStandings } from "../../lib/sleeper";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const standings = await getStandings(leagueId);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <nav style={{ marginBottom: "2rem" }}>
        <a href="/" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Inicio</a>
        <a href="/power-rankings" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Power Rankings</a>
        <a href="/trades" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Trades</a>
        <a href="/news" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Noticias</a>
        <a href="/teams" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Equipos</a>
        <a href="/bustboom" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Bust/Boom</a>
        <a href="/weekly-report" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Reporte Semanal</a>
        <a href="/head-to-head" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Head-to-Head</a>
        <a href="/waiver-wins" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Waiver Wins</a>
        <a href="/top-players" style={{ color: "var(--text)" }}>Top 300</a>
      </nav>

      <h1>👥 Equipos</h1>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {standings.map((team) => (
          <a
            key={team.rosterId}
            href={`/teams/${team.rosterId}`}
            style={{
              display: "block",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "1rem",
              color: "var(--text)",
              textDecoration: "none",
            }}
          >
            <strong>{team.teamName}</strong>
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {team.wins}-{team.losses}
              {team.ties ? `-${team.ties}` : ""} · {team.pointsFor.toFixed(1)} pts
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
