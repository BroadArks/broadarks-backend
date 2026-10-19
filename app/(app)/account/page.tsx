import { requireAccount } from "@/lib/session";
import MyAccount from "@/components/MyAccount";

export const dynamic = "force-dynamic";

export default async function MyAccountPage() {
  const account = await requireAccount();
  return (
    <div>
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-700 uppercase tracking-[0.15em] text-primary-500">Profile</p>
        <h1 className="font-heading text-2xl font-800 tracking-tight text-ink">My account</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Signed in as <span className="font-600 text-ink">@{account.username}</span> ·{" "}
          {account.role === "super_admin" ? "Super admin" : "Admin"}
        </p>
      </div>
      <MyAccount
        profile={{ full_name: account.full_name, email: account.email ?? "", phone: account.phone ?? "" }}
        isResetContact={account.is_reset_contact}
      />
    </div>
  );
}
