import { NextResponse } from "next/server";
import { authenticate } from "@/lib/accounts";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  let account;
  try {
    account = await authenticate(username, password);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not reach the database." },
      { status: 500 },
    );
  }
  if (!account) {
    return NextResponse.json(
      { error: "Invalid username or password, or this account has been disabled." },
      { status: 401 },
    );
  }

  await createSession(account);
  return NextResponse.json({ ok: true, username: account.username });
}
