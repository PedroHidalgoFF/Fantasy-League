import { getWeeklyMatchupData } from "../../lib/sleeper";
import { getBustBoom } from "../../lib/bustboom";

export const dynamic = "force-dynamic";

function PlayerRow({ p }) {
  const diffColor = p.diff >= 0 ? "var(--success)" : "var(--danger)";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border-soft)",
        padding: "0.5rem 0",
      }}
    >
      <div>
        <strong>{p.name}</strong>{" "}
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          {p.position} · {p.teamName}
        </span>
      </div>
      <div style={{ textAlign: "right" }}>
        <div>
          {p.actual} pts <span style={{ color: "var(--text-muted)" }}>(proy. {p.projected})</span>
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

      <h1>💥 Bust/Boom · Semana {week}</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Compara puntos reales vs. proyectados de tus titulares. Formato PPR.
      </p>

      {booms.length === 0 && busts.length === 0 && (
        <p>Todavía no hay suficientes datos de esta semana. Vuelve más tarde.</p>
      )}

      {booms.length > 0 && (
        <>
          <h2 style={{ marginTop: "2rem", color: "var(--success)" }}>🚀 Booms</h2>
          {booms.map((p) => (
            <PlayerRow key={p.playerId} p={p} />
          ))}
        </>
      )}

      {busts.length > 0 && (
        <>
          <h2 style={{ marginTop: "2rem", color: "var(--danger)" }}>📉 Busts</h2>
          {busts.map((p) => (
            <PlayerRow key={p.playerId} p={p} />
          ))}
        </>
      )}
    </main>
  );
}
