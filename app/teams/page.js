import { getStandings } from "../../lib/sleeper";
import { Users } from "lucide-react";
import TeamLogo from "../components/TeamLogo";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const standings = await getStandings(leagueId);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Users size={26} /> Teams
      </h1>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {standings.map((team) => (
          <a
            key={team.rosterId}
            href={`/teams/${team.rosterId}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.9rem",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "1rem",
              color: "var(--text)",
              textDecoration: "none",
            }}
          >
            <TeamLogo avatar={team.avatar} teamName={team.teamName} size={40} />
            <div>
              <strong>{team.teamName}</strong>
              <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                {team.wins}-{team.losses}
                {team.ties ? `-${team.ties}` : ""} · {team.pointsFor.toFixed(1)} pts
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
