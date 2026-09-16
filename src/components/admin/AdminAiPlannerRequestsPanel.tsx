"use client";

import { useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { StatusBadge } from "@/components/admin/shared/StatusSelect";
import { InlineNoteEditor } from "@/components/admin/shared/InlineNoteEditor";
import { DecisionWithNote, type Decision } from "@/components/admin/shared/DecisionWithNote";
import { InboxFilterTabs, LoadMoreFooter } from "@/components/admin/shared/InboxControls";

type StatusFilter = "all" | "pending" | "approved" | "rejected";
type ReviewStatus = "approved" | "rejected";

const PAGE_SIZE = 20;

const FILTERS = [
  { id: "pending", label: "Pending" },
  { id: "all", label: "All" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

const DECISIONS: readonly Decision<ReviewStatus>[] = [
  {
    status: "approved",
    label: "Approve",
    variant: "primary",
    confirmLabel: "Confirm approval",
    noteLabel: "Note to client (optional)",
  },
  {
    status: "rejected",
    label: "Reject",
    variant: "secondary",
    confirmLabel: "Confirm rejection",
    noteLabel: "Reason / note to client (optional)",
  },
];

const CLIENT_NOTE_HINT =
  "Emailed to the client with the decision. Leave unchanged to keep the current note.";

/**
 * Trip requests inbox (AI planner / custom itinerary requests).
 * The single screen for the `customItineraryRequests` table — both
 * /admin/custom-itineraries and the legacy /admin/ai-planner route render it.
 */
export function AdminAiPlannerRequestsPanel() {
  const sessionToken = useConvexSessionToken();
  const canMutate = typeof sessionToken === "string";
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const { results, status, loadMore } = usePaginatedQuery(
    api.customItineraries.listForAdminPage,
    canMutate
      ? { sessionToken, ...(filter === "all" ? {} : { status: filter }) }
      : "skip",
    { initialNumItems: PAGE_SIZE },
  );
  const setStatus = useMutation(api.customItineraries.setRequestStatus);
  const setAdminNote = useMutation(api.customItineraries.setAdminNote);
  const setAdminDraft = useMutation(api.customItineraries.setAdminDraft);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function requireToken(): string {
    if (typeof sessionToken !== "string") {
      throw new Error("Session expired — refresh and sign in again.");
    }
    return sessionToken;
  }

  return (
    <div className="space-y-6">
      <InboxFilterTabs options={FILTERS} value={filter} onChange={setFilter} />

      {results.length > 0 ? (
        <ul className="space-y-6">
          {results.map((r) => {
            const id = r._id as Id<"customItineraryRequests">;
            const key = r._id as string;
            const isOpen = expanded[key] ?? false;
            const remainingDecisions = DECISIONS.filter((d) => d.status !== r.status);
            return (
              <li key={key}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <StatusBadge status={r.status} />
                      <p className="mt-2 font-semibold text-brand-ink">
                        {r.name} · {r.phone}
                      </p>
                      {r.email ? <p className="text-sm text-brand-muted">{r.email}</p> : null}
                      {(r.preferredStart ||
                        r.preferredEnd ||
                        r.adults != null ||
                        r.children != null) && (
                        <p className="mt-2 text-xs text-brand-muted">
                          {r.preferredStart || r.preferredEnd
                            ? `${r.preferredStart ?? "?"} → ${r.preferredEnd ?? "?"}`
                            : null}
                          {r.adults != null || r.children != null
                            ? ` · Adults ${r.adults ?? "—"}, children ${r.children ?? "—"}`
                            : null}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-brand-muted">
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      className="!min-h-10 !py-2 !text-sm"
                      aria-expanded={isOpen}
                      onClick={() => setExpanded((m) => ({ ...m, [key]: !isOpen }))}
                    >
                      {isOpen ? "Hide details" : "View details"}
                    </Button>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase text-brand-muted">Trip summary</p>
                    <p className="mt-1 text-sm text-brand-ink">{r.summary}</p>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="mb-2 text-xs font-bold uppercase text-brand-muted">
                      {r.status === "pending" ? "Decision" : "Change decision"}
                    </p>
                    <DecisionWithNote
                      decisions={r.status === "pending" ? DECISIONS : remainingDecisions}
                      currentNote={r.adminNote}
                      disabled={!canMutate}
                      hint={CLIENT_NOTE_HINT}
                      onDecide={(next, note) =>
                        setStatus({
                          sessionToken: requireToken(),
                          requestId: id,
                          status: next,
                          adminNote: note,
                        })
                      }
                    />
                    <InlineNoteEditor
                      className="mt-4"
                      value={r.adminNote}
                      disabled={!canMutate}
                      label="Note"
                      hint={
                        r.status === "pending"
                          ? "Saved on the request. It's emailed to the client when you approve or reject."
                          : "Saving a changed note emails the client an update."
                      }
                      onSave={(note) =>
                        setAdminNote({
                          sessionToken: requireToken(),
                          requestId: id,
                          adminNote: note,
                        })
                      }
                    />
                  </div>

                  {isOpen ? (
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase text-brand-muted">
                          AI output (saved)
                        </p>
                        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-brand-surface p-3 text-xs text-brand-ink">
                          {r.proposal}
                        </pre>
                      </div>

                      <InlineNoteEditor
                        value={r.adminDraft}
                        disabled={!canMutate}
                        rows={10}
                        label="Draft plan (ops workspace)"
                        hint="Internal — saved on the request so the team can collaborate."
                        placeholder="Write the final itinerary/quote here."
                        emptyText="No draft yet."
                        saveLabel="Save draft"
                        onSave={(draft) =>
                          setAdminDraft({
                            sessionToken: requireToken(),
                            requestId: id,
                            adminDraft: draft,
                          })
                        }
                      />

                      <div className="lg:col-span-2">
                        <p className="text-xs font-bold uppercase text-brand-muted">
                          Full AI Planner transcript
                        </p>
                        {r.thread?.length ? (
                          <div className="mt-2 max-h-[520px] overflow-auto rounded-lg border border-slate-200 bg-white">
                            <ul className="divide-y divide-slate-100">
                              {r.thread.map((m, idx) => (
                                <li key={idx} className="p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">
                                    {m.role}
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-brand-ink">
                                    {m.content}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-brand-muted">
                            No transcript was saved for this request.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}

      <LoadMoreFooter
        status={canMutate ? status : "LoadingFirstPage"}
        count={results.length}
        onLoadMore={() => loadMore(PAGE_SIZE)}
        noun="requests"
        emptyText="No requests in this view."
      />
    </div>
  );
}

/** Alias: the custom-itineraries screen is the same consolidated inbox. */
export const AdminTripRequestsPanel = AdminAiPlannerRequestsPanel;
