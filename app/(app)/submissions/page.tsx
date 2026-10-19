import { AlertTriangle } from "lucide-react";
import { listSubmissions, type Submission } from "@/lib/submissions";
import { requireAccount } from "@/lib/session";
import { SITE } from "@/lib/site";
import SubmissionsList from "@/components/SubmissionsList";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const account = await requireAccount();
  let submissions: Submission[] = [];
  let error = "";
  try {
    submissions = await listSubmissions();
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load submissions.";
  }

  const stats = [
    { label: "Total", value: submissions.length },
    { label: "New", value: submissions.filter((s) => s.status === "new").length },
    { label: "Contact forms", value: submissions.filter((s) => s.kind === "contact").length },
    { label: "Applications", value: submissions.filter((s) => s.kind === "application").length },
  ];

  return (
    <div>
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-700 uppercase tracking-[0.15em] text-primary-500">Inbox</p>
        <h1 className="font-heading text-2xl font-800 tracking-tight text-ink">Submissions</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Applications and contact-form enquiries submitted on {SITE.websiteLabel}.
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-600">Couldn&apos;t reach the database.</p>
            <p className="mt-1 text-amber-700">{error}</p>
            <p className="mt-2 text-amber-700">
              Make sure you&apos;ve copied <code className="font-mono">.env.example</code> to{" "}
              <code className="font-mono">.env.local</code>, filled in your Supabase credentials,
              and run <code className="font-mono">supabase/setup.sql</code>.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-card">
                <p className="text-[11px] font-600 uppercase tracking-[0.12em] text-neutral-400">{s.label}</p>
                <p className="mt-1 font-heading text-2xl font-800 text-ink">{s.value}</p>
              </div>
            ))}
          </div>
          <SubmissionsList submissions={submissions} canDelete={account.role === "super_admin"} />
        </>
      )}
    </div>
  );
}
