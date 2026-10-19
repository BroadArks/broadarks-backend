"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, User, Loader2 } from "lucide-react";
import { SITE } from "@/lib/site";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        setLoading(false);
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/submissions");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-12">
      <div className="pointer-events-none absolute left-0 top-0 h-1 w-full bg-primary-500" aria-hidden />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 shadow-sm">
            <span className="font-heading text-base font-800 text-white">{SITE.monogram}</span>
          </div>
          <h1 className="font-heading text-xl font-800 text-ink">{SITE.panelName}</h1>
          <p className="mt-1.5 text-sm text-neutral-500">Sign in to view applications and enquiries.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-600 text-neutral-600">Username</span>
            <span className="relative block">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-neutral-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                placeholder="username"
              />
            </span>
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 flex items-center justify-between text-xs font-600 text-neutral-600">
              Password
              <Link href="/forgot-password" className="font-600 text-primary-500 hover:text-primary-700">
                Forgot password?
              </Link>
            </span>
            <span className="relative block">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-neutral-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                placeholder="••••••••"
              />
            </span>
          </label>

          {error && (
            <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-500 text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-2.5 text-sm font-600 text-white shadow-sm transition hover:bg-primary-600 disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Protected area · unauthorized access is logged
        </p>
      </div>
    </main>
  );
}
