"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldLabel, TextAreaField } from "@/components/ui/FormField";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export function AdminAiPlannerRequestsPanel() {
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const listArgs =
    filter === "all"
      ? ({} as { status?: "pending" | "approved" | "rejected" })
      : { status: filter };
  const rows = useQuery(api.customItineraries.listForAdmin, listArgs);
  const setStatus = useMutation(api.customItineraries.setRequestStatus);
  const setAdminNote = useMutation(api.customItineraries.setAdminNote);
  const setAdminDraft = useMutation(api.customItineraries.setAdminDraft);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [savingDraft, setSavingDraft] = useState<Record<string, boolean>>({});

  const sorted = useMemo(() => {
    if (!rows) return rows;
    return [...rows].sort((a, b) => b.createdAt - a.createdAt);
  }, [rows]);

  async function review(
    id: Id<"customItineraryRequests">,
    status: "approved" | "rejected",
  ) {
    const note = window.prompt(
      status === "approved"
        ? "Optional note for records (or leave blank)"
        : "Reason for rejection (optional)",
    );
    await setStatus({
      requestId: id,
      status,
      adminNote: note?.trim() || undefined,
    });
  }

  async function editNote(id: Id<"customItineraryRequests">, current?: string) {
    const note = window.prompt("Update admin note (optional)", current ?? "");
    if (note === null) return;
    await setAdminNote({
      requestId: id,
      adminNote: note.trim() || undefined,
    });
  }

  async function saveDraft(id: Id<"customItineraryRequests">) {
    const key = id as unknown as string;
    const next = (draftEdits[key] ?? "").trim();
    setSavingDraft((m) => ({ ...m, [key]: true }));
    try {
      await setAdminDraft({
        requestId: id,
        adminDraft: next || undefined,
      });
    } finally {
      setSavingDraft((m) => ({ ...m, [key]: false }));
    }
  }

  if (sorted === undefined) {
    return <p className="text-sm text-brand-muted">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", "Pending"],
            ["all", "All"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              filter === key
                ? "bg-brand-primary text-white"
                : "border border-slate-200 bg-white text-brand-ink hover:bg-brand-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-brand-muted">No requests in this view.</p>
      ) : (
        <ul className="space-y-6">
          {sorted.map((r) => {
            const key = r._id as unknown as string;
            const isOpen = expanded[key] ?? false;
            const localDraft =
              draftEdits[key] ?? (r.adminDraft ? String(r.adminDraft) : "");
            const draftSaved =
              (r.adminDraft ?? "").trim() === (localDraft ?? "").trim();
            return (
              <li key={key}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                          r.status === "pending"
                            ? "bg-amber-100 text-amber-900"
                            : r.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-800"
                        }`}
                      >
                        {r.status}
                      </span>
                      <p className="mt-2 font-semibold text-brand-ink">
                        {r.name} · {r.phone}
                      </p>
                      {r.email ? (
                        <p className="text-sm text-brand-muted">{r.email}</p>
                      ) : null}
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

                    <div className="flex flex-wrap gap-2">
                      {r.status === "pending" ? (
                        <>
                          <Button
                            type="button"
                            variant="primary"
                            className="py-2 text-sm"
                            onClick={() => void review(r._id, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="py-2 text-sm"
                            onClick={() => void review(r._id, "rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          className="py-2 text-sm"
                          onClick={() => void editNote(r._id, r.adminNote)}
                        >
                          Edit note
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        className="py-2 text-sm"
                        onClick={() =>
                          setExpanded((m) => ({ ...m, [key]: !isOpen }))
                        }
                      >
                        {isOpen ? "Hide details" : "View details"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase text-brand-muted">
                      Trip summary
                    </p>
                    <p className="mt-1 text-sm text-brand-ink">{r.summary}</p>
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

                      <div>
                        <FieldLabel htmlFor={`draft-${key}`}>
                          Draft plan (ops workspace)
                        </FieldLabel>
                        <TextAreaField
                          id={`draft-${key}`}
                          rows={10}
                          placeholder="Write the final itinerary/quote here. This is saved on the request so the team can collaborate."
                          value={localDraft}
                          onChange={(e) =>
                            setDraftEdits((m) => ({ ...m, [key]: e.target.value }))
                          }
                        />
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="primary"
                            disabled={savingDraft[key] || draftSaved}
                            onClick={() => void saveDraft(r._id)}
                          >
                            {savingDraft[key] ? "Saving…" : "Save draft"}
                          </Button>
                          {draftSaved ? (
                            <p className="text-xs font-semibold text-emerald-700">
                              Saved
                            </p>
                          ) : (
                            <p className="text-xs text-brand-muted">
                              Unsaved changes
                            </p>
                          )}
                        </div>
                      </div>

                      {r.thread?.length ? (
                        <div className="lg:col-span-2">
                          <p className="text-xs font-bold uppercase text-brand-muted">
                            Full AI Planner transcript
                          </p>
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
                        </div>
                      ) : (
                        <div className="lg:col-span-2">
                          <p className="text-xs font-bold uppercase text-brand-muted">
                            Full AI Planner transcript
                          </p>
                          <p className="mt-2 text-sm text-brand-muted">
                            No transcript was saved for this request.
                          </p>
                        </div>
                      )}

                      {r.adminNote ? (
                        <div className="lg:col-span-2">
                          <p className="text-xs font-bold uppercase text-brand-muted">
                            Admin note
                          </p>
                          <p className="mt-1 text-sm text-brand-ink">
                            {r.adminNote}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

