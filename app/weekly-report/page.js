import { getWeeklyMatchupData } from "../../lib/sleeper";
import { buildWeeklyReport } from "../../lib/weeklyReport";
import { getPublishedPost } from "../../lib/posts";
import { getUpcomingMatchupForecasts } from "../../lib/matchupForecast";
import { ClipboardList } from "lucide-react";
import { getLeagueId } from "../../lib/session";
import CommishPost from "../components/CommishPost";

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

export default async function WeeklyReportPage() {
  const leagueId = getLeagueId();
  const { matchups, rosterTeamNames, week } = await getWeeklyMatchupData(leagueId);
  const report = buildWeeklyReport(matchups, rosterTeamNames);
  const weekPost = await getPublishedPost("weekly-report", week).catch(() => null);
  const { week: forecastWeek, forecasts } = await getUpcomingMatchupForecasts(leagueId).catch(() => ({ week: null, forecasts: [] }));

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
    </main>
  );
}
