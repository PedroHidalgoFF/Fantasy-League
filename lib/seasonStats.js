// lib/seasonStats.js
// Suma los puntos reales (formato PPR) de cada jugador a lo largo de la
// temporada, y trae la proyección para la próxima semana. Usa los mismos
// endpoints "bulk" (no documentados oficialmente, pero estables) que ya
// usamos en bustboom.js para proyecciones semanales.

const STATS_BASE = "https://api.sleeper.app/stats/nfl";
const PROJECTIONS_BASE = "https://api.sleeper.app/projections/nfl";
const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

function positionQueryString() {
  return POSITIONS.map((p) => `position[]=${p}`).join("&");
}

async function getJSON(url) {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];
  return res.json();
}

// playerId -> puntos totales acumulados en la temporada (semanas 1 a throughWeek)
export async function getSeasonPointsByPlayer(season, throughWeek) {
  const weeks = Array.from({ length: throughWeek }, (_, i) => i + 1);

  const weeklyResults = await Promise.all(
    weeks.map((w) =>
      getJSON(`${STATS_BASE}/${season}/${w}?season_type=regular&${positionQueryString()}`)
    )
  );

  const totals = {};
  for (const weekData of weeklyResults) {
    for (const entry of weekData) {
      const pts = entry.stats?.pts_ppr;
      if (entry.player_id && typeof pts === "number") {
        totals[entry.player_id] = Math.round(((totals[entry.player_id] || 0) + pts) * 10) / 10;
      }
    }
  }
  return totals;
}

// playerId -> puntos proyectados para una semana específica (la próxima a jugarse)
export async function getWeekProjectionsByPlayer(season, week) {
  const data = await getJSON(
    `${PROJECTIONS_BASE}/${season}/${week}?season_type=regular&${positionQueryString()}`
  );

  const projections = {};
  for (const entry of data) {
    const pts = entry.stats?.pts_ppr;
    if (entry.player_id && typeof pts === "number") {
      projections[entry.player_id] = Math.round(pts * 10) / 10;
    }
  }
  return projections;
}
