import { getStandings } from "../../lib/sleeper";
import { getTeamRosterSplit } from "../../lib/teamRoster";
import { getPowerRankingsWithBreakdown } from "../../lib/powerRankingsBreakdown";
import TeamLogo from "../components/TeamLogo";
import PlayerCard from "../components/PlayerCard";
import YourTeamBadge from "../components/YourTeamBadge";
import PowerRankingsToggle from "../components/PowerRankingsToggle";
import { Trophy } from "lucide-react";
import { getLeagueId, getMyRosterId } from "../../lib/session";
import CommishPost from "../components/CommishPost";
import { getPublishedPost } from "../../lib/posts";
import { getCachedPowerRankingsV2 } from "../../lib/powerRankingsV2Cache";

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
  const hasRealData = rankingsWithBreakdown.some((t) => t.powerScore > 0);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Trophy size={26} /> Power Rankings
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
        Two ways to rank the league — season points once real games are underway, roster quality any time.
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

      <PowerRankingsToggle
        rankingsWithBreakdown={rankingsWithBreakdown}
        cachedV2={cachedV2}
        myRosterId={myRosterId}
        hasRealData={hasRealData}
      />

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
