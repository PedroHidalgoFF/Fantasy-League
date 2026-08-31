"use client";

import { useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import TeamLogo from "./TeamLogo";
import YourTeamBadge from "./YourTeamBadge";
import { getPositionSolidColor } from "../../lib/positionBadge";

function ToggleButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.5rem 0.9rem",
        borderRadius: "999px",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--surface-active)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
        fontWeight: active ? 700 : 500,
        fontSize: "0.85rem",
        cursor: "pointer",
      }}
    >
      <Icon size={16} /> {children}
    </button>
  );
}

// Une los dos sistemas de Power Rankings (puntos de temporada vs. calidad
// de roster) en una sola vista con toggle, en vez de mostrarlos apilados —
// evita que el visitante tenga que averiguar cuál de los dos le importa.
export default function PowerRankingsToggle({ rankingsWithBreakdown, cachedV2, myRosterId, hasRealData }) {
  const [mode, setMode] = useState(hasRealData ? "points" : "roster");

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <ToggleButton active={mode === "points"} onClick={() => setMode("points")} icon={TrendingUp}>
          Season Points
        </ToggleButton>
        <ToggleButton active={mode === "roster"} onClick={() => setMode("roster")} icon={Sparkles}>
          Roster Quality
        </ToggleButton>
      </div>

      {mode === "roster" && (
        <div style={{ marginBottom: "2.5rem" }}>
          {cachedV2 ? (
            <>
              <p style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: 0, marginBottom: "1rem" }}>
                Based on ESPN's season-long positional rankings for your starters + bench depth — not
                wins/losses. Updated{" "}
                {new Date(cachedV2.computed_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.
              </p>
              {cachedV2.data.rankings.map((team) => {
                const isMine = myRosterId && String(team.rosterId) === String(myRosterId);
                return (
                  <div
                    key={team.rosterId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      marginBottom: "0.4rem",
                      background: isMine ? "var(--surface-active)" : "var(--surface)",
                      border: isMine ? "1px solid var(--accent)" : "1px solid var(--border)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.88rem" }}>
                      {team.rank}.
                      <TeamLogo avatar={team.avatar} teamName={team.teamName} size={22} />
                      {team.teamName}
                      {isMine && <YourTeamBadge />}
                    </span>
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}>{Math.round(team.powerScore * 100)}</span>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ border: "1px dashed var(--border)", borderRadius: "10px", padding: "1rem" }}>
              <p style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, margin: 0 }}>
                <Sparkles size={16} /> Roster Quality Rankings not calculated yet
              </p>
              <p style={{ color: "var(--text-faint)", fontSize: "0.8rem", marginBottom: 0 }}>
                This ranking uses ESPN's preseason positional rankings, so it works even before real
                games start — but it needs its first refresh to run. In GitHub → Actions → "Power
                Rankings v2 refresh" → click "Run workflow" to trigger it manually, or wait for its
                scheduled run (2x/day).
              </p>
            </div>
          )}
        </div>
      )}

      {mode === "points" && (
        <div style={{ marginBottom: "2.5rem" }}>
          {!hasRealData ? (
            <p style={{ color: "var(--text-faint)", fontSize: "0.85rem" }}>
              This ranking fills in once real games are played this season — check "Roster Quality"
              above for a ranking that works right now.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", fontSize: "0.8rem" }}>
                {["QB", "RB", "WR", "TE"].map((pos) => (
                  <div key={pos} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: getPositionSolidColor(pos), display: "inline-block" }} />
                    {pos}
                  </div>
                ))}
              </div>

              {rankingsWithBreakdown.map((team) => {
                const isMine = myRosterId && String(team.rosterId) === String(myRosterId);
                return (
                  <div
                    key={team.rosterId}
                    style={{
                      marginBottom: "0.9rem",
                      padding: isMine ? "0.6rem 0.75rem" : "0",
                      borderRadius: "8px",
                      background: isMine ? "var(--surface-active)" : "transparent",
                      border: isMine ? "1px solid var(--accent)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {team.rank}.
                        <TeamLogo avatar={team.avatar} teamName={team.teamName} size={22} />
                        {team.teamName}
                        {isMine && <YourTeamBadge />}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>Power score {team.powerScore}</span>
                    </div>
                    <div style={{ display: "flex", width: "100%", height: "22px", borderRadius: "6px", overflow: "hidden", background: "var(--border-soft)" }}>
                      {team.segments.map((seg) => (
                        <div
                          key={seg.position}
                          title={`${seg.position}: ${seg.points} pts`}
                          style={{
                            width: `${seg.pct}%`,
                            background: getPositionSolidColor(seg.position),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.65rem",
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        >
                          {seg.pct > 8 ? seg.points : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
