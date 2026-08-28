// lib/powerRankingsV2.js
//
// Power Rankings basados en la CALIDAD de roster, no en récord de temporada.
// Complementa (no reemplaza) el power ranking de récord+puntos que ya
// tenemos en lib/powerRankings.js.
//
// METODOLOGÍA:
//   1. Traemos el ranking de temporada de ESPN por jugador.
//   2. Lo convertimos a percentil dentro de su POSICIÓN (0 a 1, 1 = mejor de
//      su posición) — comparar percentil por posición es justo; comparar
//      rank crudo entre posiciones no lo es.
//   3. Por equipo: promediamos el percentil de los TITULARES por posición
//      (QB, RB, WR, TE), más un 5to valor de BANCA (mejor percentil entre
//      suplentes, refleja profundidad).
//   4. Promedio ponderado de esas 5 categorías = Power Score.
//
// ⚠️ IMPORTANTE — LEE ESTO ANTES DE CONFIAR EN EL RESULTADO A CIEGAS:
// El endpoint de ESPN que usamos aquí NO es oficial. Investigué su
// comportamiento real (no pude hacer un fetch en vivo desde mi entorno de
// desarrollo, que no tiene acceso a internet, pero sí revisé documentación
// de la comunidad) y encontré dos riesgos concretos:
//
//   a) Sin el header X-Fantasy-Filter correcto, ESPN devuelve solo 50
//      jugadores en vez de los ~3000 — aquí ya está el header correcto
//      (confirmado por varias fuentes de la comunidad), pero ESPN puede
//      cambiar esto sin avisar.
//   b) El campo `draftRanksByRankType.PPR.rank` que se usa para el ranking
//      está confirmado en endpoints de ESPN que requieren cookies de sesión
//      (autenticación). No pude confirmar si también existe en esta
//      variante pública sin login. Por eso este archivo intenta ESE campo
//      primero, y si no lo encuentra en suficientes jugadores, cae
//      automáticamente a ADP (average draft position) de ESPN, que sí está
//      documentado como disponible sin autenticación.
//
// Revisa los logs de Vercel después del primer refresh real — vas a ver un
// mensaje indicando cuál de los dos métodos se terminó usando.

import { getAllPlayers, getLeagueRosters, getLeagueUsers } from "./sleeper";

const ESPN_PLAYERS_URL = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons";

// Header verificado por la comunidad para desbloquear la lista completa de
// jugadores (sin esto, ESPN recorta la respuesta a 50 resultados).
const ESPN_FILTER_HEADER = JSON.stringify({ filterActive: { value: true } });

// Pesos por categoría — deben sumar 1.
const WEIGHTS = { QB: 0.2, RB: 0.25, WR: 0.25, TE: 0.15, BENCH: 0.15 };

// defaultPositionId de ESPN -> abreviación de posición
const ESPN_POSITION_MAP = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "DEF" };

async function fetchEspnPlayers(season) {
  const url = `${ESPN_PLAYERS_URL}/${season}/players?scoringPeriodId=0&view=players_wl`;
  const res = await fetch(url, {
    headers: { "x-fantasy-filter": ESPN_FILTER_HEADER },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`ESPN respondió ${res.status}`);
  return res.json();
}

// Normaliza nombres para poder cruzar ESPN <-> Sleeper (quita acentos,
// sufijos como Jr./Sr./III, puntuación, y pasa a minúsculas).
function normalizeName(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// 1) Traer y procesar ranking de ESPN -> percentil por posición
// ---------------------------------------------------------------------------

async function getEspnPositionalPercentiles(season) {
  const raw = await fetchEspnPlayers(season);

  if (!Array.isArray(raw) || raw.length < 100) {
    throw new Error(
      `ESPN devolvió ${Array.isArray(raw) ? raw.length : "algo inesperado"} jugadores — probablemente el header X-Fantasy-Filter dejó de funcionar. Revisa la respuesta cruda.`
    );
  }

  // Método A (preferido): rank de temporada por posición de ESPN
  const byPositionRank = {};
  let matchedByRank = 0;

  raw.forEach((p) => {
    const position = ESPN_POSITION_MAP[p.defaultPositionId];
    const rank = p.draftRanksByRankType?.PPR?.rank;
    if (!position || !rank) return;
    matchedByRank += 1;
    if (!byPositionRank[position]) byPositionRank[position] = [];
    byPositionRank[position].push({ name: p.fullName, value: rank, lowerIsBetter: true });
  });

  let byPosition = byPositionRank;
  let methodUsed = "draftRanksByRankType.PPR.rank";

  // Si casi nadie trajo ese campo, caemos a ADP (average draft position)
  if (matchedByRank < 50) {
    console.warn(
      "[powerRankingsV2] draftRanksByRankType.PPR.rank no vino en suficientes jugadores " +
        `(${matchedByRank}/${raw.length}). Usando ADP como respaldo.`
    );
    const byPositionAdp = {};
    raw.forEach((p) => {
      const position = ESPN_POSITION_MAP[p.defaultPositionId];
      const adp = p.ownership?.averageDraftPosition;
      if (!position || !adp) return;
      if (!byPositionAdp[position]) byPositionAdp[position] = [];
      byPositionAdp[position].push({ name: p.fullName, value: adp, lowerIsBetter: true });
    });
    byPosition = byPositionAdp;
    methodUsed = "ownership.averageDraftPosition (respaldo)";
  }

  console.log(`[powerRankingsV2] Método usado para rankear jugadores: ${methodUsed}`);

  const result = new Map();

  Object.entries(byPosition).forEach(([position, players]) => {
    players.sort((a, b) => a.value - b.value); // menor valor = mejor
    const n = players.length;
    players.forEach((p, index) => {
      const positionalRank = index + 1;
      const percentile = n > 1 ? 1 - (positionalRank - 1) / (n - 1) : 1;
      result.set(normalizeName(p.name), {
        position,
        rank: positionalRank,
        percentile: Math.round(percentile * 1000) / 1000,
        name: p.name,
      });
    });
  });

  return { percentileByName: result, methodUsed };
}

// ---------------------------------------------------------------------------
// 2) Contexto de Sleeper (rosters, starters, equipos) — reutiliza nuestros
//    helpers existentes en vez de duplicar llamadas a la API
// ---------------------------------------------------------------------------

async function getSleeperRosterContext(leagueId) {
  const [rosters, users, playersDict] = await Promise.all([
    getLeagueRosters(leagueId),
    getLeagueUsers(leagueId),
    getAllPlayers(),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));

  return rosters.map((r) => {
    const starterIds = (r.starters || []).filter((id) => id && id !== "0");
    const allIds = r.players || [];
    const benchIds = allIds.filter((id) => !starterIds.includes(id));

    const toPlayerInfo = (id) => {
      const p = playersDict[id];
      if (!p) return null;
      return {
        playerId: id,
        name: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
        position: p.position,
        nflTeam: p.team || "FA",
      };
    };

    const user = userById[r.owner_id] || {};

    return {
      rosterId: r.roster_id,
      teamName: user.metadata?.team_name || user.display_name || `Team ${r.roster_id}`,
      avatar: user.avatar || null,
      starters: starterIds.map(toPlayerInfo).filter(Boolean),
      bench: benchIds.map(toPlayerInfo).filter(Boolean),
    };
  });
}

// ---------------------------------------------------------------------------
// 3) Power Rankings final
// ---------------------------------------------------------------------------

export async function computePowerRankingsV2(leagueId, season) {
  const [{ percentileByName, methodUsed }, teams] = await Promise.all([
    getEspnPositionalPercentiles(season),
    getSleeperRosterContext(leagueId),
  ]);

  const unmatchedPlayers = new Set();

  const lookupPercentile = (playerName) => {
    const match = percentileByName.get(normalizeName(playerName));
    if (!match) {
      unmatchedPlayers.add(playerName);
      return null;
    }
    return match.percentile;
  };

  const rankings = teams.map((team) => {
    const byPosition = { QB: [], RB: [], WR: [], TE: [] };

    team.starters.forEach((player) => {
      if (!byPosition[player.position]) return; // ignora K/DEF en esta parte
      const pct = lookupPercentile(player.name);
      if (pct != null) byPosition[player.position].push(pct);
    });

    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

    const categoryScores = {
      QB: avg(byPosition.QB),
      RB: avg(byPosition.RB),
      WR: avg(byPosition.WR),
      TE: avg(byPosition.TE),
    };

    const benchPercentiles = team.bench
      .filter((p) => ["QB", "RB", "WR", "TE"].includes(p.position))
      .map((p) => lookupPercentile(p.name))
      .filter((pct) => pct != null);

    categoryScores.BENCH = benchPercentiles.length ? Math.max(...benchPercentiles) : null;

    let weightedSum = 0;
    let weightUsed = 0;
    Object.entries(WEIGHTS).forEach(([category, weight]) => {
      const score = categoryScores[category];
      if (score == null) return;
      weightedSum += score * weight;
      weightUsed += weight;
    });

    const powerScore = weightUsed > 0 ? Math.round((weightedSum / weightUsed) * 1000) / 1000 : 0;

    return {
      rosterId: team.rosterId,
      teamName: team.teamName,
      avatar: team.avatar,
      powerScore,
      categoryScores,
    };
  });

  rankings.sort((a, b) => b.powerScore - a.powerScore);
  rankings.forEach((r, i) => (r.rank = i + 1));

  return {
    rankings,
    methodUsed,
    unmatchedPlayers: [...unmatchedPlayers],
    computedAt: new Date().toISOString(),
  };
}
