import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "vecta_token";
const PUBLIC_PATHS = ["/login", "/signup"];

// Cheap, edge-safe presence check only (no cryptographic verification - the
// jsonwebtoken package needs Node's crypto module, which isn't available in
// the Edge runtime middleware runs in). This is purely a UX redirect so a
// signed-out visitor lands on /login instead of a blank app shell; every
// route handler and server component still calls getCurrentUser(), which
// does full JWT verification against the DB-backed user, before returning
// or acting on any data.
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!hasCookie && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasCookie && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
