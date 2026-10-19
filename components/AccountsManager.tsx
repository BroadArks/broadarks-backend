"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Crown,
  KeyRound,
  LifeBuoy,
  Loader2,
  Mail,
  Phone,
  Power,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import type { AdminAccount } from "@/lib/accounts";

const inputCls =
  "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

const EMPTY_FORM = { full_name: "", username: "", email: "", phone: "", password: "" };

export default function AccountsManager({
  accounts,
  currentId,
}: {
  accounts: AdminAccount[];
  currentId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    setCreating(true);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create account.");
      return;
    }
    setOk(`Account “${data.account.username}” created. Share the username and password with them.`);
    setForm(EMPTY_FORM);
    router.refresh();
  }

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* Create form */}
      <form
        onSubmit={onCreate}
        className="h-fit rounded-2xl border border-neutral-100 bg-white p-6 shadow-card"
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <UserPlus size={16} />
          </span>
          <h2 className="text-sm font-700 text-ink">Give someone access</h2>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-600 text-neutral-500">Full name</span>
          <input value={form.full_name} onChange={set("full_name")} required placeholder="Priya Sharma" className={inputCls} />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-600 text-neutral-500">Username</span>
          <input
            value={form.username}
            onChange={set("username")}
            required
            autoCapitalize="none"
            placeholder="priya"
            className={inputCls}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-600 text-neutral-500">Email (optional)</span>
          <input type="email" value={form.email} onChange={set("email")} className={inputCls} />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-600 text-neutral-500">Phone (optional)</span>
          <input type="tel" value={form.phone} onChange={set("phone")} className={inputCls} />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-600 text-neutral-500">Temporary password</span>
          <input
            type="text"
            value={form.password}
            onChange={set("password")}
            required
            minLength={8}
            autoComplete="off"
            placeholder="At least 8 characters"
            className={cn(inputCls, "font-mono")}
          />
        </label>

        {error && <p className="mt-3 text-xs font-500 text-red-600">{error}</p>}
        {ok && <p className="mt-3 text-xs font-500 text-emerald-600">{ok}</p>}

        <button
          type="submit"
          disabled={creating}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 py-2.5 text-sm font-600 text-white transition hover:bg-primary-600 disabled:opacity-60"
        >
          {creating && <Loader2 size={15} className="animate-spin" />}
          {creating ? "Creating…" : "Create account"}
        </button>
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
          New accounts can view and triage submissions. Only you can manage accounts and delete
          submissions.
        </p>
      </form>

      {/* List */}
      <div className="h-fit overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-card">
        <div className="border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-700 text-ink">
            Accounts <span className="text-neutral-400">({accounts.length})</span>
          </h2>
        </div>
        <ul className="divide-y divide-neutral-50">
          {accounts.map((acc) => (
            <AccountRow
              key={acc.id}
              account={acc}
              isSelf={acc.id === currentId}
              open={openId === acc.id}
              onToggle={() => setOpenId(openId === acc.id ? null : acc.id)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function AccountRow({
  account,
  isSelf,
  open,
  onToggle,
}: {
  account: AdminAccount;
  isSelf: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const isSuper = account.role === "super_admin";
  const [details, setDetails] = useState({
    full_name: account.full_name,
    email: account.email ?? "",
    phone: account.phone ?? "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(action: string, url: string, method: string, body?: unknown, success?: string) {
    setMsg(null);
    setBusy(action);
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setMsg({ ok: false, text: data.error ?? "Something went wrong." });
      return false;
    }
    if (success) setMsg({ ok: true, text: success });
    router.refresh();
    return true;
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    await call("details", `/api/accounts/${account.id}`, "PATCH", details, "Details saved.");
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    const done = await call(
      "password",
      `/api/accounts/${account.id}/password`,
      "POST",
      { password: newPassword },
      `Password reset. Share the new password with ${account.full_name || account.username} — they've been signed out everywhere.`,
    );
    if (done) setNewPassword("");
  }

  async function onDelete() {
    if (!confirm(`Remove “${account.username}”? They will lose access immediately.`)) return;
    await call("delete", `/api/accounts/${account.id}`, "DELETE");
  }

  return (
    <li className={cn(!account.is_active && "bg-neutral-50/60")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-neutral-50"
      >
        <span
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-700 uppercase",
            isSuper ? "bg-primary-100 text-primary-700" : "bg-neutral-100 text-neutral-500",
          )}
        >
          {(account.full_name || account.username).slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-600 text-ink">
            <span className={cn(!account.is_active && "text-neutral-400 line-through")}>
              {account.full_name || account.username}
            </span>
            <span className="text-xs font-500 text-neutral-400">@{account.username}</span>
            {isSuper && (
              <Badge className="bg-primary-50 text-primary-700">
                <Crown size={10} /> Super admin
              </Badge>
            )}
            {isSelf && (
              <Badge className="bg-secondary-50 text-secondary-700">
                <ShieldCheck size={10} /> You
              </Badge>
            )}
            {!account.is_active && <Badge className="bg-red-50 text-red-600">Disabled</Badge>}
            {account.is_reset_contact && (
              <Badge className="bg-emerald-50 text-emerald-700">
                <LifeBuoy size={10} /> Reset contact
              </Badge>
            )}
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">Last sign-in: {formatDateTime(account.last_login_at)}</p>
        </div>
        <ChevronDown size={16} className={cn("flex-shrink-0 text-neutral-400 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="grid gap-4 border-t border-neutral-50 bg-surface/60 px-5 py-4 xl:grid-cols-2">
          <form onSubmit={saveDetails} className="rounded-xl border border-neutral-100 bg-white p-4">
            <p className="mb-3 text-xs font-700 uppercase tracking-[0.1em] text-neutral-500">Details</p>
            <input
              value={details.full_name}
              onChange={(e) => setDetails({ ...details, full_name: e.target.value })}
              required
              placeholder="Full name"
              aria-label="Full name"
              className={inputCls}
            />
            <div className="relative mt-2">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={details.email}
                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                placeholder="Email"
                aria-label="Email"
                className={cn(inputCls, "pl-9")}
              />
            </div>
            <div className="relative mt-2">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="tel"
                value={details.phone}
                onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                placeholder="Phone"
                aria-label="Phone"
                className={cn(inputCls, "pl-9")}
              />
            </div>
            <button
              type="submit"
              disabled={busy !== null}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-600 text-white transition hover:bg-primary-600 disabled:opacity-60"
            >
              {busy === "details" && <Loader2 size={13} className="animate-spin" />}
              Save details
            </button>
          </form>

          <div className="space-y-4">
            {!isSelf && (
              <form onSubmit={resetPassword} className="rounded-xl border border-neutral-100 bg-white p-4">
                <p className="mb-3 text-xs font-700 uppercase tracking-[0.1em] text-neutral-500">Reset password</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="off"
                    placeholder="New password (8+ chars)"
                    aria-label="New password"
                    className={cn(inputCls, "font-mono")}
                  />
                  <button
                    type="submit"
                    disabled={busy !== null}
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-600 text-white transition hover:bg-primary-600 disabled:opacity-60"
                  >
                    {busy === "password" ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                    Reset
                  </button>
                </div>
              </form>
            )}
            {isSelf && (
              <p className="rounded-xl border border-neutral-100 bg-white p-4 text-xs text-neutral-500">
                Change your own password from <span className="font-600 text-ink">My account</span>.
              </p>
            )}

            <div className="rounded-xl border border-neutral-100 bg-white p-4">
              <p className="mb-3 text-xs font-700 uppercase tracking-[0.1em] text-neutral-500">Access</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    call("contact", `/api/accounts/${account.id}`, "PATCH", {
                      is_reset_contact: !account.is_reset_contact,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-600 text-neutral-600 transition hover:border-primary-200 hover:text-primary-600 disabled:opacity-50"
                >
                  {busy === "contact" ? <Loader2 size={13} className="animate-spin" /> : <LifeBuoy size={13} />}
                  {account.is_reset_contact ? "Hide from forgot-password page" : "Show on forgot-password page"}
                </button>
                {!isSelf && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      call("active", `/api/accounts/${account.id}`, "PATCH", { is_active: !account.is_active })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-600 text-neutral-600 transition hover:border-amber-300 hover:text-amber-700 disabled:opacity-50"
                  >
                    {busy === "active" ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
                    {account.is_active ? "Disable access" : "Enable access"}
                  </button>
                )}
                {!isSuper && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={onDelete}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-600 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {busy === "delete" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    Delete
                  </button>
                )}
              </div>
            </div>

            {msg && (
              <p className={cn("text-xs font-500", msg.ok ? "text-emerald-600" : "text-red-600")}>{msg.text}</p>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-600",
        className,
      )}
    >
      {children}
    </span>
  );
}
