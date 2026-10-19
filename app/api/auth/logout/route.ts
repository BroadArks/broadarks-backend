import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { destroySession } from "@/lib/session";

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}

/* Used by requireAccount() when a cookie is validly signed but no longer
   matches the account (password reset, disabled, deleted). Clearing it
   here avoids a /login ↔ /submissions redirect loop in the proxy. */
export async function GET(request: Request) {
  const url = new URL("/login", request.url);
  url.searchParams.set("signedout", "1");
  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
