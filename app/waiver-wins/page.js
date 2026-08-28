import { getWaiverWireWins } from "../../lib/waiverWins";
import { getPositionColor } from "../../lib/positionBadge";
import { getPlayerImageUrl } from "../../lib/teamLogo";
import { Target, Plus, Minus } from "lucide-react";
import TeamLogo from "../components/TeamLogo";
import { getLeagueId } from "../../lib/session";
import CommishPost from "../components/CommishPost";
import { getPublishedPost } from "../../lib/posts";

export const dynamic = "force-dynamic";

function PlayerLine({ player, sign }) {
  const posColor = getPositionColor(player.position);
  const isAdd = sign === "+";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.4rem 0" }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: isAdd ? "var(--success-bg)" : "var(--danger-bg)",
          color: isAdd ? "#15803d" : "#b91c1c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isAdd ? <Plus size={14} /> : <Minus size={14} />}
      </div>
      <img
        src={getPlayerImageUrl(player.playerId, player.position, player.nflTeam)}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          objectFit: "cover",
          background: "var(--border-soft)",
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{player.name}</div>
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

export default async function WaiverWinsPage() {
  const leagueId = getLeagueId();
  const wins = await getWaiverWireWins(leagueId);
  const post = await getPublishedPost("waiver-wins").catch(() => null);

  return (
    <main style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><Target size={26} /> Waiver Wire Wins</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Players added via waiver or free agent, ranked by total points
        accumulated since they were added.
      </p>

      <CommishPost post={post} />

      {wins.length === 0 && (
        <p style={{ marginTop: "1.5rem" }}>
          Not enough weeks yet to calculate this. Check back soon.
        </p>
      )}

      {wins.map((w, i) => (
        <div
          key={`${w.addedPlayer.playerId}-${i}`}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "1rem",
            marginBottom: "0.85rem",
            background: "var(--surface)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>#{i + 1}</span>
              <TeamLogo avatar={w.avatar} teamName={w.teamName} size={22} />
              <strong style={{ fontSize: "0.85rem" }}>{w.teamName}</strong>
            </div>
            <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.9rem" }}>
              {w.totalPoints} pts
            </span>
          </div>

          <PlayerLine player={w.addedPlayer} sign="+" />
          {w.droppedPlayer && <PlayerLine player={w.droppedPlayer} sign="-" />}
        </div>
      ))}
    </main>
  );
}
