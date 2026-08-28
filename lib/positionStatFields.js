// lib/positionStatFields.js
// Qué categorías de estadística mostrar según la posición — así comparamos
// QB con QB (yardas por pase, TDs, INTs) y no QB con RB.
//
// Nota honesta: los nombres exactos de los campos de Sleeper para QB/RB/WR/TE
// están bien documentados por la comunidad de desarrolladores de fantasy y
// coinciden con la convención que ya confirmamos funciona en este proyecto
// (pts_ppr, pts_std). Los de K y DEF son menos seguros — por eso
// playerStats.js tiene un respaldo: si ninguno de estos campos aparece en
// los datos reales de un jugador, muestra automáticamente cualquier
// estadística numérica que sí venga, en vez de una tabla vacía.

export const STAT_FIELDS_BY_POSITION = {
  QB: [
    { key: "pass_yd", label: "Pass Yds" },
    { key: "pass_td", label: "Pass TD" },
    { key: "pass_int", label: "INT" },
    { key: "pass_cmp", label: "Comp" },
    { key: "pass_att", label: "Att" },
    { key: "rush_yd", label: "Rush Yds" },
    { key: "rush_td", label: "Rush TD" },
  ],
  RB: [
    { key: "rush_att", label: "Carries" },
    { key: "rush_yd", label: "Rush Yds" },
    { key: "rush_td", label: "Rush TD" },
    { key: "rec", label: "Rec" },
    { key: "rec_yd", label: "Rec Yds" },
    { key: "rec_td", label: "Rec TD" },
    { key: "fum_lost", label: "Fumbles Lost" },
  ],
  WR: [
    { key: "rec_tgt", label: "Targets" },
    { key: "rec", label: "Rec" },
    { key: "rec_yd", label: "Rec Yds" },
    { key: "rec_td", label: "Rec TD" },
    { key: "rush_yd", label: "Rush Yds" },
  ],
  TE: [
    { key: "rec_tgt", label: "Targets" },
    { key: "rec", label: "Rec" },
    { key: "rec_yd", label: "Rec Yds" },
    { key: "rec_td", label: "Rec TD" },
  ],
  K: [
    { key: "fgm", label: "FG Made" },
    { key: "fga", label: "FG Att" },
    { key: "xpm", label: "XP Made" },
    { key: "xpa", label: "XP Att" },
  ],
  DEF: [
    { key: "sack", label: "Sacks" },
    { key: "int", label: "INT" },
    { key: "fum_rec", label: "Fumble Rec" },
    { key: "def_td", label: "DEF TD" },
    { key: "pts_allow", label: "Pts Allowed" },
  ],
};

// Convierte una clave tipo "rec_tgt" en una etiqueta legible, para cuando
// mostramos un campo que no está en la lista curada de arriba.
export function prettifyStatKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
