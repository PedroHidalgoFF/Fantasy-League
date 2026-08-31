"use client";

import { useState } from "react";
import {
  ClipboardList,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Zap,
  Target,
  Swords,
  Plus,
  Minus,
} from "lucide-react";
import TeamLogo from "../components/TeamLogo";
import CommishPost from "../components/CommishPost";
import { getPositionColor } from "../../lib/positionBadge";
import { getPlayerImageUrl } from "../../lib/teamLogo";

const COLOR_A = "#ec4899";
const COLOR_B = "#4fa37a";

const TABS = [
  { key: "overview", label: "Overview", icon: ClipboardList },
  { key: "standouts", label: "Standouts", icon: ArrowRightLeft },
  { key: "bustboom", label: "Bust/Boom", icon: Zap },
  { key: "waiver-wins", label: "Waiver Wins", icon: Target },
  { key: "head-to-head", label: "Head-to-Head", icon: Swords },
];

function TabButton({ tab, active, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={() => onClick(tab.key)}
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
        flexShrink: 0,
      }}
    >
      <Icon size={16} /> {tab.label}
    </button>
  );
}

function TeamAvatar({ avatar, teamName, color }) {
  return avatar ? (
    <img
      src={`https://sleepercdn.com/avatars/thumbs/${avatar}`}
      alt=""
      width={44}
      height={44}
      loading="lazy"
      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}`, flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        background: "var(--surface-active)",
        color: "var(--text-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {teamName?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function MatchupForecastCard({ teamA, teamB }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem", marginBottom: "0.85rem", background: "var(--surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1 }}>
          <TeamAvatar avatar={teamA.avatar} teamName={teamA.teamName} color={COLOR_A} />
          <div>
            {teamA.handle && <div style={{ color: "var(--text-faint)", fontSize: "0.7rem" }}>@{teamA.handle}</div>}
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{teamA.teamName}</div>
          </div>
        </div>
        <div style={{ color: "var(--text-faint)", fontSize: "0.75rem", fontWeight: 700 }}>VS</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, justifyContent: "flex-end", textAlign: "right" }}>
          <div>
            {teamB.handle && <div style={{ color: "var(--text-faint)", fontSize: "0.7rem" }}>@{teamB.handle}</div>}
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{teamB.teamName}</div>
          </div>
          <TeamAvatar avatar={teamB.avatar} teamName={teamB.teamName} color={COLOR_B} />
        </div>
      </div>
      <div style={{ display: "flex", width: "100%", height: "6px", borderRadius: "3px", overflow: "hidden", marginTop: "0.75rem" }}>
        <div style={{ width: `${teamA.winPct}%`, background: COLOR_A }} />
        <div style={{ width: `${teamB.winPct}%`, background: COLOR_B }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", fontSize: "0.78rem" }}>
        <span style={{ color: "var(--text-muted)" }}>
          <strong style={{ color: COLOR_A }}>{teamA.winPct}%</strong> · {teamA.wins}-{teamA.losses} · proj {teamA.projected}
        </span>
        <span style={{ color: "var(--text-muted)" }}>
          proj {teamB.projected} · {teamB.wins}-{teamB.losses} · <strong style={{ color: COLOR_B }}>{teamB.winPct}%</strong>
        </span>
      </div>
    </div>
  );
}

function StatCard({ emoji, label, value, sub }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem", flex: "1 1 200px" }}>
      <div style={{ fontSize: "1.5rem" }}>{emoji}</div>
      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>{label}</div>
      <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginTop: "0.25rem" }}>{value}</div>
      {sub && <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{sub}</div>}
    </div>
  );
}

function PlayerStandoutRow({ p, tone }) {
  const posColor = getPositionColor(p.position);
  const diffColor = tone === "good" ? "var(--success)" : "var(--danger)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.5rem 0" }}>
      <img src={p.image} alt="" width={38} height={38} loading="lazy" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", background: "var(--border-soft)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{p.name}</div>
        <span style={{ background: posColor.bg, color: posColor.color, padding: "0.05rem 0.4rem", borderRadius: "5px", fontSize: "0.65rem", fontWeight: 700 }}>
          {p.position} · {p.nflTeam}
        </span>
      </div>
      <div style={{ textAlign: "right", fontSize: "0.8rem" }}>
        <div>{p.actual} pts <span style={{ color: "var(--text-faint)" }}>(proj {p.projected})</span></div>
        <div style={{ color: diffColor, fontWeight: 700 }}>{p.diff >= 0 ? "+" : ""}{p.diff}</div>
      </div>
    </div>
  );
}

function StandoutGroup({ title, icon: Icon, tone, data }) {
  const entries = Object.entries(data || {});
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", marginBottom: "0.85rem", background: "var(--surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.25rem", color: tone === "good" ? "var(--success)" : "var(--danger)" }}>
        <Icon size={16} /> {title}
      </div>
      {entries.length === 0 ? (
        <p style={{ color: "var(--text-faint)", fontSize: "0.82rem", margin: "0.4rem 0 0" }}>
          Not enough data yet — check back once this week's games are underway.
        </p>
      ) : (
        entries.map(([pos, p]) => <PlayerStandoutRow key={pos} p={p} tone={tone} />)
      )}
    </div>
  );
}

function CoachCard({ coach, tone, emptyLabel }) {
  const color = tone === "good" ? "var(--success)" : "var(--danger)";
  if (!coach) {
    return (
      <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", flex: "1 1 260px", background: "var(--surface)" }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-faint)", marginBottom: "0.3rem" }}>{emptyLabel}</div>
        <p style={{ color: "var(--text-faint)", fontSize: "0.82rem", margin: 0 }}>Not enough data yet — needs at least 2 weeks of lineups to compare.</p>
      </div>
    );
  }
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", flex: "1 1 260px", background: "var(--surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <TeamLogo avatar={coach.avatar} teamName={coach.teamName} size={26} />
        <strong style={{ fontSize: "0.9rem" }}>{coach.teamName}</strong>
        <span style={{ marginLeft: "auto", fontWeight: 700, color }}>{coach.impact >= 0 ? "+" : ""}{coach.impact} pts</span>
      </div>
      {coach.swappedIn.length > 0 && (
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Started: {coach.swappedIn.map((p) => p.name).join(", ")}</div>
      )}
      {coach.swappedOut.length > 0 && (
        <div style={{ fontSize: "0.78rem", color: "var(--text-faint)" }}>Benched: {coach.swappedOut.map((p) => p.name).join(", ")}</div>
      )}
    </div>
  );
}

function BustBoomRow({ p }) {
  const diffColor = p.diff >= 0 ? "var(--success)" : "var(--danger)";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-soft)", padding: "0.5rem 0" }}>
      <div>
        <strong>{p.name}</strong>{" "}
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{p.position} · {p.teamName}</span>
      </div>
      <div style={{ textAlign: "right" }}>
        <div>{p.actual} pts <span style={{ color: "var(--text-muted)" }}>(proj. {p.projected})</span></div>
        <div style={{ color: diffColor, fontWeight: "bold" }}>{p.diff >= 0 ? "+" : ""}{p.diff}</div>
      </div>
    </div>
  );
}

function WaiverPlayerLine({ player, sign }) {
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
        style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", background: "var(--border-soft)", flexShrink: 0 }}
      />
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{player.name}</div>
        <span style={{ background: posColor.bg, color: posColor.color, padding: "0.05rem 0.4rem", borderRadius: "5px", fontSize: "0.65rem", fontWeight: 700 }}>
          {player.position} · {player.nflTeam}
        </span>
      </div>
    </div>
  );
}

export default function WeeklyReportTabs({
  initialTab,
  report,
  forecasts,
  extras,
  bustboom,
  bustboomPost,
  waiverWins,
  waiverWinsPost,
  headToHead,
  headToHeadPost,
}) {
  const [tab, setTab] = useState(TABS.some((t) => t.key === initialTab) ? initialTab : "overview");

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", overflowX: "auto" }}>
        {TABS.map((t) => (
          <TabButton key={t.key} tab={t} active={tab === t.key} onClick={setTab} />
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <h2 style={{ marginTop: 0 }}>This Week's Matchups</h2>
          <p style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
            Win % is our own estimate from Sleeper's player projections, not Sleeper's own forecast.
          </p>
          {forecasts.length > 0 ? (
            forecasts.map((f, i) => <MatchupForecastCard key={i} teamA={f.teamA} teamB={f.teamB} />)
          ) : (
            <p style={{ color: "var(--text-faint)", fontSize: "0.85rem" }}>No matchups scheduled yet.</p>
          )}

          {report.pairs.length === 0 ? (
            <p>No results for this week yet.</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                <StatCard emoji="🔥" label="Highest score" value={`${report.highScore.name}`} sub={`${report.highScore.points.toFixed(1)} pts`} />
                <StatCard emoji="🥶" label="Lowest score" value={`${report.lowScore.name}`} sub={`${report.lowScore.points.toFixed(1)} pts`} />
                <StatCard emoji="🤏" label="Closest matchup" value={`${report.closest.teamA.name} vs ${report.closest.teamB.name}`} sub={`${report.closest.margin} pt difference`} />
                <StatCard emoji="💣" label="Biggest blowout" value={`${report.blowout.winner}`} sub={`Won by ${report.blowout.margin} pts`} />
              </div>

              <h2>Last Week's Results</h2>
              {report.pairs.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", border: "1px solid var(--border-soft)", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
                  <div>{p.teamA.name}</div>
                  <div style={{ fontWeight: "bold" }}>{p.teamA.points.toFixed(1)} - {p.teamB.points.toFixed(1)}</div>
                  <div>{p.teamB.name}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "standouts" && (
        <div>
          <h2 style={{ marginTop: 0 }}>
            <ArrowRightLeft size={18} style={{ verticalAlign: "-3px", marginRight: "0.3rem" }} />
            Best / Worst Coach
          </h2>
          <p style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
            Whose lineup swaps from last week paid off the most — and least.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <CoachCard coach={extras.bestCoach} tone="good" emptyLabel="Best Coach" />
            <CoachCard coach={extras.worstCoach} tone="bad" emptyLabel="Worst Coach" />
          </div>

          <h2>Prime Players</h2>
          <StandoutGroup title="Best per position" icon={TrendingUp} tone="good" data={extras.primePlayers} />

          <h2>Shit Players</h2>
          <StandoutGroup title="Worst per position" icon={TrendingDown} tone="bad" data={extras.shitPlayers} />

          <h2>Wire Targets</h2>
          <p style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
            Free agents who outscored their projection by the most this week.
          </p>
          <StandoutGroup title="Available now" icon={TrendingUp} tone="good" data={extras.wireTargets} />
        </div>
      )}

      {tab === "bustboom" && (
        <div>
          <CommishPost post={bustboomPost} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
            Compares actual vs. projected points for your starters. PPR format.
          </p>
          {bustboom.booms.length === 0 && bustboom.busts.length === 0 && <p>Not enough data for this week yet. Check back later.</p>}
          {bustboom.booms.length > 0 && (
            <>
              <h2 style={{ marginTop: "1.5rem", color: "var(--success)" }}>🚀 Booms</h2>
              {bustboom.booms.map((p) => <BustBoomRow key={p.playerId} p={p} />)}
            </>
          )}
          {bustboom.busts.length > 0 && (
            <>
              <h2 style={{ marginTop: "1.5rem", color: "var(--danger)" }}>📉 Busts</h2>
              {bustboom.busts.map((p) => <BustBoomRow key={p.playerId} p={p} />)}
            </>
          )}
        </div>
      )}

      {tab === "waiver-wins" && (
        <div>
          <CommishPost post={waiverWinsPost} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
            Players added via waiver or free agent, ranked by total points accumulated since they were added.
          </p>
          {waiverWins.length === 0 && <p style={{ marginTop: "1.5rem" }}>Not enough weeks yet to calculate this. Check back soon.</p>}
          {waiverWins.map((w, i) => (
            <div key={`${w.addedPlayer.playerId}-${i}`} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", marginBottom: "0.85rem", background: "var(--surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>#{i + 1}</span>
                  <TeamLogo avatar={w.avatar} teamName={w.teamName} size={22} />
                  <strong style={{ fontSize: "0.85rem" }}>{w.teamName}</strong>
                </div>
                <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.9rem" }}>{w.totalPoints} pts</span>
              </div>
              <WaiverPlayerLine player={w.addedPlayer} sign="+" />
              {w.droppedPlayer && <WaiverPlayerLine player={w.droppedPlayer} sign="-" />}
            </div>
          ))}
        </div>
      )}

      {tab === "head-to-head" && (
        <div>
          <CommishPost post={headToHeadPost} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
            Matchup history between every pair of teams this season. Since it's early in the year, most will show
            just 1 game — this grows as rematches happen.
          </p>
          {headToHead.length === 0 && <p style={{ marginTop: "1.5rem" }}>No matchups recorded yet.</p>}
          {headToHead.map((r, i) => (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{r.teamAName} vs {r.teamBName}</strong>
                <span style={{ color: "var(--text-muted)" }}>{r.teamAWins}-{r.teamBWins}{r.ties ? `-${r.ties}` : ""}</span>
              </div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-soft)" }}>
                {r.games.map((g, j) => (
                  <div key={j}>Week {g.week}: {g.aScore.toFixed(1)} - {g.bScore.toFixed(1)}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
