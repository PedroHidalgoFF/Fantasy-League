// lib/bustboom.js
// Compara puntos reales vs. proyectados por jugador en una semana, para
// encontrar quién sobre-rindió (Boom) y quién quedó muy por debajo (Bust).
//
// Nota: usa un endpoint de proyecciones de Sleeper que no está en su
// documentación oficial pero es público y estable. Si en algún momento
// deja de funcionar, esta sección es la más fácil de reemplazar por otra fuente.

const PROJECTIONS_BASE = "https://api.sleeper.app/projections/nfl";
const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

async function getJSON(url) {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];
  return res.json();
}

// Proyecciones de todos los jugadores para una semana específica.
// Devuelve un mapa: player_id -> puntos proyectados (formato PPR, el más común)
async function getWeeklyProjections(season, week) {
  const results = await Promise.all(
    POSITIONS.map((pos) =>
      getJSON(`${PROJECTIONS_BASE}/${season}/${week}?season_type=regular&position[]=${pos}`)
    )
  );

  const projectionsByPlayer = {};
  for (const positionResults of results) {
    for (const entry of positionResults) {
      const points = entry.stats?.pts_ppr ?? entry.stats?.pts_std ?? null;
      if (entry.player_id && points !== null) {
        projectionsByPlayer[entry.player_id] = points;
      }
    }
  }
  return projectionsByPlayer;
}

// Combina matchups reales de la semana (que ya traen puntos reales por jugador
// en "players_points") con las proyecciones, y calcula la diferencia.
export async function getBustBoom({ leagueId, week, season, matchups, players, rosterTeamNames }) {
  const projections = await getWeeklyProjections(season, week);

  const results = [];

  for (const teamMatchup of matchups) {
    const teamName = rosterTeamNames[teamMatchup.roster_id] || `Equipo ${teamMatchup.roster_id}`;
    const starters = teamMatchup.starters || [];
    const playersPoints = teamMatchup.players_points || {};

    for (const playerId of starters) {
      if (!playerId || playerId === "0") continue; // huecos vacíos en el lineup

      const actual = playersPoints[playerId];
      const projected = projections[playerId];

      if (actual === undefined || projected === undefined) continue;

      const p = players[playerId];
      const name = p ? `${p.first_name} ${p.last_name}` : `Jugador ${playerId}`;

      results.push({
        playerId,
        name,
        position: p?.position || "?",
        teamName,
        actual,
        projected,
        diff: Math.round((actual - projected) * 10) / 10,
      });
    }
  }

  results.sort((a, b) => b.diff - a.diff);

  return {
    booms: results.slice(0, 5),
    busts: results.slice(-5).reverse(),
  };
}
