import { getAllTrades } from "../../lib/sleeper";

export const dynamic = "force-dynamic";

function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TradesPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  if (!leagueId) {
    return (
      <main>
        <h1>Falta configurar SLEEPER_LEAGUE_ID</h1>
      </main>
    );
  }

  const trades = await getAllTrades(leagueId);

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

      <h1>🔁 Trades</h1>

      {trades.length === 0 && <p>Todavía no hay trades esta temporada.</p>}

      {trades.map((trade) => (
        <div
          key={trade.id}
          style={{
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ color: "#999", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Semana {trade.week} · {formatDate(trade.timestamp)}
          </div>

          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {trade.byTeam.map((team, i) => (
              <div key={i}>
                <strong>{team.teamName}</strong> recibió:
                <ul style={{ margin: "0.25rem 0" }}>
                  {team.received.length > 0 ? (
                    team.received.map((name, j) => <li key={j}>{name}</li>)
                  ) : (
                    <li>—</li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          {trade.draftPicksTraded.length > 0 && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>
              Picks intercambiados:{" "}
              {trade.draftPicksTraded
                .map(
                  (p) =>
                    `Ronda ${p.round} ${p.season} (${p.fromTeam} → ${p.toTeam})`
                )
                .join(", ")}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
