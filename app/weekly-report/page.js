import { getWeeklyMatchupData } from "../../lib/sleeper";
import { buildWeeklyReport } from "../../lib/weeklyReport";
import { getPublishedPost } from "../../lib/posts";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

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
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const { matchups, rosterTeamNames, week } = await getWeeklyMatchupData(leagueId);
  const report = buildWeeklyReport(matchups, rosterTeamNames);
  const weekPost = await getPublishedPost("weekly-report", week).catch(() => null);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ClipboardList size={26} /> Weekly Report
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 0, marginBottom: "1.5rem" }}>
        {new Date().toLocaleDateString("en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </p>

      {weekPost && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1.25rem",
            marginBottom: "1.5rem",
            color: "var(--text-soft)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {weekPost.content}
        </div>
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

          <h2>All Matchups</h2>
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
