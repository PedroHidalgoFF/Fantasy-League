// middleware.js
// Protege todo lo que empiece con /admin, excepto la propia página de login
// y el endpoint que valida la contraseña.

import { NextResponse } from "next/server";
import { isValidSession, ADMIN_COOKIE_NAME } from "./lib/auth";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublicAdminPath =
    pathname === "/admin/login" || pathname === "/api/admin/login";

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (isPublicAdminPath) return NextResponse.next();

    const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const valid = await isValidSession(cookie);
    if (!valid) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
