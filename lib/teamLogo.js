// lib/teamLogo.js
// Las "Defensas" (DEF) en Sleeper no son un jugador real — no tienen foto
// de jugador, son el equipo completo. En vez de mostrar una imagen rota,
// usamos el logo del equipo NFL correspondiente.

export function getTeamLogoUrl(abbreviation) {
  if (!abbreviation) return null;
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbreviation.toLowerCase()}.png`;
}

// playerId, position, y el abreviado del equipo NFL (nflTeam/team, según la
// función que lo haya armado) — si es DEF, usamos el logo del equipo.
export function getPlayerImageUrl(playerId, position, teamAbbr) {
  if (position === "DEF") {
    return getTeamLogoUrl(teamAbbr || playerId);
  }
  return `https://sleepercdn.com/content/nfl/players/${playerId}.jpg`;
}
