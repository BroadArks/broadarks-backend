import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { updateProfile } from "@/lib/accounts";

/* Any signed-in user: update your own name / email / phone. */
export async function PATCH(request: Request) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { full_name?: string; email?: string | null; phone?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const account = await updateProfile(current.id, body);
    return NextResponse.json({ account });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update your profile." },
      { status: 400 },
    );
  }
}
