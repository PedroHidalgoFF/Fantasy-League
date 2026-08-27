import { getWaiverWireWins } from "../../lib/waiverWins";
import { Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WaiverWinsPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const wins = await getWaiverWireWins(leagueId);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>

      <h1 style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><Target size={26} /> Waiver Wire Wins</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Players added via waiver or free agent, ranked by total points
        accumulated since they were added. Early in the season, so this
        list will keep growing.
      </p>

      {wins.length === 0 && (
        <p style={{ marginTop: "1.5rem" }}>
          Not enough weeks yet to calculate this. Check back soon.
        </p>
      )}

      {wins.map((w, i) => (
        <div
          key={w.playerId}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            marginBottom: "0.5rem",
          }}
        >
          <div>
            <span style={{ color: "var(--text-muted)", marginRight: "0.5rem" }}>#{i + 1}</span>
            <strong>{w.name}</strong>{" "}
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {w.position} · {w.teamName} · added week {w.weekAdded}
            </span>
          </div>
          <div style={{ fontWeight: "bold" }}>{w.totalPoints} pts</div>
        </div>
      ))}
    </main>
  );
}
