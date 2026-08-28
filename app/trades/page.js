import { getAllTrades } from "../../lib/sleeper";
import { Repeat } from "lucide-react";
import { getLeagueId } from "../../lib/session";
import CommishPost from "../components/CommishPost";
import { getPublishedPost } from "../../lib/posts";
import TeamTradeBlock from "../components/TeamTradeBlock";

export const dynamic = "force-dynamic";

function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TradesPage() {
  const leagueId = getLeagueId();

  if (!leagueId) {
    return (
      <main>
        <h1>Missing SLEEPER_LEAGUE_ID configuration</h1>
      </main>
    );
  }

  const trades = await getAllTrades(leagueId);
  const post = await getPublishedPost("trades").catch(() => null);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Repeat size={26} /> Trades
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
        Full trade history for the season.
      </p>

      <CommishPost post={post} />

      {trades.length === 0 && <p>No trades yet this season.</p>}

      {trades.map((trade) => (
        <div
          key={trade.id}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1.25rem",
            marginBottom: "1.5rem",
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

          {trade.draftPicksTraded.length > 0 && (
            <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-soft)" }}>
              Draft picks traded:{" "}
              {trade.draftPicksTraded
                .map((p) => `Round ${p.round} ${p.season} (${p.fromTeam} → ${p.toTeam})`)
                .join(", ")}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
