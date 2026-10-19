import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { getAccount, setPassword } from "@/lib/accounts";

/* Super admin only: reset someone's password. Signs them out everywhere. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (current.role !== "super_admin") {
    return NextResponse.json({ error: "Only the super admin can reset passwords." }, { status: 403 });
  }
  const { id } = await params;
  if (id === current.id) {
    return NextResponse.json(
      { error: "Change your own password from the My account page." },
      { status: 400 },
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const account = await getAccount(id);
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  try {
    await setPassword(account, body.password ?? "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not reset the password." },
      { status: 400 },
    );
  }
}
