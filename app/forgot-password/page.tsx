import Link from "next/link";
import { ArrowLeft, KeyRound, Mail, Phone } from "lucide-react";
import { listResetContacts, type ResetContact } from "@/lib/accounts";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

/* Public page. There is no self-service reset: passwords are reset
   by the super admin, so this page just tells people who to ask. */
export default async function ForgotPasswordPage() {
  let contacts: ResetContact[] = [];
  try {
    contacts = await listResetContacts();
  } catch {
    contacts = [];
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-12">
      <div className="pointer-events-none absolute left-0 top-0 h-1 w-full bg-primary-500" aria-hidden />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-sm">
            <KeyRound size={20} />
          </div>
          <h1 className="font-heading text-xl font-800 text-ink">Forgot your password?</h1>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-neutral-500">
            For security, passwords for the {SITE.panelName} can only be reset by an administrator.
            Contact {contacts.length === 1 ? "the person" : "one of the people"} below and they&apos;ll
            set a new password for you.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-2 shadow-card">
          {contacts.length === 0 ? (
            <p className="p-5 text-center text-sm text-neutral-500">
              Please contact your {SITE.name} administrator to reset your password.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-50">
              {contacts.map((c, i) => (
                <li key={i} className="p-4">
                  <p className="text-sm font-700 text-ink">{c.full_name || "Administrator"}</p>
                  <div className="mt-2 space-y-1.5 text-sm text-neutral-600">
                    {c.email && (
                      <a
                        href={`mailto:${c.email}?subject=${encodeURIComponent(`${SITE.panelName} password reset`)}`}
                        className="flex items-center gap-2 hover:text-primary-600"
                      >
                        <Mail size={14} className="flex-shrink-0 text-neutral-400" />
                        <span className="truncate">{c.email}</span>
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:text-primary-600">
                        <Phone size={14} className="flex-shrink-0 text-neutral-400" />
                        {c.phone}
                      </a>
                    )}
                    {!c.email && !c.phone && (
                      <p className="text-xs text-neutral-400">No contact details on file.</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-neutral-400">
          Tell them your username. Once reset, you&apos;ll be signed out of every device.
        </p>

        <Link
          href="/login"
          className="mx-auto mt-6 flex w-fit items-center gap-1.5 text-sm font-600 text-primary-500 hover:text-primary-700"
        >
          <ArrowLeft size={15} /> Back to sign in
        </Link>
      </div>
    </main>
  );
}
