import { getWeeklyMatchupData } from "../../lib/sleeper";
import { buildWeeklyReport } from "../../lib/weeklyReport";
import { getPublishedPost } from "../../lib/posts";
import { getUpcomingMatchupForecasts } from "../../lib/matchupForecast";
import { getWeeklyReportExtras } from "../../lib/weeklyReportStats";
import { getPositionColor } from "../../lib/positionBadge";
import { ClipboardList, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { getLeagueId } from "../../lib/session";
import CommishPost from "../components/CommishPost";
import TeamLogo from "../components/TeamLogo";

export const dynamic = "force-dynamic";

const COLOR_A = "#ec4899";
const COLOR_B = "#4fa37a";

function TeamAvatar({ avatar, teamName, color }) {
  return avatar ? (
    <img
      src={`https://sleepercdn.com/avatars/thumbs/${avatar}`}
      alt=""
      width={44}
      height={44}
      loading="lazy"
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        objectFit: "cover",
        border: `2px solid ${color}`,
        flexShrink: 0,
      }}
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
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1rem",
        marginBottom: "0.85rem",
        background: "var(--surface)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1 }}>
          <TeamAvatar avatar={teamA.avatar} teamName={teamA.teamName} color={COLOR_A} />
          <div>
            {teamA.handle && (
              <div style={{ color: "var(--text-faint)", fontSize: "0.7rem" }}>@{teamA.handle}</div>
            )}
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{teamA.teamName}</div>
          </div>
        </div>

        <div style={{ color: "var(--text-faint)", fontSize: "0.75rem", fontWeight: 700 }}>VS</div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, justifyContent: "flex-end", textAlign: "right" }}>
          <div>
            {teamB.handle && (
              <div style={{ color: "var(--text-faint)", fontSize: "0.7rem" }}>@{teamB.handle}</div>
            )}
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{teamB.teamName}</div>
          </div>
          <TeamAvatar avatar={teamB.avatar} teamName={teamB.teamName} color={COLOR_B} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          height: "6px",
          borderRadius: "3px",
          overflow: "hidden",
          marginTop: "0.75rem",
        }}
      >
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
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "1rem",
        flex: "1 1 200px",
      }}
    >
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
      <img
        src={p.image}
        alt=""
        width={38}
        height={38}
        loading="lazy"
        style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", background: "var(--border-soft)", flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{p.name}</div>
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
  if (entries.length === 0) return null;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", marginBottom: "0.85rem", background: "var(--surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.25rem", color: tone === "good" ? "var(--success)" : "var(--danger)" }}>
        <Icon size={16} /> {title}
      </div>
      {entries.map(([pos, p]) => (
        <PlayerStandoutRow key={pos} p={p} tone={tone} />
      ))}
    </div>
  );
}

function CoachCard({ coach, tone }) {
  if (!coach) return null;
  const color = tone === "good" ? "var(--success)" : "var(--danger)";
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", flex: "1 1 260px", background: "var(--surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <TeamLogo avatar={coach.avatar} teamName={coach.teamName} size={26} />
        <strong style={{ fontSize: "0.9rem" }}>{coach.teamName}</strong>
        <span style={{ marginLeft: "auto", fontWeight: 700, color }}>
          {coach.impact >= 0 ? "+" : ""}{coach.impact} pts
        </span>
      </div>
      {coach.swappedIn.length > 0 && (
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
          Started: {coach.swappedIn.map((p) => p.name).join(", ")}
        </div>
      )}
      {coach.swappedOut.length > 0 && (
        <div style={{ fontSize: "0.78rem", color: "var(--text-faint)" }}>
          Benched: {coach.swappedOut.map((p) => p.name).join(", ")}
        </div>
      )}
    </div>
  );
}

export default async function WeeklyReportPage() {
  const leagueId = getLeagueId();
  const { matchups, rosterTeamNames, week, season } = await getWeeklyMatchupData(leagueId);
  const report = buildWeeklyReport(matchups, rosterTeamNames);
  const weekPost = await getPublishedPost("weekly-report", week).catch(() => null);
  const { week: forecastWeek, forecasts } = await getUpcomingMatchupForecasts(leagueId).catch(() => ({ week: null, forecasts: [] }));
  const extras = await getWeeklyReportExtras(leagueId, season, week).catch(() => ({
    bestCoach: null,
    worstCoach: null,
    primePlayers: {},
    shitPlayers: {},
    wireTargets: {},
  }));

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ClipboardList size={26} /> Weekly Report
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0, marginBottom: "0.25rem" }}>
        Highest/lowest score, closest matchup and biggest blowout.
      </p>
      <p style={{ color: "var(--text-faint)", fontSize: "0.8rem", marginTop: 0, marginBottom: "1.5rem" }}>
        {new Date().toLocaleDateString("en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </p>

      <CommishPost post={weekPost} />

      {forecasts.length > 0 && (
        <>
          <h2>This Week's Matchups</h2>
          <p style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
            Win % is our own estimate from Sleeper's player projections, not Sleeper's own forecast.
          </p>
          {forecasts.map((f, i) => (
            <MatchupForecastCard key={i} teamA={f.teamA} teamB={f.teamB} />
          ))}
        </>
      )}

      {report.pairs.length === 0 ? (
        <p>No results for this week yet.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            <StatCard
              emoji="🔥"
              label="Highest score"
              value={`${report.highScore.name}`}
              sub={`${report.highScore.points.toFixed(1)} pts`}
            />
            <StatCard
              emoji="🥶"
              label="Lowest score"
              value={`${report.lowScore.name}`}
              sub={`${report.lowScore.points.toFixed(1)} pts`}
            />
            <StatCard
              emoji="🤏"
              label="Closest matchup"
              value={`${report.closest.teamA.name} vs ${report.closest.teamB.name}`}
              sub={`${report.closest.margin} pt difference`}
            />
            <StatCard
              emoji="💣"
              label="Biggest blowout"
              value={`${report.blowout.winner}`}
              sub={`Won by ${report.blowout.margin} pts`}
            />
          </div>

          <h2>Last Week's Results</h2>
          {report.pairs.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                border: "1px solid var(--border-soft)",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "0.5rem",
              }}
            >
              <div>{p.teamA.name}</div>
              <div style={{ fontWeight: "bold" }}>
                {p.teamA.points.toFixed(1)} - {p.teamB.points.toFixed(1)}
              </div>
              <div>{p.teamB.name}</div>
            </div>
          ))}
        </>
      )}

      {(extras.bestCoach || extras.worstCoach) && (
        <>
          <h2 style={{ marginTop: "2rem" }}>
            <ArrowRightLeft size={18} style={{ verticalAlign: "-3px", marginRight: "0.3rem" }} />
            Best / Worst Coach
          </h2>
          <p style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
            Whose lineup swaps from last week paid off the most — and least.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <CoachCard coach={extras.bestCoach} tone="good" />
            <CoachCard coach={extras.worstCoach} tone="bad" />
          </div>
        </>
      )}

      {Object.keys(extras.primePlayers).length > 0 && (
        <>
          <h2>Prime Players</h2>
          <StandoutGroup title="Best per position" icon={TrendingUp} tone="good" data={extras.primePlayers} />
        </>
      )}

      {Object.keys(extras.shitPlayers).length > 0 && (
        <>
          <h2>Shit Players</h2>
          <StandoutGroup title="Worst per position" icon={TrendingDown} tone="bad" data={extras.shitPlayers} />
        </>
      )}

      {Object.keys(extras.wireTargets).length > 0 && (
        <>
          <h2>Wire Targets</h2>
          <p style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
            Free agents who outscored their projection by the most this week.
          </p>
          <StandoutGroup title="Available now" icon={TrendingUp} tone="good" data={extras.wireTargets} />
        </>
      )}
    </main>
  );
}
