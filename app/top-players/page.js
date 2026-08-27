import { getTopPlayers } from "../../lib/topPlayers";
import { getInjuryBadge } from "../../lib/injuryBadge";

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
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--surface-active)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-soft)",
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
  const { players: allTopPlayers, nextWeek } = await getTopPlayers(leagueId, 300);

  const position = searchParams?.position || "ALL";
  const onlyAvailable = searchParams?.available === "true";

  const filtered = allTopPlayers.filter((p) => {
    if (position !== "ALL" && p.position !== position) return false;
    if (onlyAvailable && p.leagueOwner) return false;
    return true;
  });

  const buildUrl = (newPosition, newAvailable) => {
    const params = new URLSearchParams();
    if (newPosition !== "ALL") params.set("position", newPosition);
    if (newAvailable) params.set("available", "true");
    const qs = params.toString();
    return `/top-players${qs ? `?${qs}` : ""}`;
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>

      <h1>⭐ Top 300 jugadores</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Ordenados por relevancia fantasy (ranking interno de Sleeper). "Pts temporada"
        son puntos PPR reales acumulados. "PES" (Puntos Esperados esta Semana) es la
        proyección para el próximo partido — puede salir vacío si el jugador tiene bye
        o no hay proyección disponible todavía.
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

      <p style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>
        Mostrando {filtered.length} de {allTopPlayers.length} jugadores
      </p>
      <p style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>
        ⚠️ Cuestionable/No disponible · 🟠 Dudoso · ❌ Fuera esta semana · 🏥 IR/PUP ·
        🚫 Suspendido — pasa el cursor sobre el ícono para ver el detalle.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "0.4rem" }}>#</th>
            <th style={{ padding: "0.4rem" }}>Jugador</th>
            <th style={{ padding: "0.4rem" }}>Pos</th>
            <th style={{ padding: "0.4rem" }}>NFL</th>
            <th style={{ padding: "0.4rem" }}>Pts temporada</th>
            <th style={{ padding: "0.4rem", cursor: "help" }} title="Puntos Esperados esta Semana">
              PES
            </th>
            <th style={{ padding: "0.4rem" }}>En tu liga</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, i) => {
            const badge = getInjuryBadge(p.injuryStatus);
            return (
              <tr key={p.playerId} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <td style={{ padding: "0.4rem" }}>{i + 1}</td>
                <td style={{ padding: "0.4rem" }}>
                  {p.name}
                  {badge && (
                    <span title={badge.label} style={{ marginLeft: "0.4rem", cursor: "help" }}>
                      {badge.icon}
                    </span>
                  )}
                </td>
                <td style={{ padding: "0.4rem" }}>{p.position}</td>
                <td style={{ padding: "0.4rem" }}>{p.nflTeam}</td>
                <td style={{ padding: "0.4rem" }}>{p.seasonPoints}</td>
                <td style={{ padding: "0.4rem" }}>
                  {p.nextGameProjection !== null ? p.nextGameProjection : "—"}
                </td>
                <td
                  style={{
                    padding: "0.4rem",
                    color: p.leagueOwner ? "var(--accent)" : "var(--success)",
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
