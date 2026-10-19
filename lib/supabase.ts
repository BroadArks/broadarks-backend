import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ============================================================
   Supabase admin client - SERVER ONLY.

   Uses the service-role key, which bypasses row-level security,
   so this module must never be imported into a client component.
   The `server-only` import above turns any such import into a
   build error.

   The client is created LAZILY (via a Proxy) on first property
   access, not at import time - so the app still builds when the
   env vars aren't set yet. When they're missing, the first query
   throws a clear, catchable error that the dashboard surfaces.
   ============================================================ */

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
