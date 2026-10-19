"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ExternalLink,
  Inbox,
  Loader2,
  LogOut,
  Menu,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/submissions", label: "Submissions", icon: Inbox, superOnly: false },
  { href: "/accounts", label: "Accounts & access", icon: Users, superOnly: true },
  { href: "/account", label: "My account", icon: UserCog, superOnly: false },
];

export default function AdminShell({
  username,
  fullName,
  isSuperAdmin,
  children,
}: {
  username: string;
  fullName: string;
  isSuperAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-neutral-100 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:border-primary-200 hover:text-primary-600"
        >
          <Menu size={19} />
        </button>
        <Brand className="ml-3" />
      </header>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-ink/35 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-neutral-100 bg-white transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-neutral-100 px-5">
          <Brand />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-50 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-700 uppercase tracking-[0.16em] text-neutral-400">
            Admin panel
          </p>
          <nav className="space-y-1" aria-label="Admin navigation">
            {NAV.filter((item) => !item.superOnly || isSuperAdmin).map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-600 transition-colors",
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-ink",
                  )}
                >
                  <Icon
                    size={17}
                    className={cn("text-neutral-400 group-hover:text-primary-500", active && "text-primary-500")}
                  />
                  {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary-500" />}
                </Link>
              );
            })}
          </nav>

          <div className="my-5 border-t border-neutral-100" />
          <a
            href={SITE.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-600 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-ink"
          >
            <ExternalLink size={17} className="text-neutral-400 group-hover:text-secondary-600" />
            View website
          </a>
        </div>

        <div className="border-t border-neutral-100 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-surface px-3 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 font-heading text-xs font-800 uppercase text-primary-700">
              {(fullName || username).slice(0, 2)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-700 text-ink">{fullName || username}</span>
              <span className="block truncate text-[11px] text-neutral-500">
                @{username} · {isSuperAdmin ? "Super admin" : "Admin"}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-600 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            {loggingOut ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={17} />}
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-64">
        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">{children}</div>
      </main>
    </div>
  );
}

function Brand({ className }: { className?: string }) {
  return (
    <Link href="/submissions" className={cn("flex items-center gap-3", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 font-heading text-sm font-800 text-white shadow-sm">
        {SITE.monogram}
      </span>
      <span>
        <span className="block font-heading text-base font-800 tracking-tight text-ink">{SITE.name}</span>
        <span className="block text-[10px] font-600 uppercase tracking-[0.13em] text-neutral-400">
          Admin
        </span>
      </span>
    </Link>
  );
}
