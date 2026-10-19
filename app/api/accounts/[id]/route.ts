import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { deleteAccount, getAccount, updateAccess, updateProfile } from "@/lib/accounts";

/* Super admin only: edit someone's details / access, or remove them. */

async function guard() {
  const current = await getCurrentAccount();
  if (!current) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (current.role !== "super_admin") {
    return {
      error: NextResponse.json({ error: "Only the super admin can manage accounts." }, { status: 403 }),
    };
  }
  return { current };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { current, error } = await guard();
  if (error) return error;
  const { id } = await params;

  let body: {
    full_name?: string;
    email?: string | null;
    phone?: string | null;
    is_active?: boolean;
    is_reset_contact?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let account = await getAccount(id);
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (body.is_active === false && account.id === current.id) {
    return NextResponse.json({ error: "You can't disable your own account." }, { status: 400 });
  }

  try {
    if (body.full_name !== undefined) {
      account = await updateProfile(id, {
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
      });
    }
    if (typeof body.is_active === "boolean" || typeof body.is_reset_contact === "boolean") {
      account = await updateAccess(account, {
        is_active: body.is_active,
        is_reset_contact: body.is_reset_contact,
      });
    }
    return NextResponse.json({ account });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update the account." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await guard();
  if (error) return error;
  const { id } = await params;

  const account = await getAccount(id);
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (account.role === "super_admin") {
    return NextResponse.json({ error: "The super admin account can't be deleted." }, { status: 400 });
  }

  await deleteAccount(id);
  return NextResponse.json({ ok: true });
}
