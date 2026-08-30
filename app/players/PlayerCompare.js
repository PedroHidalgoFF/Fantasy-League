"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Plus } from "lucide-react";
import { getPositionColor } from "../../lib/positionBadge";

const TIER_COLORS = {
  good: { bg: "#dcfce7", color: "#15803d" },
  mid: { bg: "#fef3c7", color: "#92400e" },
  low: { bg: "#fee2e2", color: "#b91c1c" },
};

function PlayerPickCard({ player, onClick }) {
  const posColor = getPositionColor(player.position);
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        overflow: "hidden",
        background: "var(--surface)",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <img
        src={`https://sleepercdn.com/content/nfl/players/${player.playerId}.jpg`}
        alt=""
        style={{ width: "100%", aspectRatio: "1", objectFit: "cover", background: "var(--border-soft)" }}
      />
      <div style={{ padding: "0.4rem", width: "100%" }}>
        <span style={{ background: posColor.bg, color: posColor.color, padding: "0.03rem 0.35rem", borderRadius: "5px", fontSize: "0.58rem", fontWeight: 700 }}>
          {player.position}
        </span>
        <div style={{ fontSize: "0.7rem", fontWeight: 600, marginTop: "0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {player.name}
        </div>
      </div>
    </button>
  );
}

function SelectPlayersModal({ selected, lockedPosition, onAdd, onRemove, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (lockedPosition) params.set("position", lockedPosition);
      const res = await fetch(`/api/players/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.results || []);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, lockedPosition]);

  const selectedIds = new Set(selected.map((s) => s.playerId));
  const canCompare = selected.length >= 2;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: "16px 16px 0 0",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "1.25rem 1.25rem 0", overflow: "auto", flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
            <h3 style={{ margin: 0, border: "none", padding: 0 }}>Select Players</h3>
            <button onClick={onClose} aria-label="Close" style={{ background: "var(--border-soft)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={18} style={{ margin: "0 auto" }} />
            </button>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>Selected Players ({selected.length}/5)</p>

          {selected.length > 0 && (
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              {selected.map((p) => (
                <div key={p.playerId} style={{ position: "relative", width: 72 }}>
                  <img
                    src={`https://sleepercdn.com/content/nfl/players/${p.playerId}.jpg`}
                    alt=""
                    style={{ width: 72, height: 72, borderRadius: "10px", objectFit: "cover", background: "var(--border-soft)", border: "2px solid var(--accent)" }}
                  />
                  <button
                    onClick={() => onRemove(p.playerId)}
                    style={{ position: "absolute", top: -6, right: -6, background: "var(--sidebar-bg)", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer" }}
                  >
                    <X size={13} style={{ margin: "0 auto" }} />
                  </button>
                  <div style={{ fontSize: "0.68rem", textAlign: "center", marginTop: "0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.6rem 0.85rem", marginBottom: "1rem" }}>
            <Search size={16} color="var(--text-faint)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              style={{ flex: 1, border: "none", outline: "none", background: "none", color: "var(--text)", fontSize: "16px" }}
              autoFocus
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: "0.5rem", paddingBottom: "1rem" }}>
            {results
              .filter((r) => !selectedIds.has(r.playerId))
              .map((r) => (
                <PlayerPickCard key={r.playerId} player={r} onClick={() => onAdd(r)} />
              ))}
          </div>
        </div>

        <div style={{ padding: "0.85rem 1.25rem", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          <button
            onClick={onClose}
            disabled={!canCompare}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "10px",
              border: "none",
              background: canCompare ? "var(--accent)" : "var(--border-soft)",
              color: canCompare ? "var(--accent-contrast)" : "var(--text-faint)",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: canCompare ? "pointer" : "not-allowed",
            }}
          >
            {canCompare ? `Compare (${selected.length})` : "Select at least 2 players"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, entries }) {
  const values = entries.map((e) => e.value);
  return (
    <div style={{ display: "flex", borderBottom: "1px solid var(--border-soft)", padding: "0.6rem 0" }}>
      <div style={{ flex: "1 1 120px", color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>{label}</div>
      {entries.map((e, i) => {
        const tier = TIER_COLORS[e.tier] || null;
        return (
          <div key={i} style={{ flex: "1 1 110px", display: "flex", justifyContent: "center", gap: "0.35rem" }}>
            <span
              style={{
                background: tier?.bg || "var(--border-soft)",
                color: tier?.color || "var(--text)",
                padding: "0.15rem 0.5rem",
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "0.82rem",
                minWidth: "44px",
                textAlign: "center",
              }}
            >
              {e.value}
            </span>
            {e.rank && (
              <span style={{ color: "var(--text-faint)", fontSize: "0.75rem", alignSelf: "center" }}>({e.rank})</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PlayerCompare() {
  const [selected, setSelected] = useState([]);
  const [playerData, setPlayerData] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("average");

  const lockedPosition = selected[0]?.position || null;

  useEffect(() => {
    if (selected.length === 0) {
      setPlayerData({});
      return;
    }
    setLoading(true);
    const ids = selected.map((s) => s.playerId).join(",");
    fetch(`/api/players/stats?ids=${ids}&mode=${mode}`)
      .then((r) => r.json())
      .then((data) => {
        const byId = Object.fromEntries((data.players || []).map((p) => [p.playerId, p]));
        setPlayerData(byId);
      })
      .finally(() => setLoading(false));
  }, [selected, mode]);

  function handleAdd(player) {
    setSelected((prev) => (prev.length >= 5 ? prev : [...prev, player]));
  }

  function handleRemove(playerId) {
    setSelected((prev) => prev.filter((p) => p.playerId !== playerId));
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "var(--accent)",
            color: "var(--accent-contrast)",
            border: "none",
            borderRadius: "999px",
            padding: "0.55rem 1.1rem",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          <Plus size={16} /> {selected.length === 0 ? "Select Players" : "Add Players"}
        </button>

        {selected.length > 0 && (
          <div style={{ display: "inline-flex", background: "var(--sidebar-bg)", borderRadius: "999px", padding: "0.2rem" }}>
            {["average", "total"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "0.35rem 0.8rem",
                  borderRadius: "999px",
                  border: "none",
                  background: mode === m ? "var(--accent)" : "transparent",
                  color: mode === m ? "var(--accent-contrast)" : "var(--sidebar-text)",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected.length === 0 && (
        <p style={{ color: "var(--text-faint)", fontSize: "0.9rem" }}>
          Select 2 or more players at the same position to compare their season stats.
        </p>
      )}

      {selected.length > 0 && (
        <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
          {selected.map((p) => {
            const data = playerData[p.playerId];
            const posColor = getPositionColor(p.position);
            return (
              <div key={p.playerId} style={{ minWidth: "260px", flex: "1 1 260px", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden", background: "var(--surface)" }}>
                <div
                  style={{
                    position: "relative",
                    height: "150px",
                    background: `linear-gradient(0deg, rgba(13,13,13,0.85), rgba(13,13,13,0.15)), url(https://sleepercdn.com/content/nfl/players/${p.playerId}.jpg) center/cover no-repeat, var(--sidebar-bg)`,
                  }}
                >
                  <button
                    onClick={() => handleRemove(p.playerId)}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 26, height: 26, cursor: "pointer" }}
                  >
                    <X size={14} style={{ margin: "0 auto" }} />
                  </button>
                  <div style={{ position: "absolute", bottom: "0.6rem", left: "0.75rem", right: "0.75rem" }}>
                    <div style={{ color: "#fff", fontWeight: 800, fontSize: "1.05rem", textTransform: "uppercase", lineHeight: 1.15 }}>{p.name}</div>
                    <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem" }}>
                      <span style={{ background: posColor.bg, color: posColor.color, padding: "0.1rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 800 }}>
                        {p.position}{data?.overallPositionRank ? ` ${data.overallPositionRank}` : ""}
                      </span>
                      <span style={{ background: "rgba(255,255,255,0.9)", color: "#111", padding: "0.1rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 800 }}>
                        {p.nflTeam}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "0.75rem 0.9rem" }}>
                  <div style={{ color: "var(--text-faint)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.4rem" }}>
                    Timeframe: Season {data?.season || ""}
                  </div>

                  {loading || !data ? (
                    <p style={{ color: "var(--text-faint)", fontSize: "0.85rem" }}>Loading…</p>
                  ) : (
                    data.metrics.map((m) => {
                      const tier = TIER_COLORS[m.tier] || null;
                      return (
                        <div key={m.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0", borderBottom: "1px solid var(--border-soft)" }}>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{m.label}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <span style={{ background: tier?.bg || "var(--border-soft)", color: tier?.color || "var(--text)", padding: "0.1rem 0.45rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.8rem" }}>
                              {m.value}
                            </span>
                            {m.rank && <span style={{ color: "var(--text-faint)", fontSize: "0.72rem" }}>({m.rank})</span>}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <SelectPlayersModal
          selected={selected}
          lockedPosition={lockedPosition}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
