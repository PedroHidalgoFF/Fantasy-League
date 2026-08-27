import { getLeague, getStandings, getAllPlayers } from "../lib/sleeper";
import { getPublishedPost } from "../lib/posts";
import { getESPNNews, buildRelevantPlayerIndex, findFeaturedPlayerForArticle } from "../lib/news";
import { relativeTime } from "../lib/relativeTime";
import { Trophy, ClipboardList, Repeat, Target, Zap, Swords, Users, Star, Newspaper, ArrowUpRight } from "lucide-react";
import NewsRow from "./components/NewsRow";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/power-rankings", icon: Trophy, title: "Power Rankings", description: "Weekly ranking calculated from record and points for." },
  { href: "/weekly-report", icon: ClipboardList, title: "Weekly Report", description: "Highest/lowest score, closest matchup and biggest blowout." },
  { href: "/trades", icon: Repeat, title: "Trades", description: "Full trade history for the season." },
  { href: "/waiver-wins", icon: Target, title: "Waiver Wins", description: "The best waiver pickups, ranked by points." },
  { href: "/bustboom", icon: Zap, title: "Bust/Boom", description: "Who overperformed and who fell short this week." },
  { href: "/head-to-head", icon: Swords, title: "Head-to-Head", description: "Matchup history between every pair of teams." },
  { href: "/teams", icon: Users, title: "Teams", description: "Roster, record, and trades for each team in the league." },
  { href: "/top-players", icon: Star, title: "Top 300 Players", description: "The most relevant players, with points and availability." },
  { href: "/news", icon: Newspaper, title: "News", description: "Latest NFL news, plus what's happening with your league's players." },
];

export default async function HomePage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  let league = null;
  let topTeam = null;
  let homePost = null;
  let newsItems = [];
  let playerIndex = [];

  try {
    const [leagueData, standings, post, news, players] = await Promise.all([
      getLeague(leagueId),
      getStandings(leagueId),
      getPublishedPost("home"),
      getESPNNews().catch(() => []),
      getAllPlayers().catch(() => ({})),
    ]);
    league = leagueData;
    topTeam = standings[0] || null;
    homePost = post;
    newsItems = news;
    playerIndex = buildRelevantPlayerIndex(players);
  } catch {
    // If it fails, we still show the menu
  }

  const featured = newsItems[0] || null;
  const featuredPlayer = featured ? findFeaturedPlayerForArticle(featured, playerIndex) : null;
  const restOfNews = newsItems.slice(1, 6);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "1.5rem 0 1rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>
          {league?.name || "My Fantasy Football League"}
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          {league?.season ? `Season ${league.season}` : ""}
          {topTeam ? ` · Leading: ${topTeam.teamName}` : ""}
        </p>
      </div>

      {/* Banner destacado con la noticia más reciente */}
      {featured && (
        <a
          href={featured.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            position: "relative",
            borderRadius: "14px",
            overflow: "hidden",
            marginBottom: "1.75rem",
            minHeight: "220px",
            textDecoration: "none",
            background: featured.image
              ? `linear-gradient(0deg, rgba(13,13,13,0.92) 10%, rgba(13,13,13,0.35) 60%, rgba(13,13,13,0.15) 100%), url(${featured.image}) center/cover no-repeat`
              : "var(--sidebar-bg)",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "1.25rem",
            }}
          >
            <span
              style={{
                background: "var(--accent)",
                color: "var(--accent-contrast)",
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "0.15rem 0.5rem",
                borderRadius: "4px",
                textTransform: "uppercase",
                marginRight: "0.5rem",
              }}
            >
              New
            </span>
            <span style={{ color: "#ccc", fontSize: "0.75rem" }}>{relativeTime(featured.pubDate)}</span>
            <h2
              style={{
                color: "#fff",
                border: "none",
                paddingLeft: 0,
                marginTop: "0.5rem",
                marginBottom: "0.5rem",
                fontSize: "1.3rem",
                lineHeight: 1.25,
              }}
            >
              {featured.title}
            </h2>
            <span style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              Read now <ArrowUpRight size={16} />
            </span>
          </div>
        </a>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
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
            marginBottom: "2rem",
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

      {restOfNews.length > 0 && (
        <>
          <h2>Latest News</h2>
          {restOfNews.map((item, i) => (
            <NewsRow key={i} item={item} matchedPlayer={findFeaturedPlayerForArticle(item, playerIndex)} />
          ))}
          <a href="/news" style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600 }}>
            See all news →
          </a>
        </>
      )}
    </main>
  );
}
