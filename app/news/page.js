import { getLeagueRosters, getAllPlayers } from "../../lib/sleeper";
import {
import { getLeagueId } from "../../lib/session";
  getESPNNews,
  getLeaguePlayerLastNames,
  filterNewsForLeague,
  buildRelevantPlayerIndex,
  findFeaturedPlayerForArticle,
} from "../../lib/news";
import { Newspaper } from "lucide-react";
import NewsRow from "../components/NewsRow";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const leagueId = getLeagueId();

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
  const playerIndex = buildRelevantPlayerIndex(players);

  // Noticias generales de la NFL que no involucran a tu liga, para que la
  // página siempre tenga contenido aunque tu liga sea nueva.
  const leagueNewsLinks = new Set(leagueNews.map((n) => n.link));
  const generalNews = allNews.filter((n) => !leagueNewsLinks.has(n.link));

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Newspaper size={26} /> News
      </h1>

      <h2 style={{ marginTop: "1.5rem" }}>Your League</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Filtered from the latest ESPN NFL news to show only what involves
        players on your league's rosters.
      </p>

      {leagueNews.length === 0 ? (
        <p style={{ color: "var(--text-faint)", fontSize: "0.85rem" }}>
          No recent news mentioning players from your league right now — check the
          general NFL news below in the meantime.
        </p>
      ) : (
        leagueNews.map((item, i) => (
          <NewsRow key={i} item={item} matchedPlayer={findFeaturedPlayerForArticle(item, playerIndex)} />
        ))
      )}

      <h2 style={{ marginTop: "2rem" }}>Top NFL News</h2>
      {generalNews.map((item, i) => (
        <NewsRow key={i} item={item} matchedPlayer={findFeaturedPlayerForArticle(item, playerIndex)} />
      ))}
    </main>
  );
}
