import { AlertTriangle } from "lucide-react";
import { listAccounts, type AdminAccount } from "@/lib/accounts";
import { requireSuperAdmin } from "@/lib/session";
import AccountsManager from "@/components/AccountsManager";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const current = await requireSuperAdmin();
  let accounts: AdminAccount[] = [];
  let error = "";
  try {
    accounts = await listAccounts();
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load accounts.";
  }

  return (
    <div>
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-700 uppercase tracking-[0.15em] text-primary-500">Super admin</p>
        <h1 className="font-heading text-2xl font-800 tracking-tight text-ink">Accounts &amp; access</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Give people access, reset their passwords, and choose who appears on the forgot-password page.
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-600">Couldn&apos;t reach the database.</p>
            <p className="mt-1 text-amber-700">{error}</p>
          </div>
        </div>
      ) : (
        <AccountsManager accounts={accounts} currentId={current.id} />
      )}
    </div>
  );
}
