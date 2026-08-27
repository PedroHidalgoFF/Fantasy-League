import { getWaiverWireWins } from "../../lib/waiverWins";

export const dynamic = "force-dynamic";

export default async function WaiverWinsPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const wins = await getWaiverWireWins(leagueId);

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

      <h1>🎯 Waiver Wire Wins</h1>
      <p style={{ color: "#999", fontSize: "0.85rem" }}>
        Jugadores agregados por waiver o free agent, ordenados por puntos totales
        acumulados desde que fueron agregados. Apenas empezando temporada, así que
        esta lista va a crecer con el tiempo.
      </p>

      {wins.length === 0 && (
        <p style={{ marginTop: "1.5rem" }}>
          Todavía no hay suficientes semanas para calcular esto. Vuelve pronto.
        </p>
      )}

      {wins.map((w, i) => (
        <div
          key={w.playerId}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            marginBottom: "0.5rem",
          }}
        >
          <div>
            <span style={{ color: "#999", marginRight: "0.5rem" }}>#{i + 1}</span>
            <strong>{w.name}</strong>{" "}
            <span style={{ color: "#999", fontSize: "0.85rem" }}>
              {w.position} · {w.teamName} · agregado semana {w.weekAdded}
            </span>
          </div>
          <div style={{ fontWeight: "bold" }}>{w.totalPoints} pts</div>
        </div>
      ))}
    </main>
  );
}
