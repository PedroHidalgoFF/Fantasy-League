import { getStandings } from "../lib/sleeper";
import { calculatePowerRankings } from "../lib/powerRankings";

// Esto hace que la página se regenere cuando GitHub Actions dispara un
// nuevo build (ver .github/workflows/rebuild.yml). No cachea entre builds.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  if (!leagueId) {
    return (
      <main>
        <h1>Falta configurar SLEEPER_LEAGUE_ID</h1>
        <p>Agrega la variable de entorno SLEEPER_LEAGUE_ID en Vercel con el ID de tu liga.</p>
      </main>
    );
  }

  const standings = await getStandings(leagueId);
  const powerRankings = calculatePowerRankings(standings);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <nav style={{ marginBottom: "2rem" }}>
        <a href="/" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Inicio</a>
        <a href="/trades" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Trades</a>
        <a href="/news" style={{ color: "#f1f1f1" }}>Noticias</a>
      </nav>

      <h1>🏈 Power Rankings</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "3rem" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
            <th style={{ padding: "0.5rem" }}>#</th>
            <th style={{ padding: "0.5rem" }}>Equipo</th>
            <th style={{ padding: "0.5rem" }}>Récord</th>
            <th style={{ padding: "0.5rem" }}>Power Score</th>
          </tr>
        </thead>
        <tbody>
          {powerRankings.map((team) => (
            <tr key={team.rosterId} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "0.5rem" }}>{team.rank}</td>
              <td style={{ padding: "0.5rem" }}>{team.teamName}</td>
              <td style={{ padding: "0.5rem" }}>
                {team.wins}-{team.losses}
                {team.ties ? `-${team.ties}` : ""}
              </td>
              <td style={{ padding: "0.5rem" }}>{team.powerScore}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h1>📊 Standings</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
            <th style={{ padding: "0.5rem" }}>Equipo</th>
            <th style={{ padding: "0.5rem" }}>Récord</th>
            <th style={{ padding: "0.5rem" }}>Puntos a favor</th>
            <th style={{ padding: "0.5rem" }}>Puntos en contra</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team) => (
            <tr key={team.rosterId} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "0.5rem" }}>{team.teamName}</td>
              <td style={{ padding: "0.5rem" }}>
                {team.wins}-{team.losses}
                {team.ties ? `-${team.ties}` : ""}
              </td>
              <td style={{ padding: "0.5rem" }}>{team.pointsFor.toFixed(1)}</td>
              <td style={{ padding: "0.5rem" }}>{team.pointsAgainst.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
