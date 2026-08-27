import { getStandings } from "../../lib/sleeper";
import { getAllTeamsForSelector, getTeamRosterSplit } from "../../lib/teamRoster";
import { getPowerRankingsWithBreakdown } from "../../lib/powerRankingsBreakdown";
import { getPositionColor, getPositionSolidColor } from "../../lib/positionBadge";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

function PlayerCard({ player }) {
  const posColor = getPositionColor(player.position);
  return (
    <div style={{ textAlign: "center", width: "88px" }}>
      <img
        src={`https://sleepercdn.com/content/nfl/players/${player.playerId}.jpg`}
        alt=""
        width={64}
        height={64}
        loading="lazy"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          objectFit: "cover",
          background: "var(--border-soft)",
          border: `2px solid ${posColor.color}`,
          display: "block",
          margin: "0 auto 0.35rem",
        }}
      />
      <span
        style={{
          background: posColor.bg,
          color: posColor.color,
          padding: "0.1rem 0.4rem",
          borderRadius: "5px",
          fontSize: "0.65rem",
          fontWeight: 700,
        }}
      >
        {player.position}
      </span>
      <div style={{ fontSize: "0.75rem", marginTop: "0.3rem", lineHeight: 1.2 }}>{player.name}</div>
    </div>
  );
}

export default async function PowerRankingsPage({ searchParams }) {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  if (!leagueId) {
    return (
      <main>
        <h1>Missing SLEEPER_LEAGUE_ID configuration</h1>
        <p>Add the SLEEPER_LEAGUE_ID environment variable in Vercel with your league ID.</p>
      </main>
    );
  }

  const teamOptions = await getAllTeamsForSelector(leagueId);
  const selectedRosterId = searchParams?.team || "";
  const selectedRoster = selectedRosterId
    ? await getTeamRosterSplit(leagueId, selectedRosterId)
    : null;

  const rankingsWithBreakdown = await getPowerRankingsWithBreakdown(leagueId);
  const standings = await getStandings(leagueId);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><Trophy size={26} /> Power Rankings</h1>

      {/* Selector de equipo + plantilla */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "2rem",
          background: "var(--surface)",
        }}
      >
        <form action="/power-rankings" method="GET" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label htmlFor="team" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            View roster for:
          </label>
          <select
            id="team"
            name="team"
            defaultValue={selectedRosterId}
            style={{
              padding: "0.4rem 0.6rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          >
            <option value="">Choose a team...</option>
            {teamOptions.map((t) => (
              <option key={t.rosterId} value={t.rosterId}>
                {t.teamName}
              </option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent)",
              color: "var(--accent-contrast)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ver
          </button>
        </form>

        {selectedRoster && (
          <div style={{ marginTop: "1.25rem" }}>
            <h3 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: "0.95rem" }}>
              {selectedRoster.teamName} · Starters
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {selectedRoster.starters.map((p) => (
                <PlayerCard key={p.playerId} player={p} />
              ))}
            </div>

            <h3 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: "0.95rem", color: "var(--text-muted)" }}>
              Bench
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {selectedRoster.bench.map((p) => (
                <PlayerCard key={p.playerId} player={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Power Rankings como gráfico de barras apiladas por posición */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", fontSize: "0.8rem" }}>
        {["QB", "RB", "WR", "TE"].map((pos) => (
          <div key={pos} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: getPositionSolidColor(pos),
                display: "inline-block",
              }}
            />
            {pos}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "2.5rem" }}>
        {rankingsWithBreakdown.map((team) => (
          <div key={team.rosterId} style={{ marginBottom: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              <span style={{ fontWeight: 600 }}>
                {team.rank}. {team.teamName}
              </span>
              <span style={{ color: "var(--text-muted)" }}>Power score {team.powerScore}</span>
            </div>
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "22px",
                borderRadius: "6px",
                overflow: "hidden",
                background: "var(--border-soft)",
              }}
            >
              {team.segments.map((seg) => (
                <div
                  key={seg.position}
                  title={`${seg.position}: ${seg.points} pts`}
                  style={{
                    width: `${seg.pct}%`,
                    background: getPositionSolidColor(seg.position),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {seg.pct > 8 ? seg.points : ""}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2>Standings</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ padding: "0.5rem" }}>Team</th>
            <th style={{ padding: "0.5rem" }}>Record</th>
            <th style={{ padding: "0.5rem" }}>Points For</th>
            <th style={{ padding: "0.5rem" }}>Points Against</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team) => (
            <tr key={team.rosterId}>
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
