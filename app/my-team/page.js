import { getStandings, getAllTrades } from "../../lib/sleeper";
import { getTeamRosterSplit } from "../../lib/teamRoster";
import TeamLogo from "../components/TeamLogo";
import PlayerCard from "../components/PlayerCard";
import TeamTradeBlock from "../components/TeamTradeBlock";
import { UserCircle, Trophy, ListChecks, Repeat, ArrowRight } from "lucide-react";
import { getLeagueId, getMyRosterId } from "../../lib/session";
import { getCachedPowerRankingsV2 } from "../../lib/powerRankingsV2Cache";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function TabLink({ tab, active, icon: Icon, label }) {
  return (
    <Link
      href={tab === "roster" ? "/my-team" : `/my-team?tab=${tab}`}
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
    </Link>
  );
}

function SeeFullLink({ href, label }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        fontSize: "0.85rem",
        fontWeight: 600,
        color: "var(--accent)",
        textDecoration: "none",
        marginTop: "0.5rem",
      }}
    >
      {label} <ArrowRight size={15} />
    </Link>
  );
}

export default async function MyTeamPage({ searchParams }) {
  const leagueId = getLeagueId();
  const myRosterId = getMyRosterId();
  const tab = searchParams?.tab || "roster";

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

  // Rankings tab: solo necesitamos TU posición en cada sistema, no la lista
  // completa (esa ya vive en /power-rankings — evita mostrar el mismo
  // contenido dos veces).
  const standings = tab === "rankings" ? await getStandings(leagueId) : null;
  const cachedV2 = tab === "rankings" ? await getCachedPowerRankingsV2(leagueId).catch(() => null) : null;

  // Trades tab: solo las últimas 3, con link a la lista completa.
  let myTrades = null;
  let myTradesTotal = 0;
  if (tab === "trades") {
    const allTrades = await getAllTrades(leagueId);
    const filtered = allTrades.filter((t) => t.byTeam.some((team) => String(team.rosterId) === String(myRosterId)));
    myTradesTotal = filtered.length;
    myTrades = filtered.slice(0, 3);
  }

  const myStandingIndex = standings ? standings.findIndex((t) => String(t.rosterId) === String(myRosterId)) : -1;
  const myStanding = myStandingIndex >= 0 ? standings[myStandingIndex] : null;
  const myV2Rank = cachedV2 ? cachedV2.data.rankings.find((t) => String(t.rosterId) === String(myRosterId)) : null;

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
          {myTradesTotal > myTrades.length && (
            <SeeFullLink href="/trades" label={`See all ${myTradesTotal} trades`} />
          )}
        </div>
      )}

      {tab === "rankings" && (
        <div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0, marginBottom: "1.25rem" }}>
            Your spot in each ranking system — see the full breakdown on Power Rankings.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", flex: "1 1 220px", background: "var(--surface)" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.3rem" }}>Standings</div>
              {myStanding ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: "1.3rem" }}>
                    #{myStandingIndex + 1} <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-muted)" }}>of {standings.length}</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    {myStanding.wins}-{myStanding.losses}{myStanding.ties ? `-${myStanding.ties}` : ""} · {myStanding.pointsFor.toFixed(1)} PF
                  </div>
                </>
              ) : (
                <div style={{ color: "var(--text-faint)", fontSize: "0.85rem" }}>Not available yet</div>
              )}
            </div>

            <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", flex: "1 1 220px", background: "var(--surface)" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.3rem" }}>Roster Quality</div>
              {myV2Rank ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: "1.3rem" }}>
                    #{myV2Rank.rank} <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-muted)" }}>of {cachedV2.data.rankings.length}</span>
                  </div>
                  <div style={{ color: "var(--accent)", fontSize: "0.85rem", marginTop: "0.25rem", fontWeight: 600 }}>
                    Score {Math.round(myV2Rank.powerScore * 100)}
                  </div>
                </>
              ) : (
                <div style={{ color: "var(--text-faint)", fontSize: "0.85rem" }}>Not calculated yet</div>
              )}
            </div>
          </div>

          <SeeFullLink href="/power-rankings" label="See full Power Rankings" />
        </div>
      )}
    </main>
  );
}
