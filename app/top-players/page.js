import { getTopPlayers } from "../../lib/topPlayers";

export const dynamic = "force-dynamic";

const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

function FilterLink({ label, active, href }) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        padding: "0.3rem 0.75rem",
        marginRight: "0.5rem",
        marginBottom: "0.5rem",
        borderRadius: "999px",
        border: active ? "1px solid #4ea1f3" : "1px solid #333",
        background: active ? "#1a2a3a" : "transparent",
        color: active ? "#4ea1f3" : "#ccc",
        textDecoration: "none",
        fontSize: "0.85rem",
      }}
    >
      {label}
    </a>
  );
}

export default async function TopPlayersPage({ searchParams }) {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const allTopPlayers = await getTopPlayers(leagueId, 300);

  const position = searchParams?.position || "ALL";
  const onlyAvailable = searchParams?.available === "true";

  const filtered = allTopPlayers.filter((p) => {
    if (position !== "ALL" && p.position !== position) return false;
    if (onlyAvailable && p.leagueOwner) return false;
    return true;
  });

  // Construye la URL manteniendo el otro filtro activo
  const buildUrl = (newPosition, newAvailable) => {
    const params = new URLSearchParams();
    if (newPosition !== "ALL") params.set("position", newPosition);
    if (newAvailable) params.set("available", "true");
    const qs = params.toString();
    return `/top-players${qs ? `?${qs}` : ""}`;
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <nav style={{ marginBottom: "2rem" }}>
        <a href="/" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Power Rankings</a>
        <a href="/trades" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Trades</a>
        <a href="/news" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Noticias</a>
        <a href="/teams" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Equipos</a>
        <a href="/bustboom" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Bust/Boom</a>
        <a href="/weekly-report" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Reporte Semanal</a>
        <a href="/head-to-head" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Head-to-Head</a>
        <a href="/waiver-wins" style={{ color: "#f1f1f1", marginRight: "1.5rem" }}>Waiver Wins</a>
        <a href="/top-players" style={{ color: "#f1f1f1" }}>Top 300</a>
      </nav>

      <h1>⭐ Top 300 jugadores</h1>
      <p style={{ color: "#999", fontSize: "0.85rem" }}>
        Ordenados por relevancia fantasy (ranking interno de Sleeper). Se muestra el
        equipo de tu liga que lo tiene, o "Agente Libre" si nadie lo ha tomado.
      </p>

      <div style={{ marginTop: "1rem" }}>
        <FilterLink label="Todas" active={position === "ALL"} href={buildUrl("ALL", onlyAvailable)} />
        {POSITIONS.map((pos) => (
          <FilterLink
            key={pos}
            label={pos}
            active={position === pos}
            href={buildUrl(pos, onlyAvailable)}
          />
        ))}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <FilterLink
          label={onlyAvailable ? "✓ Solo disponibles (agentes libres)" : "Solo disponibles (agentes libres)"}
          active={onlyAvailable}
          href={buildUrl(position, !onlyAvailable)}
        />
      </div>

      <p style={{ color: "#666", fontSize: "0.8rem" }}>
        Mostrando {filtered.length} de {allTopPlayers.length} jugadores
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
            <th style={{ padding: "0.4rem" }}>#</th>
            <th style={{ padding: "0.4rem" }}>Jugador</th>
            <th style={{ padding: "0.4rem" }}>Pos</th>
            <th style={{ padding: "0.4rem" }}>NFL</th>
            <th style={{ padding: "0.4rem" }}>En tu liga</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, i) => (
            <tr key={p.playerId} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "0.4rem" }}>{i + 1}</td>
              <td style={{ padding: "0.4rem" }}>{p.name}</td>
              <td style={{ padding: "0.4rem" }}>{p.position}</td>
              <td style={{ padding: "0.4rem" }}>{p.nflTeam}</td>
              <td
                style={{
                  padding: "0.4rem",
                  color: p.leagueOwner ? "#4ea1f3" : "#4ade80",
                }}
              >
                {p.leagueOwner || "Disponible"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
