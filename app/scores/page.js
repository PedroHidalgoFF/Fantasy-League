"use client";

import { useEffect, useState, useCallback } from "react";
import { Radio, RefreshCw } from "lucide-react";

const PRESEASON_WEEKS = [1, 2, 3];
const REGULAR_WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

function formatDayHeader(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatKickoff(dateStr) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

function TeamRow({ team, showScore }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.3rem 0" }}>
      {team.logo ? (
        <img src={team.logo} alt="" width={26} height={26} style={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--border-soft)", flexShrink: 0 }} />
      )}
      <span style={{ fontWeight: team.winner ? 700 : 500, fontSize: "0.92rem" }}>{team.name}</span>
      <span style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>{team.record}</span>
      {showScore && (
        <span style={{ marginLeft: "auto", fontWeight: team.winner ? 700 : 500, fontSize: "1.05rem" }}>
          {team.score}
        </span>
      )}
    </div>
  );
}

function GameRow({ game }) {
  const isLive = game.state === "in";
  const isPre = game.state === "pre";
  const kickoff = isPre ? formatKickoff(game.date) : null;

  return (
    <div
      style={{
        display: "flex",
        border: `1px solid ${isLive ? "var(--danger)" : "var(--border)"}`,
        borderRadius: "10px",
        padding: "0.75rem 0.9rem",
        marginBottom: "0.6rem",
        background: "var(--surface)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <TeamRow team={game.away} showScore={!isPre} />
        <TeamRow team={game.home} showScore={!isPre} />
      </div>

      <div style={{ textAlign: "right", paddingLeft: "0.75rem", minWidth: "92px" }}>
        {isLive && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.3rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", animation: "pulse 1.5s infinite" }} />
            <span style={{ color: "var(--danger)", fontWeight: 700, fontSize: "0.75rem" }}>{game.statusText}</span>
          </div>
        )}
        {isLive && game.downDistance && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "0.2rem" }}>{game.downDistance}</div>
        )}
        {!isLive && !isPre && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600 }}>{game.statusText}</div>
        )}
        {isPre && kickoff && (
          <>
            <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>{kickoff.date}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{kickoff.time}</div>
          </>
        )}
        {game.broadcast && (
          <div style={{ color: "var(--text-faint)", fontSize: "0.68rem", marginTop: "0.3rem" }}>{game.broadcast}</div>
        )}
      </div>
    </div>
  );
}

function WeekTab({ label, active, current, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: "0.4rem 0.85rem",
        borderRadius: "999px",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--surface-active)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
        fontSize: "0.8rem",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        position: "relative",
        whiteSpace: "nowrap",
      }}
    >
      {current && (
        <span
          style={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "0.6rem",
            color: "var(--accent)",
            fontWeight: 700,
          }}
        >
          CURRENT
        </span>
      )}
      {label}
    </button>
  );
}

export default function ScoresPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selected, setSelected] = useState(null); // { seasontype, week } | null = auto/current
  const [current, setCurrent] = useState(null); // detected current week from ESPN

  const loadScores = useCallback(async (weekOverride) => {
    try {
      const params = weekOverride
        ? `?year=${new Date().getFullYear()}&seasontype=${weekOverride.seasonType}&week=${weekOverride.week}`
        : "";
      const res = await fetch(`/api/scores${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.games) {
        setGames(data.games);
        setLastUpdated(new Date());
        if (!weekOverride && data.meta?.week) {
          setCurrent({ seasonType: data.meta.seasonType, week: data.meta.week });
        }
      }
    } catch {
      // silently keep last known scores
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadScores(selected);
  }, [selected, loadScores]);

  useEffect(() => {
    const interval = setInterval(() => loadScores(selected), 30000);
    return () => clearInterval(interval);
  }, [selected, loadScores]);

  // Agrupa los juegos por día
  const byDay = {};
  for (const g of games) {
    const key = new Date(g.date).toDateString();
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(g);
  }

  return (
    <main style={{ maxWidth: 700, margin: "0 auto" }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Radio size={26} /> Live Scores
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
        NFL scores, updating automatically every 30 seconds.
      </p>

      <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingTop: "1rem", paddingBottom: "0.75rem", marginBottom: "0.5rem" }}>
        {PRESEASON_WEEKS.map((w) => (
          <WeekTab
            key={`pre-${w}`}
            label={`Pre Wk ${w}`}
            active={selected?.seasonType === 1 && selected?.week === w}
            current={current?.seasonType === 1 && current?.week === w && !selected}
            onClick={() => setSelected({ seasonType: 1, week: w })}
          />
        ))}
        {REGULAR_WEEKS.map((w) => (
          <WeekTab
            key={`reg-${w}`}
            label={`Week ${w}`}
            active={selected?.seasonType === 2 && selected?.week === w}
            current={current?.seasonType === 2 && current?.week === w && !selected}
            onClick={() => setSelected({ seasonType: 2, week: w })}
          />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-faint)", fontSize: "0.78rem", marginBottom: "1.25rem" }}>
        <RefreshCw size={13} />
        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-US")}` : "Loading..."}
      </div>

      {loading && games.length === 0 && <p>Loading scores...</p>}
      {!loading && games.length === 0 && <p>No games found for this week.</p>}

      {Object.entries(byDay).map(([dateKey, dayGames]) => (
        <div key={dateKey} style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "0.95rem" }}>{formatDayHeader(dayGames[0].date)}</h2>
          {dayGames.map((g) => (
            <GameRow key={g.id} game={g} />
          ))}
        </div>
      ))}
    </main>
  );
}
