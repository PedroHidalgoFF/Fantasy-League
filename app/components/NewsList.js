"use client";

import { useState } from "react";
import { Newspaper, X, ExternalLink } from "lucide-react";
import { relativeTime } from "../../lib/relativeTime";
import { stripHtml } from "../../lib/stripHtml";

function Thumbnail({ matchedPlayer, size }) {
  return matchedPlayer ? (
    <img
      src={`https://sleepercdn.com/content/nfl/players/${matchedPlayer.playerId}.jpg`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      style={{
        width: size,
        height: size,
        borderRadius: "8px",
        objectFit: "cover",
        background: "var(--border-soft)",
        flexShrink: 0,
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "8px",
        background: "var(--sidebar-bg)",
        color: "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Newspaper size={size * 0.4} />
    </div>
  );
}

export default function NewsList({ entries }) {
  const [selected, setSelected] = useState(null);

  return (
    <>
      {entries.map(({ item, matchedPlayer }, i) => (
        <button
          key={i}
          onClick={() => setSelected({ item, matchedPlayer })}
          style={{
            display: "flex",
            gap: "0.85rem",
            width: "100%",
            textAlign: "left",
            textDecoration: "none",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "0.85rem",
            marginBottom: "0.75rem",
            background: "var(--surface)",
            cursor: "pointer",
            font: "inherit",
          }}
        >
          <Thumbnail matchedPlayer={matchedPlayer} size={56} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.3 }}>{item.title}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
              ESPN · {relativeTime(item.pubDate)}
            </div>
          </div>
        </button>
      ))}

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: "14px",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "85vh",
              overflow: "auto",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ position: "relative" }}>
              {selected.item.image || selected.matchedPlayer ? (
                <img
                  src={
                    selected.item.image ||
                    `https://sleepercdn.com/content/nfl/players/${selected.matchedPlayer.playerId}.jpg`
                  }
                  alt=""
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "14px 14px 0 0",
                    display: "block",
                  }}
                />
              ) : (
                <div style={{ height: "60px" }} />
              )}
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: "0.6rem",
                  right: "0.6rem",
                  background: "rgba(13,13,13,0.7)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "1.25rem" }}>
              <div style={{ color: "var(--text-faint)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                ESPN · {relativeTime(selected.item.pubDate)}
              </div>
              <h3 style={{ margin: "0 0 0.75rem", border: "none", padding: 0, fontSize: "1.15rem", lineHeight: 1.3 }}>
                {selected.item.title}
              </h3>
              <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                {stripHtml(selected.item.description)}
              </p>
              <a
                href={selected.item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginTop: "0.5rem",
                  color: "var(--accent)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                }}
              >
                Read full article on ESPN <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
