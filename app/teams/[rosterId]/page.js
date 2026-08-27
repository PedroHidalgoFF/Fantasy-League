import { getTeamProfile } from "../../../lib/sleeper";

export const dynamic = "force-dynamic";

function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TeamProfilePage({ params }) {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const team = await getTeamProfile(leagueId, params.rosterId);

  if (!team) {
    return (
      <main style={{ maxWidth: 800, margin: "0 auto" }}>
        <p>No se encontró ese equipo.</p>
        <a href="/teams" style={{ color: "var(--accent)" }}>Volver a Equipos</a>
      </main>
    );
  }

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

      <a href="/teams" style={{ color: "var(--accent)", fontSize: "0.85rem" }}>← Todos los equipos</a>

      <h1 style={{ marginTop: "0.5rem" }}>{team.teamName}</h1>
      <p style={{ color: "var(--text-muted)" }}>
        Récord: {team.wins}-{team.losses}
        {team.ties ? `-${team.ties}` : ""} · {team.pointsFor.toFixed(1)} pts a favor ·{" "}
        {team.pointsAgainst.toFixed(1)} pts en contra
      </p>

      <h2 style={{ marginTop: "2rem" }}>Roster actual</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "0.5rem" }}>Jugador</th>
            <th style={{ padding: "0.5rem" }}>Pos</th>
            <th style={{ padding: "0.5rem" }}>Equipo NFL</th>
          </tr>
        </thead>
        <tbody>
          {team.players.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <td style={{ padding: "0.5rem" }}>{p.name}</td>
              <td style={{ padding: "0.5rem" }}>{p.position}</td>
              <td style={{ padding: "0.5rem" }}>{p.team}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "2rem" }}>Historial de trades</h2>
      {team.trades.length === 0 && <p>Este equipo no ha hecho trades esta temporada.</p>}
      {team.trades.map((trade) => (
        <div
          key={trade.id}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Semana {trade.week} · {formatDate(trade.timestamp)}
          </div>
          {trade.byTeam.map((t, i) => (
            <div key={i} style={{ fontSize: "0.9rem" }}>
              <strong>{t.teamName}</strong> recibió: {t.received.join(", ") || "—"}
            </div>
          ))}
        </div>
      ))}
    </main>
  );
}
