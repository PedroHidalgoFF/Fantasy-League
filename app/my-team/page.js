import { getStandings, getAllTrades } from "../../lib/sleeper";
import { getTeamRosterSplit } from "../../lib/teamRoster";
import { getPowerRankingsWithBreakdown } from "../../lib/powerRankingsBreakdown";
import { getPositionSolidColor } from "../../lib/positionBadge";
import TeamLogo from "../components/TeamLogo";
import PlayerCard from "../components/PlayerCard";
import YourTeamBadge from "../components/YourTeamBadge";
import TeamTradeBlock from "../components/TeamTradeBlock";
import { UserCircle, Trophy, ListChecks, Repeat, Sparkles } from "lucide-react";
import { getLeagueId, getMyRosterId } from "../../lib/session";
import { getCachedPowerRankingsV2 } from "../../lib/powerRankingsV2Cache";

export const dynamic = "force-dynamic";

function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TabLink({ tab, active, icon: Icon, label }) {
  return (
    <a
      href={tab === "rankings" ? "/my-team" : `/my-team?tab=${tab}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.5rem 0.9rem",
        borderRadius: "999px",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--surface-active)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
        fontWeight: active ? 700 : 500,
        fontSize: "0.85rem",
        textDecoration: "none",
      }}
    >
      <Icon size={16} /> {label}
    </a>
  );
}

export default async function MyTeamPage({ searchParams }) {
  const leagueId = getLeagueId();
  const myRosterId = getMyRosterId();
  const tab = searchParams?.tab || "rankings";

  if (!leagueId) {
    return (
      <main>
        <h1>Missing SLEEPER_LEAGUE_ID configuration</h1>
      </main>
    );
  }

  if (!myRosterId) {
    return (
      <main style={{ maxWidth: 700, margin: "0 auto" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <UserCircle size={26} /> My Team
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          No team selected yet. Use "Change League" in the menu to pick your team.
        </p>
      </main>
    );
  }

  const myRoster = await getTeamRosterSplit(leagueId, myRosterId);
  const rankingsWithBreakdown = tab === "rankings" ? await getPowerRankingsWithBreakdown(leagueId) : null;
  const standings = tab === "rankings" ? await getStandings(leagueId) : null;
  const cachedV2 = tab === "rankings" ? await getCachedPowerRankingsV2(leagueId).catch(() => null) : null;

  let myTrades = null;
  if (tab === "trades") {
    const allTrades = await getAllTrades(leagueId);
    myTrades = allTrades.filter((t) => t.byTeam.some((team) => String(team.rosterId) === String(myRosterId)));
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <UserCircle size={26} /> My Team
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <TeamLogo avatar={myRoster.avatar} teamName={myRoster.teamName} size={20} />
        {myRoster.teamName}
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <TabLink tab="rankings" active={tab === "rankings"} icon={Trophy} label="Rankings" />
        <TabLink tab="roster" active={tab === "roster"} icon={ListChecks} label="Roster" />
        <TabLink tab="trades" active={tab === "trades"} icon={Repeat} label="Trades" />
      </div>

      {tab === "roster" && (
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: "0.95rem" }}>
            Starters
          </h3>
          <div style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", gap: "0.75rem", marginBottom: "1.5rem", paddingBottom: "0.4rem", WebkitOverflowScrolling: "touch" }}>
            {myRoster.starters.map((p) => (
              <div key={p.playerId} style={{ flex: "0 0 auto" }}>
                <PlayerCard player={p} />
              </div>
            ))}
          </div>

          <h3 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: "0.95rem", color: "var(--text-muted)" }}>
            Bench
          </h3>
          <div style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", gap: "0.75rem", paddingBottom: "0.4rem", WebkitOverflowScrolling: "touch" }}>
            {myRoster.bench.map((p) => (
              <div key={p.playerId} style={{ flex: "0 0 auto" }}>
                <PlayerCard player={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "trades" && (
        <div>
          {myTrades.length === 0 && <p>No trades yet this season.</p>}
          {myTrades.map((trade) => (
            <div
              key={trade.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1.25rem",
                marginBottom: "1.25rem",
                background: "var(--surface)",
              }}
            >
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                Week {trade.week} · {formatDate(trade.timestamp)}
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {trade.byTeam.map((team) => (
                  <TeamTradeBlock key={team.rosterId} team={team} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "rankings" && (
        <div>
          {cachedV2 ? (
            <div style={{ marginBottom: "2.5rem" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Sparkles size={18} /> Roster Quality Rankings
              </h2>
              <p style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                Based on ESPN's season-long positional rankings for your starters + bench depth —
                not wins/losses. Updated{" "}
                {new Date(cachedV2.computed_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.
              </p>
              {cachedV2.data.rankings.map((team) => {
                const isMine = String(team.rosterId) === String(myRosterId);
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
                This ranking uses ESPN's preseason positional rankings, so it works even before
                real games start — trigger its first refresh from GitHub → Actions → "Power
                Rankings v2 refresh" → "Run workflow", or wait for its scheduled run.
              </p>
            </div>
          )}

          {rankingsWithBreakdown.some((t) => t.powerScore > 0) ? (
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
                  const isMine = String(team.rosterId) === String(myRosterId);
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
          ) : (
            <p style={{ color: "var(--text-faint)", fontSize: "0.85rem", marginBottom: "2.5rem" }}>
              The points-based power ranking will fill in once real games are played this season —
              check "Roster Quality Rankings" above for a ranking that works right now.
            </p>
          )}

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
                const isMine = String(team.rosterId) === String(myRosterId);
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
        </div>
      )}
    </main>
  );
}
