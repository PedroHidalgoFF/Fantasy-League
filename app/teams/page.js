import { getStandings } from "../../lib/sleeper";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const standings = await getStandings(leagueId);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>

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
