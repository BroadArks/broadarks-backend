"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, UserRound } from "lucide-react";

const inputCls =
  "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

export default function MyAccount({
  profile,
  isResetContact,
}: {
  profile: { full_name: string; email: string; phone: string };
  isResetContact: boolean;
}) {
  const router = useRouter();
  const [details, setDetails] = useState(profile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });
    const data = await res.json().catch(() => ({}));
    setSavingProfile(false);
    if (!res.ok) {
      setProfileMsg({ ok: false, text: data.error ?? "Could not save your details." });
      return;
    }
    setProfileMsg({ ok: true, text: "Details saved." });
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: "The new passwords don't match." });
      return;
    }
    setSavingPassword(true);
    const res = await fetch("/api/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingPassword(false);
    if (!res.ok) {
      setPasswordMsg({ ok: false, text: data.error ?? "Could not change your password." });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMsg({ ok: true, text: "Password changed. Other devices have been signed out." });
  }

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="h-fit rounded-2xl border border-neutral-100 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <UserRound size={16} />
          </span>
          <h2 className="text-sm font-700 text-ink">Your details</h2>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-600 text-neutral-500">Full name</span>
          <input
            value={details.full_name}
            onChange={(e) => setDetails({ ...details, full_name: e.target.value })}
            required
            className={inputCls}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-600 text-neutral-500">Email</span>
          <input
            type="email"
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-600 text-neutral-500">Phone</span>
          <input
            type="tel"
            value={details.phone}
            onChange={(e) => setDetails({ ...details, phone: e.target.value })}
            className={inputCls}
          />
        </label>
        {isResetContact && (
          <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-neutral-500">
            Your email and phone are shown on the public forgot-password page so people can ask you to
            reset their password.
          </p>
        )}
        {profileMsg && (
          <p className={`mt-3 text-xs font-500 ${profileMsg.ok ? "text-emerald-600" : "text-red-600"}`}>
            {profileMsg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={savingProfile}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 py-2.5 text-sm font-600 text-white transition hover:bg-primary-600 disabled:opacity-60"
        >
          {savingProfile && <Loader2 size={15} className="animate-spin" />}
          {savingProfile ? "Saving…" : "Save details"}
        </button>
      </form>

      <form onSubmit={changePassword} className="h-fit rounded-2xl border border-neutral-100 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <KeyRound size={16} />
          </span>
          <h2 className="text-sm font-700 text-ink">Change password</h2>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-600 text-neutral-500">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className={inputCls}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-600 text-neutral-500">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
            className={inputCls}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-600 text-neutral-500">Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className={inputCls}
          />
        </label>
        {passwordMsg && (
          <p className={`mt-3 text-xs font-500 ${passwordMsg.ok ? "text-emerald-600" : "text-red-600"}`}>
            {passwordMsg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={savingPassword}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 py-2.5 text-sm font-600 text-white transition hover:bg-primary-600 disabled:opacity-60"
        >
          {savingPassword && <Loader2 size={15} className="animate-spin" />}
          {savingPassword ? "Updating…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
