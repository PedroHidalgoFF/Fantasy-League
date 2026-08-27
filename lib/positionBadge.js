// lib/positionBadge.js
const COLORS = {
  QB: { bg: "#fee2e2", color: "#b91c1c" },
  RB: { bg: "#dbeafe", color: "#1d4ed8" },
  WR: { bg: "#fce7f3", color: "#be185d" },
  TE: { bg: "#f3e8ff", color: "#7e22ce" },
  K: { bg: "#e5e7eb", color: "#374151" },
  DEF: { bg: "#dcfce7", color: "#15803d" },
};

const SOLID_COLORS = {
  QB: "#10b981",
  RB: "#3b82f6",
  WR: "#ec4899",
  TE: "#8b5cf6",
  K: "#6b7280",
  DEF: "#f59e0b",
};

export function getPositionSolidColor(position) {
  return SOLID_COLORS[position] || "#6b7280";
}

export function getPositionColor(position) {
  return COLORS[position] || { bg: "#e5e7eb", color: "#374151" };
}
