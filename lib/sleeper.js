// lib/sleeper.js
// Funciones para traer datos de la API pública y gratuita de Sleeper.
// Documentación: https://docs.sleeper.com/
// No requiere API key. Límite: no pasarse de ~1000 llamadas por minuto.

const BASE_URL = "https://api.sleeper.app/v1";

async function getJSON(url) {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Error al llamar a Sleeper (${res.status}): ${url}`);
  }
  return res.json();
}

// Info general de la liga (nombre, temporada, settings de scoring, etc.)
export async function getLeague(leagueId) {
  return getJSON(`${BASE_URL}/league/${leagueId}`);
}

// Lista de todos los equipos/managers de la liga, con su nombre de equipo y avatar
export async function getLeagueUsers(leagueId) {
  return getJSON(`${BASE_URL}/league/${leagueId}/users`);
}

// Rosters de cada equipo: jugadores, récord (wins/losses/ties), puntos a favor/en contra
export async function getLeagueRosters(leagueId) {
  return getJSON(`${BASE_URL}/league/${leagueId}/rosters`);
}

// Matchups (resultados) de una semana específica
export async function getMatchups(leagueId, week) {
  return getJSON(`${BASE_URL}/league/${leagueId}/matchups/${week}`);
}

// Transacciones (trades, waivers, free agent adds/drops) de una semana específica
export async function getTransactions(leagueId, week) {
  return getJSON(`${BASE_URL}/league/${leagueId}/transactions/${week}`);
}

// Semana actual de la NFL (útil para saber qué semana pedir en matchups/transactions)
export async function getNFLState() {
  return getJSON(`${BASE_URL}/state/nfl`);
}

// Combina rosters + users para tener, por equipo: nombre, récord, puntos, etc.
export async function getStandings(leagueId) {
  const [rosters, users] = await Promise.all([
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));

  const standings = rosters.map((roster) => {
    const user = userById[roster.owner_id] || {};
    const teamName =
      user.metadata?.team_name || user.display_name || "Equipo sin nombre";

    return {
      rosterId: roster.roster_id,
      ownerId: roster.owner_id,
      teamName,
      displayName: user.display_name || "Desconocido",
      avatar: user.avatar || null,
      wins: roster.settings?.wins ?? 0,
      losses: roster.settings?.losses ?? 0,
      ties: roster.settings?.ties ?? 0,
      pointsFor: (roster.settings?.fpts ?? 0) + (roster.settings?.fpts_decimal ?? 0) / 100,
      pointsAgainst:
        (roster.settings?.fpts_against ?? 0) +
        (roster.settings?.fpts_against_decimal ?? 0) / 100,
    };
  });

  // Orden por default: más wins primero, luego más puntos a favor
  standings.sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor);

  return standings;
}
