import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, signSession, verifySession, sessionTtl } from "@/lib/auth";
import { getAccountByUsername, type AdminAccount } from "@/lib/accounts";

/* Server-side session helpers used by protected pages and the
   route handlers.

   The cookie signature is checked at the edge (proxy.ts), but the
   account itself is re-loaded here on every request so that a
   disabled account, a password reset, or a role change takes
   effect immediately - a stolen/old cookie stops working as soon
   as `session_version` moves on. */

export const getCurrentAccount = cache(async (): Promise<AdminAccount | null> => {
  const store = await cookies();
  const payload = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  try {
    const account = await getAccountByUsername(payload.u);
    if (!account || !account.is_active || account.session_version !== payload.v) return null;
    return account;
  } catch {
    return null;
  }
});

/** Send to /login (clearing any stale cookie) unless a valid session exists. */
export async function requireAccount(): Promise<AdminAccount> {
  const account = await getCurrentAccount();
  if (!account) redirect("/api/auth/logout");
  return account;
}

/** Super-admin-only pages: everyone else goes back to the inbox. */
export async function requireSuperAdmin(): Promise<AdminAccount> {
  const account = await requireAccount();
  if (account.role !== "super_admin") redirect("/submissions");
  return account;
}

/** Issue a session cookie for `account` (call from a route handler). */
export async function createSession(account: AdminAccount): Promise<void> {
  const token = await signSession(account.username, account.session_version);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionTtl(),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
