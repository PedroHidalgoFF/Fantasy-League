import { getAllTrades } from "../../lib/sleeper";
import { getPositionColor } from "../../lib/positionBadge";
import { Repeat, ArrowRight } from "lucide-react";
import TeamLogo from "../components/TeamLogo";
import { getLeagueId } from "../../lib/session";

export const dynamic = "force-dynamic";

function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PlayerChip({ player }) {
  const posColor = getPositionColor(player.position);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "0.5rem 0.65rem",
      }}
    >
      <img
        src={`https://sleepercdn.com/content/nfl/players/${player.playerId}.jpg`}
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
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{player.name}</div>
        <span
          style={{
            background: posColor.bg,
            color: posColor.color,
            padding: "0.05rem 0.4rem",
            borderRadius: "5px",
            fontSize: "0.65rem",
            fontWeight: 700,
          }}
        >
          {player.position} · {player.nflTeam}
        </span>
      </div>
    </div>
  );
}

function TeamTradeBlock({ team }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "0.9rem",
        flex: "1 1 260px",
        minWidth: "240px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <TeamLogo avatar={team.avatar} teamName={team.teamName} size={26} />
        <strong style={{ fontSize: "0.9rem" }}>{team.teamName}</strong>
      </div>

      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--success)", marginBottom: "0.4rem", letterSpacing: "0.04em" }}>
        RECEIVES
      </div>
      <div style={{ display: "grid", gap: "0.4rem", marginBottom: "0.9rem" }}>
        {team.receives.length > 0 ? (
          team.receives.map((p) => <PlayerChip key={p.playerId} player={p} />)
        ) : (
          <span style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>—</span>
        )}
      </div>

      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--danger)", marginBottom: "0.4rem", letterSpacing: "0.04em" }}>
        SENDS
      </div>
      <div style={{ display: "grid", gap: "0.4rem" }}>
        {team.sends.length > 0 ? (
          team.sends.map((p) => <PlayerChip key={p.playerId} player={p} />)
        ) : (
          <span style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>—</span>
        )}
      </div>
    </div>
  );
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

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Repeat size={26} /> Trades
      </h1>

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
            {trade.byTeam.map((team, i) => (
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
