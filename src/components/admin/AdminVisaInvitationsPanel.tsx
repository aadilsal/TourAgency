"use client";

import { Fragment, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { useSafePaginatedQuery } from "@/hooks/useSafePaginatedQuery";
import { QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { StatusSelect } from "@/components/admin/shared/StatusSelect";
import { InlineNoteEditor } from "@/components/admin/shared/InlineNoteEditor";
import { InboxFilterTabs, LoadMoreFooter } from "@/components/admin/shared/InboxControls";
import { ContactActions } from "@/components/admin/shared/ContactActions";
import { useInboxFilter } from "@/components/admin/shared/inboxHooks";
import { VISA_STATUS_LABEL, labelFrom } from "@/components/admin/shared/statusLabels";

type StatusFilter = "all" | "pending" | "processed" | "rejected";
type VisaStatus = "pending" | "processed" | "rejected";
type VisaRow = Doc<"visaInvitationRequests">;

const statuses: readonly VisaStatus[] = ["pending", "processed", "rejected"];
const PAGE_SIZE = 25;

const FILTERS = [
  { id: "pending", label: "Pending" },
  { id: "all", label: "All" },
  { id: "processed", label: "Invitation sent" },
  { id: "rejected", label: "Rejected" },
] as const;
const FILTER_IDS = FILTERS.map((f) => f.id);

const statusLabel = labelFrom(VISA_STATUS_LABEL);

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

function travellersLabel(n: number) {
  return `${n} ${n === 1 ? "traveller" : "travellers"}`;
}

export function AdminVisaInvitationsPanel() {
  const sessionToken = useConvexSessionToken();
  const canMutate = typeof sessionToken === "string";
  const [filter, setFilter] = useInboxFilter<StatusFilter>(FILTER_IDS, "pending");
  const { results, status, loadMore, error } = useSafePaginatedQuery(
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

  const statusSelect = (r: VisaRow) => (
    <StatusSelect
      value={r.status}
      options={statuses}
      labelFor={statusLabel}
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
  );

  const toggle = (r: VisaRow, isOpen: boolean) => (
    <Button
      type="button"
      variant="ghost"
      className="!px-2 !py-1.5 !text-sm"
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
          Passport details
        </>
      )}
    </Button>
  );

  const details = (r: VisaRow) => (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
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
              <tr key={`${r._id}-t-${i}`} className="border-b border-slate-100 last:border-0">
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
    </>
  );

  const contact = (r: VisaRow, compact: boolean, className?: string) => (
    <ContactActions
      compact={compact}
      className={className}
      name={r.contactName}
      phone={r.contactPhone}
      email={r.contactEmail}
      about="visa invitation request"
    />
  );

  const footer = (
    <LoadMoreFooter
      status={canMutate ? status : "LoadingFirstPage"}
      count={results.length}
      onLoadMore={() => loadMore(PAGE_SIZE)}
      noun="requests"
      emptyText={
        filter === "all"
          ? "No visa invitation requests yet."
          : filter === "pending"
            ? "No new visa requests — you're all caught up."
            : "No requests match this filter."
      }
    />
  );

  return (
    <div className="space-y-4">
      <QueryErrorBanner error={error} />
      <InboxFilterTabs options={FILTERS} value={filter} onChange={setFilter} />

      {/* Phones: stacked cards */}
      <div className="grid gap-3 md:hidden">
        {results.map((r) => {
          const isOpen = expandedId === r._id;
          return (
            <div key={r._id} className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-ink">{r.contactName}</p>
                  <p className="mt-0.5 break-words text-xs text-slate-500">{r.contactEmail}</p>
                  <p className="text-xs text-slate-500">{r.contactPhone}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {travellersLabel(r.travelers.length)} · {formatWhen(r.createdAt)}
                  </p>
                </div>
                {statusSelect(r)}
              </div>
              {r.adminNote ? (
                <p className="mt-2 truncate text-xs italic text-slate-500">Note: {r.adminNote}</p>
              ) : null}
              {contact(r, false, "mt-3")}
              <div className="mt-2">{toggle(r, isOpen)}</div>
              {isOpen ? <div className="mt-3 border-t border-slate-100 pt-3">{details(r)}</div> : null}
            </div>
          );
        })}
        <div className="rounded-xl border border-slate-200/90 bg-white">{footer}</div>
      </div>

      {/* Tablets and up: table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="whitespace-nowrap border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Travellers</th>
              <th className="px-4 py-3">Reply</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const isOpen = expandedId === r._id;
              return (
                <Fragment key={r._id}>
                  <tr className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 align-top text-slate-600">{formatWhen(r.createdAt)}</td>
                    <td className="px-4 py-3 align-top">
                      <span className="font-medium text-brand-ink">{r.contactName}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{r.contactEmail}</span>
                      <span className="block text-xs text-slate-500">{r.contactPhone}</span>
                      {r.adminNote ? (
                        <span className="mt-1 block max-w-[260px] truncate text-xs italic text-slate-500">
                          Note: {r.adminNote}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                        {r.travelers.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">{contact(r, true)}</td>
                    <td className="px-4 py-3 align-top">{statusSelect(r)}</td>
                    <td className="px-4 py-3 align-top">{toggle(r, isOpen)}</td>
                  </tr>
                  {isOpen ? (
                    <tr className="bg-slate-50/80">
                      <td colSpan={6} className="px-4 py-4">
                        {details(r)}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {footer}
      </div>
    </div>
  );
}
