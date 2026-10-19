import { requireAccount } from "@/lib/session";
import AdminShell from "@/components/AdminShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAccount();
  return (
    <AdminShell
      username={account.username}
      fullName={account.full_name}
      isSuperAdmin={account.role === "super_admin"}
    >
      {children}
    </AdminShell>
  );
}
