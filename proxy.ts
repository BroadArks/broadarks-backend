import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/* ============================================================
   Proxy (formerly `middleware` in older Next.js) - gatekeeps the
   whole admin panel. Runs on the edge before any route renders.

     • Unauthenticated page request  → redirect to /login
     • Unauthenticated API request   → 401 JSON
     • Authenticated hitting /login  → redirect to /submissions
   Route handlers additionally re-check the session (defence in
   depth) so a misconfigured matcher can never leak data.
   ============================================================ */

const PUBLIC_PAGES = ["/login", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  // Login/logout endpoints must stay reachable.
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // API routes: never redirect, respond 401 when unauthenticated.
  if (pathname.startsWith("/api/")) {
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    return NextResponse.redirect(url);
  }

  if (session && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/submissions";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
