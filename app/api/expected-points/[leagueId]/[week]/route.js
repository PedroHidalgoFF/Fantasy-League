// app/api/expected-points/[leagueId]/[week]/route.js
//
// GET /api/expected-points/<leagueId>/<week>?rosterId=<rosterId>
//
// Devuelve { week, myTeam: { rosterId, pointsExpected }, opponent: {...} | null }
//
// Cacheado con ISR vía unstable_cache — la PRIMERA visita a una combinación
// leagueId+week+rosterId dispara el cálculo real (llamando a Sleeper), y
// las siguientes visitas a esa misma combinación devuelven el resultado
// cacheado hasta que expire (5 minutos). Como el proyecto es multi-liga
// (no sabemos de antemano qué ligas va a visitar la gente), esto es mejor
// que un cron programado: se calienta solo, liga por liga, según demanda
// real — sin depender de Supabase ni de GitHub Actions para esto.

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getExpectedPointsForMatchup, getRegularSeasonState } from "../../../../../lib/sleeper";

const REVALIDATE_SECONDS = 300; // 5 minutos

export async function GET(request, { params }) {
  const { leagueId, week } = params;
  const { searchParams } = new URL(request.url);
  const rosterId = searchParams.get("rosterId");

  if (!rosterId) {
    return NextResponse.json({ error: "Falta el parámetro rosterId (?rosterId=...)" }, { status: 400 });
  }

  const weekNum = Number(week);
  if (!leagueId || !weekNum || weekNum < 1) {
    return NextResponse.json({ error: "leagueId o week inválidos" }, { status: 400 });
  }

  try {
    const { season } = await getRegularSeasonState();

    // Cache explícito por liga+semana+equipo — cada combinación es una
    // entrada de cache independiente, no se comparte entre ligas ni entre
    // equipos de la misma liga.
    const getCachedExpectedPoints = unstable_cache(
      async () => getExpectedPointsForMatchup(leagueId, season, weekNum, rosterId),
      ["expected-points", leagueId, String(weekNum), rosterId],
      { revalidate: REVALIDATE_SECONDS }
    );

    const result = await getCachedExpectedPoints();

    if (!result) {
      return NextResponse.json(
        { error: "No se encontró un matchup para ese equipo en esa semana." },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    // Cache frío + el endpoint no-oficial de proyecciones de Sleeper falla:
    // no tronamos, devolvemos un mensaje claro para que quien consuma esto
    // (ej. el widget) pueda mostrar un estado vacío en vez de un error feo.
    console.error("[expected-points] Error:", err.message);
    return NextResponse.json(
      { error: "Proyecciones no disponibles por ahora. Intenta de nuevo en unos minutos." },
      { status: 502 }
    );
  }
}
