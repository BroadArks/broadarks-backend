import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { deleteSubmission, setSubmissionStatus, type SubmissionStatus } from "@/lib/submissions";

const VALID_STATUSES: SubmissionStatus[] = ["new", "read", "archived"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getCurrentAccount())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.status || !VALID_STATUSES.includes(body.status as SubmissionStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  try {
    const submission = await setSubmissionStatus(id, body.status as SubmissionStatus);
    return NextResponse.json({ submission });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update the submission." },
      { status: 400 },
    );
  }
}

/* Deleting is permanent, so only the super admin may do it. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (current.role !== "super_admin") {
    return NextResponse.json({ error: "Only the super admin can delete submissions." }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteSubmission(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete the submission." },
      { status: 400 },
    );
  }
}
