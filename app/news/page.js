import { getLeagueRosters, getAllPlayers } from "../../lib/sleeper";
import { getESPNNews, getLeaguePlayerLastNames, filterNewsForLeague } from "../../lib/news";
import { Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(pubDate) {
  if (!pubDate) return "";
  const d = new Date(pubDate);
  if (isNaN(d)) return pubDate;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function NewsPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  if (!leagueId) {
    return (
      <main>
        <h1>Missing SLEEPER_LEAGUE_ID configuration</h1>
      </main>
    );
  }

  const [rosters, players, allNews] = await Promise.all([
    getLeagueRosters(leagueId),
    getAllPlayers(),
    getESPNNews(),
  ]);

  const lastNames = getLeaguePlayerLastNames(rosters, players);
  const leagueNews = filterNewsForLeague(allNews, lastNames);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Newspaper size={26} /> League News
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Filtered from the latest ESPN NFL news to show only what involves
        players on your league's rosters.
      </p>

      {leagueNews.length === 0 && (
        <p>No recent news mentioning players from your league right now.</p>
      )}

      {leagueNews.map((item, i) => (
        <div
          key={i}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
            {formatDate(item.pubDate)}
          </div>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)", fontWeight: "bold", textDecoration: "none" }}
          >
            {item.title}
          </a>
          <p style={{ marginTop: "0.5rem", color: "var(--text-soft)" }}>{item.description}</p>
          <div style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: "0.5rem" }}>
            Source: ESPN
          </div>
        </div>
      ))}
    </main>
  );
}
