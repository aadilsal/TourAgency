"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CheckCircle2, Download, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { TextInput } from "@/components/ui/FormField";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { cn } from "@/lib/cn";
import { PopoverMenu } from "@/components/ui/PopoverMenu";

type Row = {
  _id: Id<"itineraries">;
  title: string;
  clientName: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "draft" | "final";
  createdAt: number;
  updatedAt: number;
};

function fmt(ts: number) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(ts);
  }
}

export function AdminItinerariesTable() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const deleteItinerary = useMutation(api.itineraries.deleteItinerary);
  const markFinal = useMutation(api.itineraries.markFinal);
  const markDraft = useMutation(api.itineraries.markDraft);

  const { results, status, loadMore } = usePaginatedQuery(
    api.itineraries.listForAdmin,
    canQuery ? { sessionToken } : "skip",
    { initialNumItems: 50 },
  );

  const list = useMemo(() => {
    const all = (results ?? []) as Row[];
    const needle = q.trim().toLowerCase();
    const filtered =
      needle.length === 0
        ? all
        : all.filter((r) => {
            const hay = `${r.title}\n${r.clientName}\n${r.status}`.toLowerCase();
            return hay.includes(needle);
          });
    return filtered;
  }, [results, q]);

  if (!canQuery) {
    return (
      <p className="text-sm text-amber-800">
        {sessionToken === undefined
          ? "Loading your session…"
          : "You need an admin session to view itineraries."}
      </p>
    );
  }

  if (status === "LoadingFirstPage") {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      {msg ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {msg}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full max-w-md">
          <TextInput
            placeholder="Search title, client, status…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <ButtonLink href="/admin/itineraries/new" className="hidden md:inline-flex">
          + Create itinerary
        </ButtonLink>
      </div>

      {/* Mobile list (cards) */}
      <div className="grid gap-3 md:hidden">
        {list.length === 0 ? (
          <Card className="p-5">
            <p className="text-sm text-muted">No itineraries yet.</p>
          </Card>
        ) : (
          list.map((r) => (
            <Card key={r._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{r.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {r.clientName || "—"} · {r.startDate} → {r.endDate} · {r.days}d
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ring-1",
                    r.status === "final"
                      ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                      : "bg-amber-100 text-amber-900 ring-amber-200",
                  )}
                >
                  {r.status}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/admin/itineraries/${r._id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-panel-elevated px-3 py-2 text-sm font-semibold text-brand-cta"
                >
                  Open
                </Link>
                <PopoverMenu
                  buttonLabel="More"
                  buttonClassName="inline-flex items-center justify-center rounded-xl border border-border bg-panel-elevated px-3 py-2 text-sm font-semibold text-foreground"
                  items={[
                    {
                      label: r.status === "final" ? "Mark draft" : "Mark final",
                      onClick: () => {
                        if (!canQuery) return;
                        setMsg(null);
                        void (async () => {
                          try {
                            if (r.status === "final") {
                              await markDraft({
                                sessionToken,
                                itineraryId: r._id as Id<"itineraries">,
                              });
                            } else {
                              await markFinal({
                                sessionToken,
                                itineraryId: r._id as Id<"itineraries">,
                              });
                            }
                          } catch (e) {
                            setMsg(toUserFacingErrorMessage(e));
                          }
                        })();
                      },
                    },
                    {
                      label: "Download PDF",
                      onClick: () => {
                        window.open(`/admin/itineraries/${r._id}/download`, "_blank");
                      },
                    },
                    {
                      label: "Delete",
                      tone: "danger",
                      onClick: () => {
                        if (!canQuery) return;
                        const ok = window.confirm(
                          `Delete itinerary "${r.title}" for ${r.clientName || "—"}? This cannot be undone.`,
                        );
                        if (!ok) return;
                        setMsg(null);
                        void (async () => {
                          try {
                            await deleteItinerary({
                              sessionToken,
                              itineraryId: r._id as Id<"itineraries">,
                            });
                          } catch (e) {
                            setMsg(toUserFacingErrorMessage(e));
                          }
                        })();
                      },
                    },
                  ]}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted">Updated {fmt(r.updatedAt)}</p>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden overflow-x-auto md:block">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className="border-b border-border bg-black/5 text-xs font-semibold uppercase tracking-wide text-muted dark:bg-white/5">
            <tr>
              <th className="px-4 py-3 text-center">Title</th>
              <th className="px-4 py-3 text-center">Client</th>
              <th className="px-4 py-3 text-center">Days</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold text-foreground">
                  {r.title}
                  <div className="mt-0.5 text-xs text-muted">
                    {r.startDate} → {r.endDate}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{r.clientName || "—"}</td>
                <td className="px-4 py-3 text-muted tabular-nums">{r.days}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ring-1 ${
                      r.status === "final"
                        ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                        : "bg-amber-100 text-amber-900 ring-amber-200"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted tabular-nums">{fmt(r.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/admin/itineraries/${r._id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-panel p-2 text-brand-cta hover:bg-panel-elevated"
                      aria-label="Edit"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Link>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-panel p-2 text-foreground hover:bg-panel-elevated"
                      aria-label="Download PDF"
                      title="Download PDF"
                      onClick={() =>
                        window.open(`/admin/itineraries/${r._id}/download`, "_blank")
                      }
                    >
                      <Download className="h-4 w-4" aria-hidden />
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-panel p-2 text-foreground hover:bg-panel-elevated"
                      aria-label={r.status === "final" ? "Mark draft" : "Mark final"}
                      title={r.status === "final" ? "Mark draft" : "Mark final"}
                      onClick={() => {
                        if (!canQuery) return;
                        setMsg(null);
                        void (async () => {
                          try {
                            if (r.status === "final") {
                              await markDraft({
                                sessionToken,
                                itineraryId: r._id as Id<"itineraries">,
                              });
                            } else {
                              await markFinal({
                                sessionToken,
                                itineraryId: r._id as Id<"itineraries">,
                              });
                            }
                          } catch (e) {
                            setMsg(toUserFacingErrorMessage(e));
                          }
                        })();
                      }}
                    >
                      {r.status === "final" ? (
                        <RotateCcw className="h-4 w-4" aria-hidden />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                      )}
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-panel p-2 text-red-500 hover:bg-panel-elevated"
                      aria-label="Delete"
                      title="Delete"
                      onClick={() => {
                        if (!canQuery) return;
                        const ok = window.confirm(
                          `Delete itinerary "${r.title}" for ${r.clientName || "—"}? This cannot be undone.`,
                        );
                        if (!ok) return;
                        setMsg(null);
                        void (async () => {
                          try {
                            await deleteItinerary({
                              sessionToken,
                              itineraryId: r._id as Id<"itineraries">,
                            });
                          } catch (e) {
                            setMsg(toUserFacingErrorMessage(e));
                          }
                        })();
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 ? <p className="p-6 text-sm text-muted">No itineraries yet.</p> : null}
      </Card>

      <div className="flex justify-center">
        <button
          type="button"
          className="rounded-xl border border-border bg-panel px-4 py-2 text-sm font-semibold text-foreground hover:bg-panel-elevated disabled:opacity-50"
          disabled={status !== "CanLoadMore"}
          onClick={() => loadMore(50)}
        >
          {status === "LoadingMore" ? "Loading…" : status === "CanLoadMore" ? "Load more" : "No more"}
        </button>
      </div>

      {/* Mobile sticky create */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:hidden">
        <ButtonLink href="/admin/itineraries/new" className="w-full justify-center">
          + Create itinerary
        </ButtonLink>
      </div>
    </div>
  );
}

