import { Newspaper } from "lucide-react";
import { relativeTime } from "../../lib/relativeTime";

export default function NewsRow({ item, matchedPlayer }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        gap: "0.85rem",
        textDecoration: "none",
        color: "var(--text)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "0.85rem",
        marginBottom: "0.75rem",
        background: "var(--surface)",
      }}
    >
      {matchedPlayer ? (
        <img
          src={`https://sleepercdn.com/content/nfl/players/${matchedPlayer.playerId}.jpg`}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          style={{
            width: 56,
            height: 56,
            borderRadius: "8px",
            objectFit: "cover",
            background: "var(--border-soft)",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "8px",
            background: "var(--sidebar-bg)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Newspaper size={22} />
        </div>
      )}

      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.3 }}>{item.title}</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
          ESPN · {relativeTime(item.pubDate)}
        </div>
      </div>
    </a>
  );
}
