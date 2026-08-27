// lib/injuryBadge.js
// Sleeper trae el estado de lesión en el campo "injury_status" de cada
// jugador. Estos son los valores que normalmente devuelve, mapeados a un
// ícono corto para no saturar la tabla.

const BADGES = {
  Questionable: { icon: "⚠️", label: "Cuestionable", color: "#facc15" },
  Doubtful: { icon: "🟠", label: "Dudoso", color: "#fb923c" },
  Out: { icon: "❌", label: "Fuera esta semana", color: "#f87171" },
  IR: { icon: "🏥", label: "Reserva por lesión (IR)", color: "#dc2626" },
  PUP: { icon: "🏥", label: "PUP (recuperación físicamente incapacitante)", color: "#dc2626" },
  Suspended: { icon: "🚫", label: "Suspendido", color: "#a855f7" },
  NA: { icon: "⚠️", label: "No disponible", color: "#facc15" },
};

export function getInjuryBadge(status) {
  if (!status) return null;
  return BADGES[status] || { icon: "⚠️", label: status, color: "#facc15" };
}
