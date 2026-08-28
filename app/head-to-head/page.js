import { getHeadToHeadRecords } from "../../lib/headToHead";
import { Swords } from "lucide-react";
import { getLeagueId } from "../../lib/session";
import CommishPost from "../components/CommishPost";
import { getPublishedPost } from "../../lib/posts";

export const dynamic = "force-dynamic";

export default async function HeadToHeadPage() {
  const leagueId = getLeagueId();
  const rivalries = await getHeadToHeadRecords(leagueId);
  const post = await getPublishedPost("head-to-head").catch(() => null);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>

      <h1 style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><Swords size={26} /> Head-to-Head</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Matchup history between every pair of teams this season. Since it's
        early in the year, most will show just 1 game — this grows as
        rematches happen.
      </p>

      <CommishPost post={post} />

      {rivalries.length === 0 && (
        <p style={{ marginTop: "1.5rem" }}>No matchups recorded yet.</p>
      )}

      {rivalries.map((r, i) => (
        <div
          key={i}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>
              {r.teamAName} vs {r.teamBName}
            </strong>
            <span style={{ color: "var(--text-muted)" }}>
              {r.teamAWins}-{r.teamBWins}
              {r.ties ? `-${r.ties}` : ""}
            </span>
          </div>

          <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-soft)" }}>
            {r.games.map((g, j) => (
              <div key={j}>
                Week {g.week}: {g.aScore.toFixed(1)} - {g.bScore.toFixed(1)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
