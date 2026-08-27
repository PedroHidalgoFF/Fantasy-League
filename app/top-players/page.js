import { getTopPlayers } from "../../lib/topPlayers";
import { getInjuryBadge } from "../../lib/injuryBadge";
import { getPositionColor } from "../../lib/positionBadge";

export const dynamic = "force-dynamic";

const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

function SegmentedControl({ options, active, hrefFor }) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        background: "var(--sidebar-bg)",
        borderRadius: "10px",
        padding: "0.25rem",
        gap: "0.15rem",
      }}
    >
      {options.map(({ value, label }) => {
        const isActive = active === value;
        return (
          <a
            key={value}
            href={hrefFor(value)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "7px",
              fontSize: "0.8rem",
              fontWeight: 600,
              textDecoration: "none",
              background: isActive ? "var(--accent)" : "transparent",
              color: isActive ? "var(--accent-contrast)" : "var(--sidebar-text)",
            }}
          >
            {label}
          </a>
        );
      })}
    </div>
  );
}

export default async function TopPlayersPage({ searchParams }) {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const { players: allTopPlayers } = await getTopPlayers(leagueId, 300);

  const position = searchParams?.position || "ALL";
  const onlyAvailable = searchParams?.available === "true";
  const query = (searchParams?.q || "").trim().toLowerCase();

  const filtered = allTopPlayers.filter((p) => {
    if (position !== "ALL" && p.position !== position) return false;
    if (onlyAvailable && p.leagueOwner) return false;
    if (query && !p.name.toLowerCase().includes(query)) return false;
    return true;
  });

  const buildUrl = (newPosition, newAvailable, newQuery) => {
    const params = new URLSearchParams();
    if (newPosition !== "ALL") params.set("position", newPosition);
    if (newAvailable) params.set("available", "true");
    if (newQuery) params.set("q", newQuery);
    const qs = params.toString();
    return `/top-players${qs ? `?${qs}` : ""}`;
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1>⭐ Top 300 jugadores</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Ordenados por relevancia fantasy. "Pts temporada" son puntos PPR reales
        acumulados. "PES" es la proyección para el próximo partido.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          marginTop: "1rem",
          marginBottom: "0.75rem",
        }}
      >
        <SegmentedControl
          active={position}
          options={[{ value: "ALL", label: "Todas" }, ...POSITIONS.map((p) => ({ value: p, label: p }))]}
          hrefFor={(value) => buildUrl(value, onlyAvailable, query)}
        />

        <SegmentedControl
          active={onlyAvailable ? "AVAILABLE" : "ALL_TEAMS"}
          options={[
            { value: "ALL_TEAMS", label: "Todos" },
            { value: "AVAILABLE", label: "Solo disponibles" },
          ]}
          hrefFor={(value) => buildUrl(position, value === "AVAILABLE", query)}
        />

        <form action="/top-players" method="GET" style={{ flex: "1 1 220px", minWidth: "200px" }}>
          {position !== "ALL" && <input type="hidden" name="position" value={position} />}
          {onlyAvailable && <input type="hidden" name="available" value="true" />}
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar jugador..."
            style={{
              width: "100%",
              padding: "0.5rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.9rem",
            }}
          />
        </form>
      </div>

      <p style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>
        Mostrando {filtered.length} de {allTopPlayers.length} jugadores
      </p>
      <p style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>
        ⚠️ Cuestionable/No disponible · 🟠 Dudoso · ❌ Fuera esta semana · 🏥 IR/PUP ·
        🚫 Suspendido — pasa el cursor sobre el ícono para ver el detalle.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.75rem" }}>
        <thead>
          <tr>
            <th style={{ padding: "0.5rem" }}>#</th>
            <th style={{ padding: "0.5rem" }}></th>
            <th style={{ padding: "0.5rem" }}>Jugador</th>
            <th style={{ padding: "0.5rem" }}>Pos</th>
            <th style={{ padding: "0.5rem" }}>NFL</th>
            <th style={{ padding: "0.5rem" }}>Pts temporada</th>
            <th style={{ padding: "0.5rem", cursor: "help" }} title="Puntos Esperados esta Semana">
              PES
            </th>
            <th style={{ padding: "0.5rem" }}>En tu liga</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, i) => {
            const badge = getInjuryBadge(p.injuryStatus);
            const posColor = getPositionColor(p.position);
            return (
              <tr key={p.playerId}>
                <td style={{ padding: "0.5rem", color: "var(--text-faint)" }}>{i + 1}</td>
                <td style={{ padding: "0.5rem" }}>
                  <img
                    src={`https://sleepercdn.com/content/nfl/players/${p.playerId}.jpg`}
                    alt=""
                    width={32}
                    height={32}
                    loading="lazy"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      objectFit: "cover",
                      background: "var(--border-soft)",
                      display: "block",
                    }}
                  />
                </td>
                <td style={{ padding: "0.5rem" }}>
                  {p.name}
                  {badge && (
                    <span title={badge.label} style={{ marginLeft: "0.4rem", cursor: "help" }}>
                      {badge.icon}
                    </span>
                  )}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <span
                    style={{
                      background: posColor.bg,
                      color: posColor.color,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {p.position}
                  </span>
                </td>
                <td style={{ padding: "0.5rem", color: "var(--text-muted)" }}>{p.nflTeam}</td>
                <td style={{ padding: "0.5rem", fontWeight: 600 }}>{p.seasonPoints}</td>
                <td style={{ padding: "0.5rem" }}>
                  {p.nextGameProjection !== null ? p.nextGameProjection : "—"}
                </td>
                <td
                  style={{
                    padding: "0.5rem",
                    color: p.leagueOwner ? "var(--accent)" : "var(--success)",
                    fontWeight: 500,
                  }}
                >
                  {p.leagueOwner || "Disponible"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
