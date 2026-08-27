import { getHeadToHeadRecords } from "../../lib/headToHead";

export const dynamic = "force-dynamic";

export default async function HeadToHeadPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const rivalries = await getHeadToHeadRecords(leagueId);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>

      <h1>⚔️ Head-to-Head</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Historial de enfrentamientos entre cada par de equipos esta temporada.
        Como apenas empieza el año, la mayoría va a mostrar solo 1 juego —
        esto va creciendo conforme se repitan los cruces.
      </p>

      {rivalries.length === 0 && (
        <p style={{ marginTop: "1.5rem" }}>Todavía no hay enfrentamientos registrados.</p>
      )}

      {rivalries.map((r, i) => (
        <div
          key={i}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>
              {r.teamAName} vs {r.teamBName}
            </strong>
            <span style={{ color: "var(--text-muted)" }}>
              {r.teamAWins}-{r.teamBWins}
              {r.ties ? `-${r.ties}` : ""}
            </span>
          </div>

          <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-soft)" }}>
            {r.games.map((g, j) => (
              <div key={j}>
                Semana {g.week}: {g.aScore.toFixed(1)} - {g.bScore.toFixed(1)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
