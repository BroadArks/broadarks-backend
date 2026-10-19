import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { createAccount } from "@/lib/accounts";

/* Super admin only: give someone access to the panel. */
export async function POST(request: Request) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (current.role !== "super_admin") {
    return NextResponse.json({ error: "Only the super admin can add accounts." }, { status: 403 });
  }
  let body: { username?: string; password?: string; full_name?: string; email?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const account = await createAccount({
      username: body.username ?? "",
      password: body.password ?? "",
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
    });
    return NextResponse.json({ account }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create account." },
      { status: 400 },
    );
  }
}
