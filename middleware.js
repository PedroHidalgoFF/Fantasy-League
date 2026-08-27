// middleware.js
// Dos cosas:
// 1. Protege /admin (contraseña de editor).
// 2. Si el visitante no ha configurado su liga todavía (sin cookie
//    ff_league_id y sin SLEEPER_LEAGUE_ID de respaldo), lo manda a /setup.

import { NextResponse } from "next/server";
import { isValidSession, ADMIN_COOKIE_NAME } from "./lib/auth";

const LEAGUE_COOKIE = "ff_league_id";
const PUBLIC_PATHS = ["/setup"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // --- Protección de /admin (sin cambios) ---
  const isPublicAdminPath = pathname === "/admin/login" || pathname === "/api/admin/login";
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (isPublicAdminPath) return NextResponse.next();
    const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const valid = await isValidSession(cookie);
    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // --- Nunca bloquear llamadas a la API ---
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // --- La propia página de setup siempre es accesible ---
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  // --- Si no hay liga configurada (ni por cookie ni por env var), a /setup ---
  const hasLeague = request.cookies.get(LEAGUE_COOKIE)?.value || process.env.SLEEPER_LEAGUE_ID;
  if (!hasLeague) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-mark.png|logo-full.png).*)"],
};
