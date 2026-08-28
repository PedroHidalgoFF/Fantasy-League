import { getPositionColor } from "../../lib/positionBadge";
import { getPlayerImageUrl } from "../../lib/teamLogo";

export default function PlayerCard({ player }) {
  const posColor = getPositionColor(player.position);
  return (
    <div style={{ textAlign: "center", width: "88px" }}>
      <img
        src={getPlayerImageUrl(player.playerId, player.position, player.nflTeam)}
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
