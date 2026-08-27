import { getWeeklyMatchupData } from "../../lib/sleeper";
import { buildWeeklyReport } from "../../lib/weeklyReport";

export const dynamic = "force-dynamic";

function StatCard({ emoji, label, value, sub }) {
  return (
    <div
      style={{
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "1rem",
        flex: "1 1 200px",
      }}
    >
      <div style={{ fontSize: "1.5rem" }}>{emoji}</div>
      <div style={{ color: "#999", fontSize: "0.85rem", marginTop: "0.25rem" }}>{label}</div>
      <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginTop: "0.25rem" }}>{value}</div>
      {sub && <div style={{ color: "#999", fontSize: "0.8rem" }}>{sub}</div>}
    </div>
  );
}

export default async function WeeklyReportPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const { matchups, rosterTeamNames, week } = await getWeeklyMatchupData(leagueId);
  const report = buildWeeklyReport(matchups, rosterTeamNames);

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
        <a href="/waiver-wins" style={{ color: "#f1f1f1" }}>Waiver Wins</a>
      </nav>

      <h1>📋 Reporte Semanal · Semana {week}</h1>

      {report.pairs.length === 0 ? (
        <p>Todavía no hay resultados para esta semana.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            <StatCard
              emoji="🔥"
              label="Puntuación más alta"
              value={`${report.highScore.name}`}
              sub={`${report.highScore.points.toFixed(1)} pts`}
            />
            <StatCard
              emoji="🥶"
              label="Puntuación más baja"
              value={`${report.lowScore.name}`}
              sub={`${report.lowScore.points.toFixed(1)} pts`}
            />
            <StatCard
              emoji="🤏"
              label="Enfrentamiento más cerrado"
              value={`${report.closest.teamA.name} vs ${report.closest.teamB.name}`}
              sub={`Diferencia de ${report.closest.margin} pts`}
            />
            <StatCard
              emoji="💣"
              label="Mayor paliza"
              value={`${report.blowout.winner}`}
              sub={`Ganó por ${report.blowout.margin} pts`}
            />
          </div>

          <h2>Todos los enfrentamientos</h2>
          {report.pairs.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                border: "1px solid #222",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "0.5rem",
              }}
            >
              <div>{p.teamA.name}</div>
              <div style={{ fontWeight: "bold" }}>
                {p.teamA.points.toFixed(1)} - {p.teamB.points.toFixed(1)}
              </div>
              <div>{p.teamB.name}</div>
            </div>
          ))}
        </>
      )}
    </main>
  );
}
