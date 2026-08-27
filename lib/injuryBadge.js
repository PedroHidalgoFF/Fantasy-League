// lib/injuryBadge.js
// Sleeper trae el estado de lesión en el campo "injury_status" de cada
// jugador. Estos son los valores que normalmente devuelve, mapeados a un
// ícono corto para no saturar la tabla.

const BADGES = {
  Questionable: { icon: "⚠️", label: "Questionable", color: "#facc15" },
  Doubtful: { icon: "🟠", label: "Doubtful", color: "#fb923c" },
  Out: { icon: "❌", label: "Out this week", color: "#f87171" },
  IR: { icon: "🏥", label: "Injured Reserve (IR)", color: "#dc2626" },
  PUP: { icon: "🏥", label: "PUP (Physically Unable to Perform)", color: "#dc2626" },
  Suspended: { icon: "🚫", label: "Suspended", color: "#a855f7" },
  NA: { icon: "⚠️", label: "Not available", color: "#facc15" },
};

export function getInjuryBadge(status) {
  if (!status) return null;
  return BADGES[status] || { icon: "⚠️", label: status, color: "#facc15" };
}
