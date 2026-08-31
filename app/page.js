import { getLeague, getStandings, getAllPlayers } from "../lib/sleeper";
import { getPublishedPost } from "../lib/posts";
import { getESPNNews, buildRelevantPlayerIndex, findFeaturedPlayerForArticle } from "../lib/news";
import { relativeTime } from "../lib/relativeTime";
import { Trophy, ClipboardList, Target, Zap, Swords, Users, Star, Newspaper, ArrowUpRight, Radio, Medal, Rows3 } from "lucide-react";
import NewsList from "./components/NewsList";
import TeamLogo from "./components/TeamLogo";
import CommishPost from "./components/CommishPost";
import WidgetBanner from "./components/WidgetBanner";
import { getLeagueId } from "../lib/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/scores", icon: Radio, title: "Scores", color: "#ef4444" },
  { href: "/power-rankings", icon: Trophy, title: "Power Rankings", color: "#6fbf1f" },
  { href: "/weekly-report", icon: ClipboardList, title: "Weekly Report", color: "#3b82f6" },
  { href: "/waiver-wins", icon: Target, title: "Waiver Wins", color: "#14b8a6" },
  { href: "/bustboom", icon: Zap, title: "Bust/Boom", color: "#f97316" },
  { href: "/head-to-head", icon: Swords, title: "Head-to-Head", color: "#ec4899" },
  { href: "/teams", icon: Users, title: "Teams", color: "#6366f1" },
  { href: "/top-players", icon: Star, title: "Top 300", color: "#f59e0b" },
  { href: "/players", icon: Rows3, title: "Player Stats", color: "#a855f7" },
  { href: "/news", icon: Newspaper, title: "News", color: "#0ea5e9" },
];

export default async function HomePage() {
  const leagueId = getLeagueId();

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          padding: "1.25rem 0 1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <img
            src={league?.avatar ? `https://sleepercdn.com/avatars/thumbs/${league.avatar}` : "/logo-mark.png"}
            alt=""
            width={40}
            height={40}
            style={{ width: 40, height: 40, borderRadius: "10px", objectFit: "cover" }}
          />
          <div>
            <div style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 700, fontSize: "1.15rem", lineHeight: 1.1 }}>
              {league?.name || "My Fantasy Football League"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              {league?.season ? `Season ${league.season}` : ""}
            </div>
          </div>
        </div>

        {topTeam && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Medal size={20} color="var(--accent)" />
            <TeamLogo avatar={topTeam.avatar} teamName={topTeam.teamName} size={28} />
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{topTeam.teamName}</span>
          </div>
        )}
      </div>

      <WidgetBanner />

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
            background: (() => {
              const bgImage =
                featured.image ||
                (featuredPlayer
                  ? `https://sleepercdn.com/content/nfl/players/${featuredPlayer.playerId}.jpg`
                  : null);
              return bgImage
                ? `linear-gradient(0deg, rgba(13,13,13,0.92) 10%, rgba(13,13,13,0.35) 60%, rgba(13,13,13,0.15) 100%), url(${bgImage}) center/cover no-repeat`
                : "var(--sidebar-bg)";
            })(),
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
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.25rem 0.5rem",
          marginBottom: "2rem",
          maxWidth: "420px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                color: "var(--text)",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: `${s.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={26} color={s.color} />
              </div>
              <span style={{ fontSize: "0.78rem", fontWeight: 500, textAlign: "center", lineHeight: 1.2 }}>
                {s.title}
              </span>
            </Link>
          );
        })}
      </div>

      <CommishPost post={homePost} />

      {restOfNews.length > 0 && (
        <>
          <h2>Latest News</h2>
          <NewsList
            entries={restOfNews.map((item) => ({ item, matchedPlayer: findFeaturedPlayerForArticle(item, playerIndex) }))}
          />
          <Link href="/news" style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600 }}>
            See all news →
          </Link>
        </>
      )}
    </main>
  );
}
