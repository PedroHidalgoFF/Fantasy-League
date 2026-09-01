// middleware.js
// Dos cosas:
// 1. Protege /admin (contraseña de editor).
// 2. Si el visitante no ha elegido SU liga todavía (sin cookie
//    ff_league_id propia), lo manda a /setup — esto es lo primero que ve
//    cualquier persona nueva, sin importar si el proyecto todavía tiene
//    configurada la variable de entorno SLEEPER_LEAGUE_ID (esa solo se usa
//    como respaldo interno si algo falla después del setup, nunca para
//    saltarse la pantalla de bienvenida).

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

  // --- Si este visitante no ha elegido su liga (cookie propia), a /setup ---
  const hasOwnLeague = Boolean(request.cookies.get(LEAGUE_COOKIE)?.value);
  if (!hasOwnLeague) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo-mark.png|logo-full.png|icon.png|apple-icon.png|manifest.webmanifest|sw.js|scriptable|logos).*)",
  ],
};
