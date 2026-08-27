import { getWeeklyMatchupData } from "../../lib/sleeper";
import { getBustBoom } from "../../lib/bustboom";

export const dynamic = "force-dynamic";

function PlayerRow({ p }) {
  const diffColor = p.diff >= 0 ? "#4ade80" : "#f87171";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid #222",
        padding: "0.5rem 0",
      }}
    >
      <div>
        <strong>{p.name}</strong>{" "}
        <span style={{ color: "#999", fontSize: "0.85rem" }}>
          {p.position} · {p.teamName}
        </span>
      </div>
      <div style={{ textAlign: "right" }}>
        <div>
          {p.actual} pts <span style={{ color: "#999" }}>(proy. {p.projected})</span>
        </div>
        <div style={{ color: diffColor, fontWeight: "bold" }}>
          {p.diff >= 0 ? "+" : ""}
          {p.diff}
        </div>
      </div>
    </div>
  );
}

export default async function BustBoomPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  const { matchups, players, rosterTeamNames, week, season } =
    await getWeeklyMatchupData(leagueId);

  const { booms, busts } = await getBustBoom({
    leagueId,
    week,
    season,
    matchups,
    players,
    rosterTeamNames,
  });

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

      <h1>💥 Bust/Boom · Semana {week}</h1>
      <p style={{ color: "#999", fontSize: "0.85rem" }}>
        Compara puntos reales vs. proyectados de tus titulares. Formato PPR.
      </p>

      {booms.length === 0 && busts.length === 0 && (
        <p>Todavía no hay suficientes datos de esta semana. Vuelve más tarde.</p>
      )}

      {booms.length > 0 && (
        <>
          <h2 style={{ marginTop: "2rem", color: "#4ade80" }}>🚀 Booms</h2>
          {booms.map((p) => (
            <PlayerRow key={p.playerId} p={p} />
          ))}
        </>
      )}

      {busts.length > 0 && (
        <>
          <h2 style={{ marginTop: "2rem", color: "#f87171" }}>📉 Busts</h2>
          {busts.map((p) => (
            <PlayerRow key={p.playerId} p={p} />
          ))}
        </>
      )}
    </main>
  );
}
