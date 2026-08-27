import { getTeamProfile, getNFLState } from "../../../lib/sleeper";
import { getSeasonPointsByPlayer } from "../../../lib/seasonStats";
import { getPositionColor } from "../../../lib/positionBadge";
import TeamLogo from "../../components/TeamLogo";

export const dynamic = "force-dynamic";

function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("en-US", {
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
        <p>Team not found.</p>
        <a href="/teams" style={{ color: "var(--accent)" }}>Back to Teams</a>
      </main>
    );
  }

  const state = await getNFLState().catch(() => ({ week: 1, season: null }));
  const lastCompletedWeek = Math.max((state.week || 1) - 1, 0);
  const seasonPoints =
    lastCompletedWeek > 0 && state.season
      ? await getSeasonPointsByPlayer(state.season, lastCompletedWeek).catch(() => ({}))
      : {};

  // Ordenamos el roster por puntos de temporada, de mayor a menor
  const sortedPlayers = [...team.players].sort(
    (a, b) => (seasonPoints[b.id] || 0) - (seasonPoints[a.id] || 0)
  );

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <a href="/teams" style={{ color: "var(--accent)", fontSize: "0.85rem" }}>← All Teams</a>

      <h1 style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <TeamLogo avatar={team.avatar} teamName={team.teamName} size={32} />
        {team.teamName}
      </h1>
      <p style={{ color: "var(--text-muted)" }}>
        Record: {team.wins}-{team.losses}
        {team.ties ? `-${team.ties}` : ""} · {team.pointsFor.toFixed(1)} points for ·{" "}
        {team.pointsAgainst.toFixed(1)} points against
      </p>

      <h2 style={{ marginTop: "2rem" }}>Current Roster</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ padding: "0.5rem" }}></th>
            <th style={{ padding: "0.5rem" }}>Player</th>
            <th style={{ padding: "0.5rem" }}>Pos</th>
            <th style={{ padding: "0.5rem" }}>NFL Team</th>
            <th style={{ padding: "0.5rem" }}>Season Pts</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((p) => {
            const posColor = getPositionColor(p.position);
            return (
              <tr key={p.id}>
                <td style={{ padding: "0.5rem" }}>
                  <img
                    src={`https://sleepercdn.com/content/nfl/players/${p.id}.jpg`}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      objectFit: "cover",
                      background: "var(--border-soft)",
                      display: "block",
                    }}
                  />
                </td>
                <td style={{ padding: "0.5rem" }}>{p.name}</td>
                <td style={{ padding: "0.5rem" }}>
                  <span
                    style={{
                      background: posColor.bg,
                      color: posColor.color,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {p.position}
                  </span>
                </td>
                <td style={{ padding: "0.5rem", color: "var(--text-muted)" }}>{p.team}</td>
                <td style={{ padding: "0.5rem", fontWeight: 600 }}>
                  {Math.round((seasonPoints[p.id] || 0) * 10) / 10}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2 style={{ marginTop: "2rem" }}>Trade History</h2>
      {team.trades.length === 0 && <p>This team hasn't made any trades this season.</p>}
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
            Week {trade.week} · {formatDate(trade.timestamp)}
          </div>
          {trade.byTeam.map((t, i) => (
            <div key={i} style={{ fontSize: "0.9rem" }}>
              <strong>{t.teamName}</strong> received:{" "}
              {t.receives.map((p) => p.name).join(", ") || "—"}
            </div>
          ))}
        </div>
      ))}
    </main>
  );
}
