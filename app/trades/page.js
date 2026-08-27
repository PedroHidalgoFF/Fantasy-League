import { getAllTrades } from "../../lib/sleeper";
import { Repeat } from "lucide-react";

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
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  if (!leagueId) {
    return (
      <main>
        <h1>Missing SLEEPER_LEAGUE_ID configuration</h1>
      </main>
    );
  }

  const trades = await getAllTrades(leagueId);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Repeat size={26} /> Trades
      </h1>

      {trades.length === 0 && <p>No trades yet this season.</p>}

      {trades.map((trade) => (
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

          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {trade.byTeam.map((team, i) => (
              <div key={i}>
                <strong>{team.teamName}</strong> received:
                <ul style={{ margin: "0.25rem 0" }}>
                  {team.received.length > 0 ? (
                    team.received.map((name, j) => <li key={j}>{name}</li>)
                  ) : (
                    <li>—</li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          {trade.draftPicksTraded.length > 0 && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--text-soft)" }}>
              Picks traded:{" "}
              {trade.draftPicksTraded
                .map(
                  (p) =>
                    `Round ${p.round} ${p.season} (${p.fromTeam} → ${p.toTeam})`
                )
                .join(", ")}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
