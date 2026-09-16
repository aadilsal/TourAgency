"use client";

import { Fragment, useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { StatusSelect } from "@/components/admin/shared/StatusSelect";
import { InlineNoteEditor } from "@/components/admin/shared/InlineNoteEditor";
import { InboxFilterTabs, LoadMoreFooter } from "@/components/admin/shared/InboxControls";

type StatusFilter = "all" | "pending" | "processed" | "rejected";
type VisaStatus = "pending" | "processed" | "rejected";

const statuses: readonly VisaStatus[] = ["pending", "processed", "rejected"];
const PAGE_SIZE = 25;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "processed", label: "Processed" },
  { id: "rejected", label: "Rejected" },
] as const;

function formatWhen(ts: number) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(ts);
  }
}

function formatSex(sex: string) {
  if (sex === "male") return "Male";
  if (sex === "female") return "Female";
  return "Other";
}

export function AdminVisaInvitationsPanel() {
  const sessionToken = useConvexSessionToken();
  const canMutate = typeof sessionToken === "string";
  const [filter, setFilter] = useState<StatusFilter>("all");
  const { results, status, loadMore } = usePaginatedQuery(
    api.visaInvitations.listForAdminPage,
    canMutate
      ? { sessionToken, ...(filter === "all" ? {} : { status: filter }) }
      : "skip",
    { initialNumItems: PAGE_SIZE },
  );
  const setStatus = useMutation(api.visaInvitations.setStatus);
  const setAdminNote = useMutation(api.visaInvitations.setAdminNote);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function requireToken(): string {
    if (typeof sessionToken !== "string") {
      throw new Error("Session expired — refresh and sign in again.");
    }
    return sessionToken;
  }

  return (
    <div className="space-y-4">
      <InboxFilterTabs options={FILTERS} value={filter} onChange={setFilter} />

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="whitespace-nowrap border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Travelers</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const isOpen = expandedId === r._id;
              return (
                <Fragment key={r._id}>
                  <tr className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-600">{formatWhen(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-brand-ink">{r.contactName}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{r.contactEmail}</span>
                      <span className="block text-xs text-slate-500">{r.contactPhone}</span>
                      {r.adminNote ? (
                        <span className="mt-1 block max-w-[260px] truncate text-xs italic text-slate-500">
                          Note: {r.adminNote}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                        {r.travelers.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect
                        value={r.status}
                        options={statuses}
                        disabled={!canMutate}
                        label={`Set status for ${r.contactName}`}
                        // Status only — the note is never sent, so it can't be wiped.
                        onChange={(next) =>
                          setStatus({
                            sessionToken: requireToken(),
                            requestId: r._id as Id<"visaInvitationRequests">,
                            status: next,
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        className="!min-h-9 !px-2 !py-1.5 !text-xs"
                        aria-expanded={isOpen}
                        onClick={() => setExpandedId(isOpen ? null : r._id)}
                      >
                        {isOpen ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Details
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="bg-slate-50/80">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-[640px] w-full text-left text-xs">
                            <thead>
                              <tr className="whitespace-nowrap border-b border-slate-200 text-slate-500">
                                <th className="py-2 pr-3">Name</th>
                                <th className="py-2 pr-3">Sex</th>
                                <th className="py-2 pr-3">Nationality</th>
                                <th className="py-2 pr-3">DOB</th>
                                <th className="py-2 pr-3">Passport</th>
                                <th className="py-2 pr-3">Issue</th>
                                <th className="py-2 pr-3">Expiry</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.travelers.map((t, i) => (
                                <tr
                                  key={`${r._id}-t-${i}`}
                                  className="border-b border-slate-100 last:border-0"
                                >
                                  <td className="py-2 pr-3 font-medium text-slate-900">{t.name}</td>
                                  <td className="py-2 pr-3">{formatSex(t.sex)}</td>
                                  <td className="py-2 pr-3">{t.nationalityLabel}</td>
                                  <td className="py-2 pr-3">{t.dateOfBirth}</td>
                                  <td className="py-2 pr-3 font-mono">{t.passportNumber}</td>
                                  <td className="py-2 pr-3">{t.passportIssueDate}</td>
                                  <td className="py-2 pr-3">{t.passportExpiryDate}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <InlineNoteEditor
                          className="mt-4"
                          value={r.adminNote}
                          disabled={!canMutate}
                          hint="Internal only — not sent to the applicant."
                          onSave={(note) =>
                            setAdminNote({
                              sessionToken: requireToken(),
                              requestId: r._id as Id<"visaInvitationRequests">,
                              adminNote: note,
                            })
                          }
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <LoadMoreFooter
          status={canMutate ? status : "LoadingFirstPage"}
          count={results.length}
          onLoadMore={() => loadMore(PAGE_SIZE)}
          noun="requests"
          emptyText={
            filter === "all"
              ? "No visa invitation requests yet."
              : "No requests match this filter."
          }
        />
      </div>
    </div>
  );
}
