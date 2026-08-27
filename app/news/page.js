import { getLeagueRosters, getAllPlayers } from "../../lib/sleeper";
import { getESPNNews, getLeaguePlayerLastNames, filterNewsForLeague } from "../../lib/news";

export const dynamic = "force-dynamic";

function formatDate(pubDate) {
  if (!pubDate) return "";
  const d = new Date(pubDate);
  if (isNaN(d)) return pubDate;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function NewsPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  if (!leagueId) {
    return (
      <main>
        <h1>Falta configurar SLEEPER_LEAGUE_ID</h1>
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
      <nav style={{ marginBottom: "2rem" }}>
        <a href="/" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Inicio</a>
        <a href="/power-rankings" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Power Rankings</a>
        <a href="/trades" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Trades</a>
        <a href="/news" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Noticias</a>
        <a href="/teams" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Equipos</a>
        <a href="/bustboom" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Bust/Boom</a>
        <a href="/weekly-report" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Reporte Semanal</a>
        <a href="/head-to-head" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Head-to-Head</a>
        <a href="/waiver-wins" style={{ color: "var(--text)", marginRight: "1.5rem" }}>Waiver Wins</a>
        <a href="/top-players" style={{ color: "var(--text)" }}>Top 300</a>
      </nav>

      <h1>📰 Noticias de tu liga</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Filtradas de las últimas noticias de ESPN NFL para mostrar solo lo que involucra
        a jugadores en los rosters de tu liga.
      </p>

      {leagueNews.length === 0 && (
        <p>No hay noticias recientes que mencionen a jugadores de tu liga ahorita.</p>
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
            Fuente: ESPN
          </div>
        </div>
      ))}
    </main>
  );
}
