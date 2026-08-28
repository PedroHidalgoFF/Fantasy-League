import { NextResponse } from "next/server";
import { getAllPlayers, getRegularSeasonState } from "../../../../lib/sleeper";
import { getSeasonStatBreakdown } from "../../../../lib/playerStats";
import { getPlayerImageUrl } from "../../../../lib/teamLogo";
import { METRICS_BY_POSITION, getMetricValue } from "../../../../lib/positionStatFields";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);
  const mode = searchParams.get("mode") === "total" ? "total" : "average";

  if (ids.length === 0) return NextResponse.json({ players: [] });

  try {
    const { season, lastCompletedWeek } = await getRegularSeasonState();
    const [players, { totals, gamesPlayed }] = await Promise.all([
      getAllPlayers(),
      getSeasonStatBreakdown(season, lastCompletedWeek),
    ]);

    const position = players[ids[0]]?.position;
    const metrics = METRICS_BY_POSITION[position] || [];

    // Universo de comparación: jugadores relevantes (con search_rank) de la
    // MISMA posición, que sí jugaron al menos una semana esta temporada.
    const peerIds = Object.entries(players)
      .filter(([id, p]) => p.position === position && typeof p.search_rank === "number" && totals[id])
      .map(([id]) => id);

    function valueFor(playerId, metric) {
      const stats = totals[playerId] || {};
      const raw = getMetricValue(metric, stats);
      if (mode === "average") {
        const games = gamesPlayed[playerId] || 0;
        return games > 0 ? Math.round((raw / games) * 100) / 100 : 0;
      }
      return raw;
    }

    // Para cada métrica, ordenamos a todos los peers para sacar el rank y
    // el "tier" de color (tercio superior/medio/inferior) de cada jugador.
    const rankingsByMetric = {};
    for (const metric of metrics) {
      const sorted = peerIds
        .map((id) => ({ id, value: valueFor(id, metric) }))
        .sort((a, b) => (metric.lowerIsBetter ? a.value - b.value : b.value - a.value));

      const n = sorted.length;
      const ranks = {};
      sorted.forEach((entry, index) => {
        const percentile = n > 1 ? index / (n - 1) : 0; // 0 = mejor, 1 = peor
        const tier = percentile <= 0.33 ? "good" : percentile <= 0.66 ? "mid" : "low";
        ranks[entry.id] = { rank: index + 1, tier };
      });
      rankingsByMetric[metric.key] = ranks;
    }

    const result = ids.map((id) => {
      const p = players[id];
      const games = gamesPlayed[id] || 0;
      return {
        playerId: id,
        name: p ? `${p.first_name} ${p.last_name}` : `Player ${id}`,
        position: p?.position || "?",
        nflTeam: p?.team || "FA",
        image: getPlayerImageUrl(id, p?.position, p?.team),
        gamesPlayed: games,
        overallPositionRank: rankingsByMetric.pts_ppr?.[id]?.rank || null,
        metrics: metrics.map((metric) => ({
          key: metric.key,
          label: metric.label,
          value: valueFor(id, metric),
          rank: rankingsByMetric[metric.key]?.[id]?.rank ?? null,
          tier: rankingsByMetric[metric.key]?.[id]?.tier ?? null,
        })),
      };
    });

    return NextResponse.json({ players: result, week: lastCompletedWeek, season, mode });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
