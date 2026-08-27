import { getLeague, getStandings } from "../lib/sleeper";
import { getPublishedPost } from "../lib/posts";
import { Trophy, ClipboardList, Repeat, Target, Zap, Swords, Users, Star, Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    href: "/power-rankings",
    icon: Trophy,
    title: "Power Rankings",
    description: "Weekly ranking calculated from record and points for.",
  },
  {
    href: "/weekly-report",
    icon: ClipboardList,
    title: "Weekly Report",
    description: "Highest/lowest score, closest matchup and biggest blowout.",
  },
  {
    href: "/trades",
    icon: Repeat,
    title: "Trades",
    description: "Full trade history for the season.",
  },
  {
    href: "/waiver-wins",
    icon: Target,
    title: "Waiver Wins",
    description: "The best waiver pickups, ranked by points.",
  },
  {
    href: "/bustboom",
    icon: Zap,
    title: "Bust/Boom",
    description: "Who overperformed and who fell short this week.",
  },
  {
    href: "/head-to-head",
    icon: Swords,
    title: "Head-to-Head",
    description: "Matchup history between every pair of teams.",
  },
  {
    href: "/teams",
    icon: Users,
    title: "Teams",
    description: "Roster, record, and trades for each team in the league.",
  },
  {
    href: "/top-players",
    icon: Star,
    title: "Top 300 Players",
    description: "The most relevant players, with points and availability.",
  },
  {
    href: "/news",
    icon: Newspaper,
    title: "News",
    description: "Latest ESPN news filtered to your league's players.",
  },
];

export default async function HomePage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  let league = null;
  let topTeam = null;
  let homePost = null;
  try {
    const [leagueData, standings, post] = await Promise.all([
      getLeague(leagueId),
      getStandings(leagueId),
      getPublishedPost("home"),
    ]);
    league = leagueData;
    topTeam = standings[0] || null;
    homePost = post;
  } catch {
    // If it fails, we still show the menu
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "2rem 0 1rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>
          {league?.name || "My Fantasy Football League"}
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          {league?.season ? `Season ${league.season}` : ""}
          {topTeam ? ` · Leading: ${topTeam.teamName}` : ""}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <a
              key={s.href}
              href={s.href}
              style={{
                display: "block",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1.25rem",
                textDecoration: "none",
                color: "var(--text)",
                background: "var(--surface)",
                transition: "border-color 0.15s ease",
              }}
            >
              <Icon size={28} color="var(--accent)" style={{ marginBottom: "0.5rem" }} />
              <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>{s.title}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{s.description}</div>
            </a>
          );
        })}
      </div>

      {homePost && (
        <div
          style={{
            marginTop: "2rem",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1.25rem",
            color: "var(--text-soft)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {homePost.content}
        </div>
      )}
    </main>
  );
}
