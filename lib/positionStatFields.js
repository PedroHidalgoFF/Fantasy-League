// lib/positionStatFields.js
// Qué métricas mostrar según la posición, en el orden que aparecen en la
// tabla de comparación. Algunas son campos directos de Sleeper (pass_yd),
// otras son calculadas (total_yd = suma de yardas terrestres + de recepción).
//
// lowerIsBetter: para intercepciones, donde un número más bajo es mejor —
// afecta tanto el ranking como el color de la pastilla.

function sum(stats, ...keys) {
  return keys.reduce((total, k) => total + (stats[k] || 0), 0);
}

function ratio(stats, numKey, denKey) {
  const den = stats[denKey] || 0;
  return den > 0 ? Math.round((stats[numKey] || 0) / den * 100) / 100 : 0;
}

export const METRICS_BY_POSITION = {
  QB: [
    { key: "pts_ppr", label: "PPR Points" },
    { key: "pass_yd", label: "Pass Yds" },
    { key: "pass_td", label: "Pass TD" },
    { key: "pass_int", label: "INT", lowerIsBetter: true },
    { key: "pass_cmp", label: "Comp" },
    { key: "pass_att", label: "Att" },
    { key: "rush_yd", label: "Rush Yds" },
    { key: "rush_td", label: "Rush TD" },
  ],
  RB: [
    { key: "pts_ppr", label: "PPR Points" },
    { key: "rush_att", label: "Rush Attempts" },
    { key: "rush_yd", label: "Rushing Yards" },
    { key: "ypc", label: "Yards/Carry", derive: (s) => ratio(s, "rush_yd", "rush_att") },
    { key: "rec_tgt", label: "Targets" },
    { key: "rec_yd", label: "Receiving Yards" },
    { key: "total_td", label: "Total TDs", derive: (s) => sum(s, "rush_td", "rec_td") },
    { key: "total_yd", label: "Total Yards", derive: (s) => sum(s, "rush_yd", "rec_yd") },
  ],
  WR: [
    { key: "pts_ppr", label: "PPR Points" },
    { key: "rec_tgt", label: "Targets" },
    { key: "rec", label: "Receptions" },
    { key: "rec_yd", label: "Receiving Yards" },
    { key: "ypr", label: "Yards/Reception", derive: (s) => ratio(s, "rec_yd", "rec") },
    { key: "rec_td", label: "Receiving TD" },
    { key: "rush_yd", label: "Rush Yards" },
    { key: "total_yd", label: "Total Yards", derive: (s) => sum(s, "rush_yd", "rec_yd") },
  ],
  TE: [
    { key: "pts_ppr", label: "PPR Points" },
    { key: "rec_tgt", label: "Targets" },
    { key: "rec", label: "Receptions" },
    { key: "rec_yd", label: "Receiving Yards" },
    { key: "ypr", label: "Yards/Reception", derive: (s) => ratio(s, "rec_yd", "rec") },
    { key: "rec_td", label: "Receiving TD" },
  ],
  K: [
    { key: "pts_ppr", label: "PPR Points" },
    { key: "fgm", label: "FG Made" },
    { key: "fga", label: "FG Att" },
    { key: "xpm", label: "XP Made" },
    { key: "xpa", label: "XP Att" },
  ],
  DEF: [
    { key: "pts_ppr", label: "PPR Points" },
    { key: "sack", label: "Sacks" },
    { key: "int", label: "INT" },
    { key: "fum_rec", label: "Fumble Rec" },
    { key: "def_td", label: "DEF TD" },
    { key: "pts_allow", label: "Pts Allowed", lowerIsBetter: true },
  ],
};

export function getMetricValue(metric, stats) {
  if (metric.derive) return metric.derive(stats);
  return stats[metric.key] || 0;
}
