import { getStandings } from "../../lib/sleeper";
import { getTeamRosterSplit } from "../../lib/teamRoster";
import { getPowerRankingsWithBreakdown } from "../../lib/powerRankingsBreakdown";
import { getPositionColor, getPositionSolidColor } from "../../lib/positionBadge";
import TeamLogo from "../components/TeamLogo";
import { Trophy, Star } from "lucide-react";
import { getLeagueId, getMyRosterId } from "../../lib/session";

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

function YourTeamBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        background: "var(--accent)",
        color: "var(--accent-contrast)",
        padding: "0.1rem 0.5rem",
        borderRadius: "999px",
        fontSize: "0.65rem",
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      <Star size={11} fill="var(--accent-contrast)" /> You
    </span>
  );
}

export default async function PowerRankingsPage() {
  const leagueId = getLeagueId();
  const myRosterId = getMyRosterId();

  if (!leagueId) {
    return (
      <main>
        <h1>Missing SLEEPER_LEAGUE_ID configuration</h1>
        <p>Add the SLEEPER_LEAGUE_ID environment variable in Vercel with your league ID.</p>
      </main>
    );
  }

  const myRoster = myRosterId ? await getTeamRosterSplit(leagueId, myRosterId) : null;
  const rankingsWithBreakdown = await getPowerRankingsWithBreakdown(leagueId);
  const standings = await getStandings(leagueId);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><Trophy size={26} /> Power Rankings</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
        Weekly ranking calculated from record and points for.
      </p>

      {/* Tu plantilla, automática a partir de tu equipo elegido en /setup */}
      {myRoster && (
        <div
          style={{
            border: "1px solid var(--accent)",
            borderRadius: "12px",
            padding: "1.25rem",
            marginBottom: "2rem",
            background: "var(--surface)",
          }}
        >
          <h3 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TeamLogo avatar={myRoster.avatar} teamName={myRoster.teamName} size={28} />
            {myRoster.teamName} <YourTeamBadge /> · Starters
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {myRoster.starters.map((p) => (
              <PlayerCard key={p.playerId} player={p} />
            ))}
          </div>

          <h3 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: "0.95rem", color: "var(--text-muted)" }}>
            Bench
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {myRoster.bench.map((p) => (
              <PlayerCard key={p.playerId} player={p} />
            ))}
          </div>
        </div>
      )}

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
        {rankingsWithBreakdown.map((team) => {
          const isMine = myRosterId && String(team.rosterId) === String(myRosterId);
          return (
            <div
              key={team.rosterId}
              style={{
                marginBottom: "0.9rem",
                padding: isMine ? "0.6rem 0.75rem" : "0",
                borderRadius: "8px",
                background: isMine ? "var(--surface-active)" : "transparent",
                border: isMine ? "1px solid var(--accent)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {team.rank}.
                  <TeamLogo avatar={team.avatar} teamName={team.teamName} size={22} />
                  {team.teamName}
                  {isMine && <YourTeamBadge />}
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
          );
        })}
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
          {standings.map((team) => {
            const isMine = myRosterId && String(team.rosterId) === String(myRosterId);
            return (
              <tr key={team.rosterId} style={isMine ? { background: "var(--surface-active)" } : undefined}>
                <td style={{ padding: "0.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <TeamLogo avatar={team.avatar} teamName={team.teamName} size={26} />
                  {team.teamName}
                  {isMine && <YourTeamBadge />}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  {team.wins}-{team.losses}
                  {team.ties ? `-${team.ties}` : ""}
                </td>
                <td style={{ padding: "0.5rem" }}>{team.pointsFor.toFixed(1)}</td>
                <td style={{ padding: "0.5rem" }}>{team.pointsAgainst.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
