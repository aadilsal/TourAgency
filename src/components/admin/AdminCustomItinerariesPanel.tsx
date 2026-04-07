"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Id } from "@convex/_generated/dataModel";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export function AdminCustomItinerariesPanel() {
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const listArgs =
    filter === "all"
      ? ({} as { status?: "pending" | "approved" | "rejected" })
      : { status: filter };
  const rows = useQuery(api.customItineraries.listForAdmin, listArgs);
  const setStatus = useMutation(api.customItineraries.setRequestStatus);

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

  if (rows === undefined) {
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

      {rows.length === 0 ? (
        <p className="text-sm text-brand-muted">No requests in this view.</p>
      ) : (
        <ul className="space-y-6">
          {rows.map((r) => (
            <li key={r._id}>
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
                  {r.status === "pending" ? (
                    <div className="flex flex-wrap gap-2">
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
                    </div>
                  ) : null}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase text-brand-muted">
                    Chat summary
                  </p>
                  <p className="mt-1 text-sm text-brand-ink">{r.summary}</p>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase text-brand-muted">
                    Proposed itinerary
                  </p>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-brand-surface p-3 text-xs text-brand-ink">
                    {r.proposal}
                  </pre>
                </div>
                {r.adminNote ? (
                  <p className="mt-3 text-sm text-brand-muted">
                    <span className="font-semibold">Admin note:</span>{" "}
                    {r.adminNote}
                  </p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
