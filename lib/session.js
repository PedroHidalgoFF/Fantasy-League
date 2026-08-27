// lib/session.js
// En vez de un solo SLEEPER_LEAGUE_ID fijo por variable de entorno, cada
// visitante guarda su propia liga y equipo en cookies del navegador. Así
// el mismo sitio desplegado sirve para cualquier liga de Sleeper.

import { cookies } from "next/headers";

export const LEAGUE_COOKIE = "ff_league_id";
export const TEAM_COOKIE = "ff_my_roster_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

// Si el visitante no ha configurado nada todavía, usamos la variable de
// entorno como respaldo (útil para ti, el dueño del deploy original).
export function getLeagueId() {
  const store = cookies();
  return store.get(LEAGUE_COOKIE)?.value || process.env.SLEEPER_LEAGUE_ID || null;
}

export function getMyRosterId() {
  const store = cookies();
  return store.get(TEAM_COOKIE)?.value || null;
}

export function setLeagueCookies(response, leagueId, rosterId) {
  response.cookies.set(LEAGUE_COOKIE, leagueId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(TEAM_COOKIE, rosterId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearLeagueCookies(response) {
  response.cookies.set(LEAGUE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(TEAM_COOKIE, "", { path: "/", maxAge: 0 });
}
