import { getStandings } from "../../lib/sleeper";
import { Users, Star } from "lucide-react";
import TeamLogo from "../components/TeamLogo";
import { getLeagueId, getMyRosterId } from "../../lib/session";

export const dynamic = "force-dynamic";

function YourTeamBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        background: "var(--accent)",
        color: "var(--accent-contrast)",
        padding: "0.1rem 0.5rem",
        borderRadius: "999px",
        fontSize: "0.65rem",
        fontWeight: 700,
        textTransform: "uppercase",
        marginLeft: "0.5rem",
      }}
    >
      <Star size={11} fill="var(--accent-contrast)" /> You
    </span>
  );
}

export default async function TeamsPage() {
  const leagueId = getLeagueId();
  const myRosterId = getMyRosterId();
  const standings = await getStandings(leagueId);

  // Ponemos tu equipo primero en la lista, para que salga automático sin buscarlo
  const sorted = [...standings].sort((a, b) => {
    const aMine = myRosterId && String(a.rosterId) === String(myRosterId);
    const bMine = myRosterId && String(b.rosterId) === String(myRosterId);
    if (aMine && !bMine) return -1;
    if (bMine && !aMine) return 1;
    return 0;
  });

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Users size={26} /> Teams
      </h1>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {sorted.map((team) => {
          const isMine = myRosterId && String(team.rosterId) === String(myRosterId);
          return (
            <a
              key={team.rosterId}
              href={`/teams/${team.rosterId}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.9rem",
                border: isMine ? "1px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: "8px",
                padding: "1rem",
                color: "var(--text)",
                textDecoration: "none",
                background: isMine ? "var(--surface-active)" : "transparent",
              }}
            >
              <TeamLogo avatar={team.avatar} teamName={team.teamName} size={40} />
              <div>
                <strong style={{ display: "flex", alignItems: "center" }}>
                  {team.teamName}
                  {isMine && <YourTeamBadge />}
                </strong>
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  {team.wins}-{team.losses}
                  {team.ties ? `-${team.ties}` : ""} · {team.pointsFor.toFixed(1)} pts
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}
