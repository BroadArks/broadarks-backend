"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Briefcase,
  Building2,
  CheckCheck,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RotateCcw,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { SITE } from "@/lib/site";
import type { Submission, SubmissionKind, SubmissionStatus } from "@/lib/submissions";

const KIND_TABS: { value: "all" | SubmissionKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "contact", label: "Contact forms" },
  { value: "application", label: "Applications" },
];

export default function SubmissionsList({
  submissions,
  canDelete,
}: {
  submissions: Submission[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | SubmissionKind>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const visible = submissions.filter((s) => {
    const search = query.trim().toLowerCase();
    const matches =
      !search ||
      [s.name, s.organisation, s.email, s.phone, s.position, s.message, ...s.topics].some((value) =>
        (value ?? "").toLowerCase().includes(search),
      );
    return (
      matches &&
      (kind === "all" || s.kind === kind) &&
      (statusFilter === "all" || s.status === statusFilter)
    );
  });

  async function updateStatus(submission: Submission, status: SubmissionStatus) {
    setError("");
    setBusy(submission.id);
    const res = await fetch(`/api/submissions/${submission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update the submission.");
      return;
    }
    router.refresh();
  }

  async function onDelete(submission: Submission) {
    if (!confirm(`Delete the submission from "${submission.name}"? This cannot be undone.`)) return;
    setError("");
    setBusy(submission.id);
    const res = await fetch(`/api/submissions/${submission.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not delete the submission.");
      return;
    }
    router.refresh();
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center">
        <p className="text-sm text-neutral-500">
          Nothing yet. Submissions will show up here as soon as someone fills in a form on {SITE.websiteLabel}.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-card lg:flex-row lg:items-center">
        <div className="flex rounded-xl bg-surface p-1" role="tablist" aria-label="Submission type">
          {KIND_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={kind === tab.value}
              onClick={() => setKind(tab.value)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-600 transition",
                kind === tab.value ? "bg-white text-primary-700 shadow-sm" : "text-neutral-500 hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="relative flex-1">
          <span className="sr-only">Search submissions</span>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, organisation, email, or message…"
            className="w-full rounded-xl border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </label>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            aria-label="Filter by status"
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-600 text-neutral-600 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
          <span className="whitespace-nowrap text-xs text-neutral-400">{visible.length} shown</span>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-500 text-red-600">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {visible.map((s) => (
          <div key={s.id} className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-700 text-ink">{s.name}</h3>
                  <KindBadge kind={s.kind} />
                  <StatusBadge status={s.status} />
                </div>
                {(s.organisation || s.position) && (
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {[s.position, s.organisation].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <span className="text-xs text-neutral-400">{formatDateTime(s.created_at)}</span>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
              <a href={`mailto:${s.email}`} className="flex min-w-0 items-center gap-2 hover:text-primary-600">
                <Mail size={14} className="flex-shrink-0 text-neutral-400" />
                <span className="truncate">{s.email}</span>
              </a>
              {s.phone && (
                <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:text-primary-600">
                  <Phone size={14} className="flex-shrink-0 text-neutral-400" />
                  {s.phone}
                </a>
              )}
              {s.organisation && (
                <span className="flex min-w-0 items-center gap-2">
                  <Building2 size={14} className="flex-shrink-0 text-neutral-400" />
                  <span className="truncate">{s.organisation}</span>
                </span>
              )}
              {s.topics.length > 0 && (
                <span className="flex min-w-0 items-center gap-2">
                  <Tag size={14} className="flex-shrink-0 text-neutral-400" />
                  <span className="truncate">{s.topics.join(", ")}</span>
                </span>
              )}
              {s.resume_url && /^https?:\/\//i.test(s.resume_url) && (
                <a
                  href={s.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <FileText size={14} className="flex-shrink-0" />
                  View CV / attachment
                </a>
              )}
            </div>

            {s.message && (
              <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-surface p-3 text-sm leading-relaxed text-neutral-700">
                {s.message}
              </p>
            )}

            {Object.keys(s.details ?? {}).length > 0 && (
              <dl className="mt-3 grid gap-x-6 gap-y-1.5 rounded-xl border border-neutral-100 p-3 text-xs sm:grid-cols-2">
                {Object.entries(s.details).map(([key, value]) => (
                  <div key={key} className="flex min-w-0 gap-2">
                    <dt className="flex-shrink-0 font-600 capitalize text-neutral-500">{key.replace(/_/g, " ")}:</dt>
                    <dd className="min-w-0 break-words text-neutral-700">
                      {typeof value === "string" ? value : JSON.stringify(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {s.status !== "read" && (
                <button
                  onClick={() => updateStatus(s, "read")}
                  disabled={busy === s.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-600 text-neutral-600 transition hover:border-primary-200 hover:text-primary-600 disabled:opacity-50"
                >
                  <CheckCheck size={13} /> Mark read
                </button>
              )}
              {s.status !== "new" && (
                <button
                  onClick={() => updateStatus(s, "new")}
                  disabled={busy === s.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-600 text-neutral-600 transition hover:border-primary-200 hover:text-primary-600 disabled:opacity-50"
                >
                  <RotateCcw size={13} /> Mark new
                </button>
              )}
              {s.status !== "archived" && (
                <button
                  onClick={() => updateStatus(s, "archived")}
                  disabled={busy === s.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-600 text-neutral-600 transition hover:border-neutral-300 disabled:opacity-50"
                >
                  <Archive size={13} /> Archive
                </button>
              )}
              {busy === s.id && <Loader2 size={14} className="animate-spin text-neutral-400" />}
              {canDelete && (
                <button
                  onClick={() => onDelete(s)}
                  disabled={busy === s.id}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-600 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
            No submissions match these filters.
          </div>
        )}
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: SubmissionKind }) {
  const Icon = kind === "application" ? Briefcase : MessageSquare;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide",
        kind === "application" ? "bg-secondary-50 text-secondary-700" : "bg-neutral-100 text-neutral-600",
      )}
    >
      <Icon size={10} />
      {kind === "application" ? "Application" : "Contact"}
    </span>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const styles: Record<SubmissionStatus, string> = {
    new: "bg-primary-50 text-primary-700",
    read: "bg-emerald-50 text-emerald-700",
    archived: "bg-neutral-100 text-neutral-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}
