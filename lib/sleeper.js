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

// Diccionario completo de jugadores de la NFL (id -> nombre, posición, equipo).
// Es un archivo pesado (~5MB), Sleeper pide no llamarlo más de una vez al día.
// Como nuestro sitio se regenera solo 3 veces al día, esto encaja perfecto.
export async function getAllPlayers() {
  return getJSON(`${BASE_URL}/players/nfl`);
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

// Recorre todas las semanas jugadas hasta ahora y junta solo los trades,
// ya con nombres de equipo en vez de roster_id crudo.
export async function getAllTrades(leagueId) {
  const [state, rosters, users, players] = await Promise.all([
    getNFLState(),
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
    getAllPlayers(),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const teamNameByRosterId = Object.fromEntries(
    rosters.map((r) => {
      const user = userById[r.owner_id] || {};
      const teamName = user.metadata?.team_name || user.display_name || "Equipo sin nombre";
      return [r.roster_id, teamName];
    })
  );

  const playerName = (playerId) => {
    const p = players[playerId];
    return p ? `${p.first_name} ${p.last_name}` : `Jugador ${playerId}`;
  };

  const currentWeek = state.week || 1;
  const weeks = Array.from({ length: currentWeek }, (_, i) => i + 1);

  const weeklyTransactions = await Promise.all(
    weeks.map((week) => getTransactions(leagueId, week).catch(() => []))
  );

  const allTrades = weeklyTransactions
    .flat()
    .filter((t) => t.type === "trade" && t.status === "complete")
    .map((t) => {
      // Para cada equipo involucrado, arma la lista de jugadores que recibió
      const involvedRosterIds = t.roster_ids || [];
      const byTeam = involvedRosterIds.map((rosterId) => {
        const received = Object.entries(t.adds || {})
          .filter(([, toRosterId]) => toRosterId === rosterId)
          .map(([playerId]) => playerName(playerId));

        return {
          teamName: teamNameByRosterId[rosterId] || `Equipo ${rosterId}`,
          received,
        };
      });

      return {
        id: t.transaction_id,
        week: t.leg,
        timestamp: t.status_updated,
        byTeam,
        draftPicksTraded: (t.draft_picks || []).map((pick) => ({
          season: pick.season,
          round: pick.round,
          fromTeam: teamNameByRosterId[pick.roster_id] || `Equipo ${pick.roster_id}`,
          toTeam: teamNameByRosterId[pick.owner_id] || `Equipo ${pick.owner_id}`,
        })),
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp); // más reciente primero

  return allTrades;
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
