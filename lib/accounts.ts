import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { SITE } from "@/lib/site";

/* ============================================================
   ADMIN ACCOUNTS - username + password records with a role.
   Mirrors the `<prefix>_admin_users` table in supabase/setup.sql.

     • super_admin - exactly one (enforced by a unique index).
       Creates/removes accounts, resets anyone's password,
       enables/disables access, picks the reset contacts.
     • admin       - can view and triage submissions, and manage
       their own profile/password.
   ============================================================ */

export type Role = "super_admin" | "admin";

export interface AdminAccount {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  is_reset_contact: boolean;
  session_version: number;
  last_login_at: string | null;
  created_at: string;
}

/** What the public forgot-password page may show. */
export interface ResetContact {
  full_name: string;
  email: string | null;
  phone: string | null;
}

const TABLE = SITE.tables.users;
const COLUMNS =
  "id, username, full_name, email, phone, role, is_active, is_reset_contact, session_version, last_login_at, created_at";

const USERNAME_RE = /^[a-z0-9_.-]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: string | null | undefined, max: number): string | null {
  const v = (value ?? "").trim();
  return v ? v.slice(0, max) : null;
}

export function validatePassword(password: string): void {
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (password.length > 200) throw new Error("Password is too long.");
}

export interface ProfileInput {
  full_name?: string;
  email?: string | null;
  phone?: string | null;
}

function normaliseProfile(input: ProfileInput) {
  const full_name = (input.full_name ?? "").trim().slice(0, 120);
  if (!full_name) throw new Error("Full name is required.");
  const email = cleanText(input.email, 320);
  if (email && !EMAIL_RE.test(email)) throw new Error("That email address doesn't look right.");
  const phone = cleanText(input.phone, 40);
  return { full_name, email, phone };
}

export async function listAccounts(): Promise<AdminAccount[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(COLUMNS)
    .order("role", { ascending: false }) // super_admin first
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminAccount[];
}

export async function getAccount(id: string): Promise<AdminAccount | null> {
  const { data, error } = await supabaseAdmin.from(TABLE).select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AdminAccount) ?? null;
}

export async function getAccountByUsername(username: string): Promise<AdminAccount | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(COLUMNS)
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AdminAccount) ?? null;
}

/** Returns the account on success, or null on bad credentials / disabled account. */
export async function authenticate(username: string, password: string): Promise<AdminAccount | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(`${COLUMNS}, password_hash`)
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();
  if (error || !data) return null;
  const ok = await verifyPassword(password, data.password_hash as string);
  if (!ok || !data.is_active) return null;
  await supabaseAdmin.from(TABLE).update({ last_login_at: new Date().toISOString() }).eq("id", data.id);
  const account: Record<string, unknown> = { ...data };
  delete account.password_hash;
  return account as unknown as AdminAccount;
}

export async function checkPassword(id: string, password: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from(TABLE).select("password_hash").eq("id", id).maybeSingle();
  if (error || !data) return false;
  return verifyPassword(password, data.password_hash as string);
}

export async function createAccount(
  input: ProfileInput & { username: string; password: string },
): Promise<AdminAccount> {
  const username = input.username.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) {
    throw new Error("Username must be 3–32 chars: letters, numbers, . _ - only.");
  }
  validatePassword(input.password);
  const profile = normaliseProfile(input);
  const password_hash = await hashPassword(input.password);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({ username, password_hash, role: "admin", ...profile })
    .select(COLUMNS)
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("That username is already taken.");
    throw new Error(error.message);
  }
  return data as AdminAccount;
}

export async function updateProfile(id: string, input: ProfileInput): Promise<AdminAccount> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(normaliseProfile(input))
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as AdminAccount;
}

/** Super-admin-only switches. Disabling an account also signs it out everywhere. */
export async function updateAccess(
  account: AdminAccount,
  patch: { is_active?: boolean; is_reset_contact?: boolean },
): Promise<AdminAccount> {
  const row: Record<string, unknown> = {};
  if (typeof patch.is_reset_contact === "boolean") row.is_reset_contact = patch.is_reset_contact;
  if (typeof patch.is_active === "boolean") {
    row.is_active = patch.is_active;
    if (!patch.is_active) row.session_version = account.session_version + 1;
  }
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(row)
    .eq("id", account.id)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as AdminAccount;
}

/** Sets a new password and bumps session_version, signing the account out of every device. */
export async function setPassword(account: AdminAccount, password: string): Promise<AdminAccount> {
  validatePassword(password);
  const password_hash = await hashPassword(password);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ password_hash, session_version: account.session_version + 1 })
    .eq("id", account.id)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as AdminAccount;
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** People listed on the public forgot-password page. Falls back to the super admin. */
export async function listResetContacts(): Promise<ResetContact[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("full_name, email, phone, role, is_reset_contact")
    .eq("is_active", true)
    .or("is_reset_contact.eq.true,role.eq.super_admin")
    .order("role", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const flagged = rows.filter((r) => r.is_reset_contact);
  const chosen = flagged.length ? flagged : rows.filter((r) => r.role === "super_admin");
  return chosen.map(({ full_name, email, phone }) => ({ full_name, email, phone }));
}
