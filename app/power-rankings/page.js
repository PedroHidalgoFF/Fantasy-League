import { getStandings } from "../../lib/sleeper";
import { getTeamRosterSplit } from "../../lib/teamRoster";
import { getPowerRankingsWithBreakdown } from "../../lib/powerRankingsBreakdown";
import { getPositionSolidColor } from "../../lib/positionBadge";
import TeamLogo from "../components/TeamLogo";
import PlayerCard from "../components/PlayerCard";
import YourTeamBadge from "../components/YourTeamBadge";
import { Trophy } from "lucide-react";
import { getLeagueId, getMyRosterId } from "../../lib/session";
import CommishPost from "../components/CommishPost";
import { getPublishedPost } from "../../lib/posts";
import { getCachedPowerRankingsV2 } from "../../lib/powerRankingsV2Cache";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

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
  const post = await getPublishedPost("power-rankings").catch(() => null);
  const cachedV2 = await getCachedPowerRankingsV2(leagueId).catch(() => null);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><Trophy size={26} /> Power Rankings</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
        Weekly ranking calculated from record and points for.
      </p>

      <CommishPost post={post} />

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

      {/* Power Rankings basado en puntos reales de temporada — sección
          alternativa de "calidad de roster" (v2, con proyecciones) */}
      {cachedV2 ? (
        <div style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Sparkles size={18} /> Roster Quality Rankings
          </h2>
          <p style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
            Based on ESPN's season-long positional rankings for your starters + bench depth — not
            wins/losses. Updated {new Date(cachedV2.computed_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.
          </p>
          {cachedV2.data.rankings.map((team) => {
            const isMine = myRosterId && String(team.rosterId) === String(myRosterId);
            return (
              <div
                key={team.rosterId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "8px",
                  marginBottom: "0.4rem",
                  background: isMine ? "var(--surface-active)" : "var(--surface)",
                  border: isMine ? "1px solid var(--accent)" : "1px solid var(--border)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.88rem" }}>
                  {team.rank}.
                  <TeamLogo avatar={team.avatar} teamName={team.teamName} size={22} />
                  {team.teamName}
                  {isMine && <YourTeamBadge />}
                </span>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>{Math.round(team.powerScore * 100)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ border: "1px dashed var(--border)", borderRadius: "10px", padding: "1rem", marginBottom: "2rem" }}>
          <p style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, margin: 0 }}>
            <Sparkles size={16} /> Roster Quality Rankings not calculated yet
          </p>
          <p style={{ color: "var(--text-faint)", fontSize: "0.8rem", marginBottom: 0 }}>
            This ranking uses ESPN's preseason positional rankings, so it works even before real
            games start — but it needs its first refresh to run. In GitHub → Actions → "Power
            Rankings v2 refresh" → click "Run workflow" to trigger it manually, or wait for its
            scheduled run (2x/day).
          </p>
        </div>
      )}

      {(() => {
        const hasRealData = rankingsWithBreakdown.some((t) => t.powerScore > 0);
        if (!hasRealData) {
          return (
            <p style={{ color: "var(--text-faint)", fontSize: "0.85rem", marginBottom: "2.5rem" }}>
              The points-based power ranking below will fill in once real games are played this
              season — check "Roster Quality Rankings" above for a ranking that works right now.
            </p>
          );
        }
        return (
          <>
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
          </>
        );
      })()}

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
