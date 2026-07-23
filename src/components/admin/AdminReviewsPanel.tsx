"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Star } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

function statusBadge(status: string) {
  if (status === "approved") return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "pending") return "bg-amber-100 text-amber-900 ring-amber-200";
  return "bg-rose-100 text-rose-800 ring-rose-200";
}

export function AdminReviewsPanel() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const [filter, setFilter] = useState<StatusFilter>("pending");

  const rows = useQuery(
    api.tourReviews.listForAdmin,
    canQuery
      ? { sessionToken, status: filter === "all" ? undefined : filter }
      : "skip",
  );
  const setStatus = useMutation(api.tourReviews.setReviewStatus);
  const remove = useMutation(api.tourReviews.deleteReview);
  const [msg, setMsg] = useState<string | null>(null);

  const filters = useMemo(
    () =>
      [
        { id: "pending" as const, label: "Pending" },
        { id: "approved" as const, label: "Approved" },
        { id: "rejected" as const, label: "Rejected" },
        { id: "all" as const, label: "All" },
      ] as const,
    [],
  );

  if (!canQuery) {
    return (
      <p className="text-sm text-muted">
        {sessionToken === undefined ? "Loading…" : "You need an admin session."}
      </p>
    );
  }

  async function act(fn: () => Promise<unknown>) {
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    }
  }

  return (
    <div className="space-y-4">
      {msg ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {msg}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Status
        </span>
        {filters.map((f) => (
          <Button
            key={f.id}
            type="button"
            variant={filter === f.id ? "primary" : "secondary"}
            className="!px-3 !py-1.5 !text-xs"
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {rows === undefined ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-panel p-4 text-sm text-muted">
          No reviews in this view.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r._id}
              className="rounded-2xl border border-border bg-panel p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={cn(
                            "h-4 w-4",
                            n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300",
                          )}
                          aria-hidden
                        />
                      ))}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ring-1",
                        statusBadge(r.status),
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1.5 font-semibold text-foreground">
                    {r.title ?? `${r.authorName}'s review`}
                  </p>
                  <p className="text-xs text-muted">
                    {r.authorName}
                    {r.authorEmail ? ` · ${r.authorEmail}` : ""}
                    {r.travelDate ? ` · travelled ${r.travelDate}` : ""}
                    {" · "}
                    <a href={`/tours/${r.tourSlug ?? ""}`} className="underline">
                      {r.tourTitle}
                    </a>
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{r.body}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {r.status !== "approved" ? (
                  <Button
                    type="button"
                    className="!px-3 !py-1.5 !text-xs"
                    onClick={() =>
                      void act(() =>
                        setStatus({
                          sessionToken,
                          reviewId: r._id as Id<"tourReviews">,
                          status: "approved",
                        }),
                      )
                    }
                  >
                    Approve
                  </Button>
                ) : null}
                {r.status !== "rejected" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="!px-3 !py-1.5 !text-xs"
                    onClick={() =>
                      void act(() =>
                        setStatus({
                          sessionToken,
                          reviewId: r._id as Id<"tourReviews">,
                          status: "rejected",
                        }),
                      )
                    }
                  >
                    Reject
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  className="!px-3 !py-1.5 !text-xs text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (!window.confirm("Delete this review permanently?")) return;
                    void act(() =>
                      remove({ sessionToken, reviewId: r._id as Id<"tourReviews"> }),
                    );
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
