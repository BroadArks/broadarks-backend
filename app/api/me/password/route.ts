import { NextResponse } from "next/server";
import { createSession, getCurrentAccount } from "@/lib/session";
import { checkPassword, setPassword } from "@/lib/accounts";

/* Any signed-in user: change your own password (needs the current one).
   Other devices are signed out; this one gets a fresh cookie. */
export async function POST(request: Request) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { current_password?: string; new_password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!(await checkPassword(current.id, body.current_password ?? ""))) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  }
  try {
    const account = await setPassword(current, body.new_password ?? "");
    await createSession(account);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not change your password." },
      { status: 400 },
    );
  }
}
