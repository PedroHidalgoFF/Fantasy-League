import { getStandings } from "../../lib/sleeper";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const standings = await getStandings(leagueId);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <nav style={{ marginBottom: "2rem" }}>
        <a href="/" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Inicio</a>
        <a href="/trades" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Trades</a>
        <a href="/news" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Noticias</a>
        <a href="/teams" style={{ color: "#f1f1f1" }}>Equipos</a>
      </nav>

      <h1>👥 Equipos</h1>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {standings.map((team) => (
          <a
            key={team.rosterId}
            href={`/teams/${team.rosterId}`}
            style={{
              display: "block",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "1rem",
              color: "#f1f1f1",
              textDecoration: "none",
            }}
          >
            <strong>{team.teamName}</strong>
            <div style={{ color: "#999", fontSize: "0.9rem" }}>
              {team.wins}-{team.losses}
              {team.ties ? `-${team.ties}` : ""} · {team.pointsFor.toFixed(1)} pts
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
