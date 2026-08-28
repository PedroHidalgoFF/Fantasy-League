"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Plus } from "lucide-react";
import { getPositionColor } from "../../lib/positionBadge";
import { STAT_FIELDS_BY_POSITION, prettifyStatKey } from "../../lib/positionStatFields";

function SearchSlot({ index, lockedPosition, onSelect, onClear, selectedPlayer }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams({ q: query });
      if (lockedPosition) params.set("position", lockedPosition);
      const res = await fetch(`/api/players/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.results || []);
      setOpen(true);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, lockedPosition]);

  if (selectedPlayer) {
    const posColor = getPositionColor(selectedPlayer.position);
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          border: "1px solid var(--accent)",
          borderRadius: "10px",
          padding: "0.6rem 0.75rem",
          background: "var(--surface-active)",
        }}
      >
        <img
          src={selectedPlayer.image}
          alt=""
          width={32}
          height={32}
          style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", background: "var(--border-soft)" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{selectedPlayer.name}</div>
          <span style={{ background: posColor.bg, color: posColor.color, padding: "0.05rem 0.4rem", borderRadius: "5px", fontSize: "0.65rem", fontWeight: 700 }}>
            {selectedPlayer.position} · {selectedPlayer.nflTeam}
          </span>
        </div>
        <button onClick={onClear} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}>
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.55rem 0.75rem", background: "var(--surface)" }}>
        <Search size={16} color="var(--text-faint)" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={lockedPosition ? `Search another ${lockedPosition}...` : "Search a player..."}
          style={{ flex: 1, border: "none", outline: "none", background: "none", color: "var(--text)", fontSize: "0.9rem" }}
        />
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.3rem)",
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
            zIndex: 20,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          }}
        >
          {results.map((r) => {
            const posColor = getPositionColor(r.position);
            return (
              <button
                key={r.playerId}
                onClick={() => {
                  onSelect(r);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  borderBottom: "1px solid var(--border-soft)",
                }}
              >
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{r.name}</span>
                <span style={{ background: posColor.bg, color: posColor.color, padding: "0.05rem 0.4rem", borderRadius: "5px", fontSize: "0.62rem", fontWeight: 700 }}>
                  {r.position}
                </span>
                <span style={{ color: "var(--text-faint)", fontSize: "0.75rem", marginLeft: "auto" }}>{r.nflTeam}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PlayerCompare() {
  const [slots, setSlots] = useState([null, null]);
  const [playerData, setPlayerData] = useState({});
  const [loading, setLoading] = useState(false);

  const lockedPosition = slots.find(Boolean)?.position || null;

  useEffect(() => {
    const ids = slots.filter(Boolean).map((s) => s.playerId);
    if (ids.length === 0) {
      setPlayerData({});
      return;
    }
    setLoading(true);
    fetch(`/api/players/stats?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        const byId = Object.fromEntries((data.players || []).map((p) => [p.playerId, p]));
        setPlayerData(byId);
      })
      .finally(() => setLoading(false));
  }, [slots]);

  function handleSelect(index, player) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = player;
      return next;
    });
  }

  function handleClear(index) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  function addSlot() {
    if (slots.length >= 4) return;
    setSlots((prev) => [...prev, null]);
  }

  const chosen = slots.filter(Boolean);
  const fields = chosen.length > 0 ? STAT_FIELDS_BY_POSITION[chosen[0].position] || [] : [];

  const availableKeys = new Set();
  chosen.forEach((p) => {
    const stats = playerData[p.playerId]?.stats || {};
    Object.keys(stats).forEach((k) => availableKeys.add(k));
  });
  const curatedMatchCount = fields.filter((f) => availableKeys.has(f.key)).length;
  const displayFields =
    curatedMatchCount > 0
      ? fields
      : [...availableKeys].filter((k) => !k.startsWith("pts_")).map((k) => ({ key: k, label: prettifyStatKey(k) }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${slots.length}, 1fr)`, gap: "0.75rem", marginBottom: "1.5rem" }}>
        {slots.map((slot, i) => (
          <SearchSlot
            key={i}
            index={i}
            lockedPosition={lockedPosition}
            selectedPlayer={slot}
            onSelect={(p) => handleSelect(i, p)}
            onClear={() => handleClear(i)}
          />
        ))}
      </div>

      {slots.length < 4 && chosen.length > 0 && (
        <button
          onClick={addSlot}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "none",
            border: "1px dashed var(--border)",
            borderRadius: "8px",
            padding: "0.5rem 0.9rem",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
          }}
        >
          <Plus size={16} /> Add another {lockedPosition}
        </button>
      )}

      {chosen.length === 0 && (
        <p style={{ color: "var(--text-faint)", fontSize: "0.9rem" }}>
          Search for two or more players at the same position to compare their season stats.
        </p>
      )}

      {chosen.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: chosen.length * 140 + 140 }}>
            <thead>
              <tr>
                <th style={{ padding: "0.5rem", textAlign: "left" }}></th>
                {chosen.map((p) => (
                  <th key={p.playerId} style={{ padding: "0.5rem", textAlign: "center" }}>
                    <img
                      src={playerData[p.playerId]?.image || p.image}
                      alt=""
                      width={44}
                      height={44}
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", background: "var(--border-soft)", margin: "0 auto 0.3rem" }}
                    />
                    <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-faint)" }}>{p.nflTeam}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: "var(--surface-active)" }}>
                <td style={{ padding: "0.5rem", fontWeight: 700, fontSize: "0.82rem" }}>Season Pts (PPR)</td>
                {chosen.map((p) => {
                  const val = playerData[p.playerId]?.seasonPoints ?? 0;
                  const max = Math.max(...chosen.map((c) => playerData[c.playerId]?.seasonPoints ?? 0));
                  return (
                    <td key={p.playerId} style={{ padding: "0.5rem", textAlign: "center", fontWeight: 700, color: val === max && val > 0 ? "var(--accent)" : "var(--text)" }}>
                      {loading ? "…" : val}
                    </td>
                  );
                })}
              </tr>
              {displayFields.map((field) => {
                const values = chosen.map((p) => playerData[p.playerId]?.stats?.[field.key] ?? 0);
                const max = Math.max(...values);
                return (
                  <tr key={field.key} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <td style={{ padding: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>{field.label}</td>
                    {chosen.map((p, i) => (
                      <td
                        key={p.playerId}
                        style={{
                          padding: "0.5rem",
                          textAlign: "center",
                          fontWeight: values[i] === max && max > 0 ? 700 : 400,
                          color: values[i] === max && max > 0 ? "var(--accent)" : "var(--text)",
                        }}
                      >
                        {loading ? "…" : values[i]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
