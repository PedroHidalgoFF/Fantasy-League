import { getLeague, getStandings } from "../lib/sleeper";
import { getPublishedPost } from "../lib/posts";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    href: "/power-rankings",
    emoji: "🏈",
    title: "Power Rankings",
    description: "Ranking semanal calculado con récord y puntos a favor.",
  },
  {
    href: "/weekly-report",
    emoji: "📋",
    title: "Reporte Semanal",
    description: "Puntuación más alta/baja, enfrentamiento más cerrado y mayor paliza.",
  },
  {
    href: "/trades",
    emoji: "🔁",
    title: "Trades",
    description: "Historial completo de intercambios de la temporada.",
  },
  {
    href: "/waiver-wins",
    emoji: "🎯",
    title: "Waiver Wins",
    description: "Los mejores pickups de waiver, rankeados por puntos.",
  },
  {
    href: "/bustboom",
    emoji: "💥",
    title: "Bust/Boom",
    description: "Quién sobre-rindió y quién se quedó corto esta semana.",
  },
  {
    href: "/head-to-head",
    emoji: "⚔️",
    title: "Head-to-Head",
    description: "Historial de enfrentamientos entre cada par de equipos.",
  },
  {
    href: "/teams",
    emoji: "👥",
    title: "Equipos",
    description: "Roster, récord y trades de cada equipo de la liga.",
  },
  {
    href: "/top-players",
    emoji: "⭐",
    title: "Top 300 Jugadores",
    description: "Los jugadores más relevantes, con puntos y disponibilidad.",
  },
  {
    href: "/news",
    emoji: "📰",
    title: "Noticias",
    description: "Últimas noticias de ESPN filtradas a jugadores de tu liga.",
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
    // Si falla, seguimos mostrando el menú igual
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "2rem 0 1rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>
          🏆 {league?.name || "Mi Liga de Fantasy Football"}
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          {league?.season ? `Temporada ${league.season}` : ""}
          {topTeam ? ` · Al frente: ${topTeam.teamName}` : ""}
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
        {SECTIONS.map((s) => (
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
            <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{s.emoji}</div>
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>{s.title}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{s.description}</div>
          </a>
        ))}
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
