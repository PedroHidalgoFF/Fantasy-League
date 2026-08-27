// lib/positionBadge.js
const COLORS = {
  QB: { bg: "#fee2e2", color: "#b91c1c" },
  RB: { bg: "#dbeafe", color: "#1d4ed8" },
  WR: { bg: "#fce7f3", color: "#be185d" },
  TE: { bg: "#f3e8ff", color: "#7e22ce" },
  K: { bg: "#e5e7eb", color: "#374151" },
  DEF: { bg: "#dcfce7", color: "#15803d" },
};

export function getPositionColor(position) {
  return COLORS[position] || { bg: "#e5e7eb", color: "#374151" };
}
