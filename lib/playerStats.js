// lib/playerStats.js
const STATS_BASE = "https://api.sleeper.app/stats/nfl";
const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

function positionQueryString() {
  return POSITIONS.map((p) => `position[]=${p}`).join("&");
}

async function getJSON(url) {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];
  return res.json();
}

// Suma TODAS las estadísticas numéricas (no solo pts_ppr) de cada jugador,
// semana por semana — pases, yardas, TDs, recepciones, todo lo que Sleeper
// traiga en su objeto "stats" — y cuenta en cuántas semanas jugó cada quien
// (para poder calcular promedios, no solo totales).
export async function getSeasonStatBreakdown(season, throughWeek) {
  const weeks = Array.from({ length: Math.max(throughWeek, 0) }, (_, i) => i + 1);
  if (weeks.length === 0) return { totals: {}, gamesPlayed: {} };

  const weeklyResults = await Promise.all(
    weeks.map((w) => getJSON(`${STATS_BASE}/${season}/${w}?season_type=regular&${positionQueryString()}`))
  );

  const totals = {};
  const gamesPlayed = {};
  for (const weekData of weeklyResults) {
    for (const entry of weekData) {
      if (!entry.player_id || !entry.stats) continue;
      gamesPlayed[entry.player_id] = (gamesPlayed[entry.player_id] || 0) + 1;
      if (!totals[entry.player_id]) totals[entry.player_id] = {};
      for (const [key, value] of Object.entries(entry.stats)) {
        if (typeof value !== "number") continue;
        totals[entry.player_id][key] = Math.round(((totals[entry.player_id][key] || 0) + value) * 100) / 100;
      }
    }
  }
  return { totals, gamesPlayed };
}
