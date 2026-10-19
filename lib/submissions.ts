import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { SITE } from "@/lib/site";

/* ============================================================
   SUBMISSIONS data access - service-role, full read/manage.
   Mirrors the `<prefix>_submissions` table in supabase/setup.sql.
   Rows are written by the public website's forms (anon
   insert-only RLS policy); this admin panel is the only place
   that can read or manage them.

     kind = 'contact'      → the contact-us form
     kind = 'application'  → careers / volunteer / programme applications
   ============================================================ */

export type SubmissionStatus = "new" | "read" | "archived";
export type SubmissionKind = "contact" | "application";

export interface Submission {
  id: string;
  kind: SubmissionKind;
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  topics: string[];
  message: string;
  position: string | null;
  resume_url: string | null;
  details: Record<string, unknown>;
  source_page: string | null;
  status: SubmissionStatus;
  created_at: string;
}

const TABLE = SITE.tables.submissions;

export async function listSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Submission[];
}

export async function setSubmissionStatus(id: string, status: SubmissionStatus): Promise<Submission> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Submission;
}

export async function deleteSubmission(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
