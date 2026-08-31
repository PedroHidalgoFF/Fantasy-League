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
  // El diccionario completo (~5MB) vive cacheado en Supabase, refrescado
  // 1x/día por cron — Sleeper pide no pedirlo más seguido que eso.
  const { getCachedPlayers } = await import("./playersCache");
  const cached = await getCachedPlayers();
  if (cached?.data) return cached.data;

  // Respaldo: si el caché todavía no existe (primera vez, antes de que
  // corra el cron), lo pedimos directo una sola vez para no dejar el sitio
  // sin datos.
  console.warn("[getAllPlayers] Caché vacío, pidiendo directo a Sleeper como respaldo.");
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

// Proyecciones de TODOS los jugadores de una semana (endpoint no-oficial,
// mismo patrón que ya usamos en otros lados del proyecto — una sola
// llamada con todas las posiciones juntas, no una por posición).
const PROJECTIONS_BASE_URL = "https://api.sleeper.app/projections/nfl";
const PROJECTION_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

async function getWeekProjections(season, week) {
  const posQuery = PROJECTION_POSITIONS.map((p) => `position[]=${p}`).join("&");
  const list = await getJSON(`${PROJECTIONS_BASE_URL}/${season}/${week}?season_type=regular&${posQuery}`);

  const byPlayerId = {};
  for (const entry of list) {
    const pts = entry.stats?.pts_ppr;
    if (entry.player_id && typeof pts === "number") byPlayerId[entry.player_id] = pts;
  }
  return byPlayerId;
}

// Puntos esperados (proyecciones sumadas de los titulares) para el matchup
// de UN equipo en una semana específica: mi equipo vs. el rival que le tocó
// esa semana, usando el mismo emparejamiento por matchup_id que ya usa
// Sleeper. Pensado para consumidores externos del sitio (ej. el widget de
// iOS) — ver el Route Handler de ejemplo en
// app/api/expected-points/[leagueId]/[week]/route.js para cómo cachearlo
// con ISR por liga+semana+equipo.
//
// Devuelve null si ese rosterId no tiene matchup esa semana (liga que
// todavía no ha jugado, rosterId inválido, etc.) — nunca truena, para que
// quien lo consuma pueda mostrar un estado vacío en vez de un error.
export async function getExpectedPointsForMatchup(leagueId, season, week, rosterId) {
  const [matchups, projections] = await Promise.all([
    getMatchups(leagueId, week),
    getWeekProjections(season, week),
  ]);

  const myMatchup = matchups.find((m) => String(m.roster_id) === String(rosterId));
  if (!myMatchup) return null;

  const oppMatchup = matchups.find(
    (m) => m.matchup_id === myMatchup.matchup_id && String(m.roster_id) !== String(rosterId)
  );

  const sumExpected = (starters) =>
    (starters || [])
      .filter((id) => id && id !== "0")
      .reduce((sum, id) => sum + (projections[id] || 0), 0);

  return {
    week,
    myTeam: {
      rosterId: myMatchup.roster_id,
      pointsExpected: Math.round(sumExpected(myMatchup.starters) * 100) / 100,
    },
    // Sin rival esa semana (bye, número impar de equipos, etc.)
    opponent: oppMatchup
      ? {
          rosterId: oppMatchup.roster_id,
          pointsExpected: Math.round(sumExpected(oppMatchup.starters) * 100) / 100,
        }
      : null,
  };
}

// Transacciones (trades, waivers, free agent adds/drops) de una semana específica
export async function getTransactions(leagueId, week) {
  return getJSON(`${BASE_URL}/league/${leagueId}/transactions/${week}`);
}

// Semana actual de la NFL (útil para saber qué semana pedir en matchups/transactions)
export async function getNFLState() {
  return getJSON(`${BASE_URL}/state/nfl`);
}

// Sleeper reutiliza el campo "week" tanto en pretemporada como en temporada
// regular (ej. "semana 2 de pretemporada" también sale como week: 2). Sin
// esto, el sitio "brinca" a semana 2+ antes de que la temporada real
// arranque. Este helper ancla todo a semana 1 hasta que season_type sea
// "regular" (o "post", ya en playoffs).
export async function getRegularSeasonState() {
  const state = await getNFLState();
  const hasStarted = state.season_type === "regular" || state.season_type === "post";
  const week = hasStarted ? Math.max(state.week || 1, 1) : 1;
  const lastCompletedWeek = hasStarted ? Math.max(week - 1, 0) : 0;

  return {
    season: state.season,
    week, // semana actual/próxima a jugarse (mínimo 1)
    lastCompletedWeek, // última semana con resultados reales (0 si ninguna)
    hasStarted, // true una vez que Sleeper marca season_type "regular"/"post"
  };
}

// Recorre todas las semanas jugadas hasta ahora y junta solo los trades,
// ya con nombres de equipo en vez de roster_id crudo.
export async function getAllTrades(leagueId) {
  const [{ week: currentWeek }, rosters, users, players] = await Promise.all([
    getRegularSeasonState(),
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
    getAllPlayers(),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const teamByRosterId = Object.fromEntries(
    rosters.map((r) => {
      const user = userById[r.owner_id] || {};
      const teamName = user.metadata?.team_name || user.display_name || "Team";
      return [r.roster_id, { teamName, avatar: user.avatar || null }];
    })
  );

  const playerInfo = (playerId) => {
    const p = players[playerId];
    return {
      playerId,
      name: p ? `${p.first_name} ${p.last_name}` : `Player ${playerId}`,
      position: p?.position || "?",
      nflTeam: p?.team || "FA",
    };
  };

  const weeks = Array.from({ length: currentWeek }, (_, i) => i + 1);

  const weeklyTransactions = await Promise.all(
    weeks.map((week) => getTransactions(leagueId, week).catch(() => []))
  );

  const allTrades = weeklyTransactions
    .flat()
    .filter((t) => t.type === "trade" && t.status === "complete")
    .map((t) => {
      const involvedRosterIds = t.roster_ids || [];
      const adds = t.adds || {};
      const drops = t.drops || {};

      const byTeam = involvedRosterIds.map((rosterId) => {
        const receives = Object.entries(adds)
          .filter(([, toRosterId]) => toRosterId === rosterId)
          .map(([playerId]) => playerInfo(playerId));

        const sends = Object.entries(drops)
          .filter(([, fromRosterId]) => fromRosterId === rosterId)
          .map(([playerId]) => playerInfo(playerId));

        const team = teamByRosterId[rosterId] || { teamName: `Team ${rosterId}`, avatar: null };

        return {
          rosterId,
          teamName: team.teamName,
          avatar: team.avatar,
          receives,
          sends,
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
          fromTeam: teamByRosterId[pick.roster_id]?.teamName || `Team ${pick.roster_id}`,
          toTeam: teamByRosterId[pick.owner_id]?.teamName || `Team ${pick.owner_id}`,
        })),
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp); // most recent first

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

// Arma el perfil completo de un equipo: datos de standings + roster de
// jugadores con nombre/posición + los trades en los que participó.
export async function getTeamProfile(leagueId, rosterId) {
  const [standings, rosters, players, allTrades] = await Promise.all([
    getStandings(leagueId),
    getLeagueRosters(leagueId),
    getAllPlayers(),
    getAllTrades(leagueId),
  ]);

  const teamStanding = standings.find((s) => s.rosterId === Number(rosterId));
  const roster = rosters.find((r) => r.roster_id === Number(rosterId));

  if (!teamStanding || !roster) return null;

  const rosterPlayers = (roster.players || []).map((playerId) => {
    const p = players[playerId];
    return {
      id: playerId,
      name: p ? `${p.first_name} ${p.last_name}` : `Jugador ${playerId}`,
      position: p?.position || "?",
      team: p?.team || "FA",
    };
  });

  const teamTrades = allTrades.filter((trade) =>
    trade.byTeam.some((t) => t.teamName === teamStanding.teamName)
  );

  return {
    ...teamStanding,
    players: rosterPlayers,
    trades: teamTrades,
  };
}

// Trae todo lo necesario para calcular Bust/Boom de la semana más reciente:
// matchups con puntos reales, nombres de equipo, semana y temporada actual.
export async function getWeeklyMatchupData(leagueId) {
  const { season, lastCompletedWeek } = await getRegularSeasonState();

  // Todavía no hay ninguna semana de temporada regular completa (seguimos
  // en pretemporada/entresemana): no hay resultados que mostrar, pero
  // seguimos anclados a "semana 1" para que el resto del sitio sea consistente.
  if (lastCompletedWeek < 1) {
    return { matchups: [], players: {}, rosterTeamNames: {}, week: 1, season };
  }

  const week = lastCompletedWeek;

  const [matchups, rosters, users, players] = await Promise.all([
    getMatchups(leagueId, week),
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
    getAllPlayers(),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const rosterTeamNames = Object.fromEntries(
    rosters.map((r) => {
      const user = userById[r.owner_id] || {};
      const teamName = user.metadata?.team_name || user.display_name || "Equipo sin nombre";
      return [r.roster_id, teamName];
    })
  );

  return { matchups, players, rosterTeamNames, week, season };
}
