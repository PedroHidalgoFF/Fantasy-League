import { getTopPlayers } from "../../lib/topPlayers";

export const dynamic = "force-dynamic";

export default async function TopPlayersPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const topPlayers = await getTopPlayers(leagueId, 300);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <nav style={{ marginBottom: "2rem" }}>
        <a href="/" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Power Rankings</a>
        <a href="/trades" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Trades</a>
        <a href="/news" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Noticias</a>
        <a href="/teams" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Equipos</a>
        <a href="/bustboom" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Bust/Boom</a>
        <a href="/weekly-report" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Reporte Semanal</a>
        <a href="/head-to-head" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Head-to-Head</a>
        <a href="/waiver-wins" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Waiver Wins</a>
        <a href="/top-players" style={{ color: "#f1f1f1" }}>Top 300</a>
      </nav>

      <h1>⭐ Top 300 jugadores</h1>
      <p style={{ color: "#999", fontSize: "0.85rem" }}>
        Ordenados por relevancia fantasy (ranking interno de Sleeper). Se muestra el
        equipo de tu liga que lo tiene, o "Agente Libre" si nadie lo ha tomado.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
            <th style={{ padding: "0.4rem" }}>#</th>
            <th style={{ padding: "0.4rem" }}>Jugador</th>
            <th style={{ padding: "0.4rem" }}>Pos</th>
            <th style={{ padding: "0.4rem" }}>NFL</th>
            <th style={{ padding: "0.4rem" }}>En tu liga</th>
          </tr>
        </thead>
        <tbody>
          {topPlayers.map((p, i) => (
            <tr key={p.playerId} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "0.4rem" }}>{i + 1}</td>
              <td style={{ padding: "0.4rem" }}>{p.name}</td>
              <td style={{ padding: "0.4rem" }}>{p.position}</td>
              <td style={{ padding: "0.4rem" }}>{p.nflTeam}</td>
              <td
                style={{
                  padding: "0.4rem",
                  color: p.leagueOwner ? "#4ea1f3" : "#666",
                }}
              >
                {p.leagueOwner || "Agente Libre"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
