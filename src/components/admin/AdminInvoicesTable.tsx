"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { TextInput } from "@/components/ui/FormField";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { cn } from "@/lib/cn";
import { PopoverMenu } from "@/components/ui/PopoverMenu";

type Row = {
  _id: Id<"invoices">;
  clientName: string;
  itineraryId?: Id<"itineraries">;
  invoiceDate: string;
  currency: "PKR" | "USD";
  status: "draft" | "paid";
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

export function AdminInvoicesTable() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const deleteInvoice = useMutation(api.invoices.deleteInvoice);
  const markPaid = useMutation(api.invoices.markPaid);
  const markDraft = useMutation(api.invoices.markDraft);

  const { results, status, loadMore } = usePaginatedQuery(
    api.invoices.listForAdmin,
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
            const hay = `${r.clientName}\n${r.currency}\n${r.status}\n${r.invoiceDate}`.toLowerCase();
            return hay.includes(needle);
          });
    return filtered;
  }, [results, q]);

  if (!canQuery) {
    return (
      <p className="text-sm text-amber-800">
        {sessionToken === undefined
          ? "Loading your session…"
          : "You need an admin session to view invoices."}
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
            placeholder="Search client, status, date…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <ButtonLink href="/admin/invoices/new" className="hidden md:inline-flex">
          + Create invoice
        </ButtonLink>
      </div>

      {/* Mobile list (cards) */}
      <div className="grid gap-3 md:hidden">
        {list.length === 0 ? (
          <Card className="p-5">
            <p className="text-sm text-muted">No invoices yet.</p>
          </Card>
        ) : (
          list.map((r) => (
            <Card key={r._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {r.clientName || "—"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {r.invoiceDate} · {r.currency}
                    {r.itineraryId ? " · Linked itinerary" : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ring-1",
                    r.status === "paid"
                      ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                      : "bg-amber-100 text-amber-900 ring-amber-200",
                  )}
                >
                  {r.status}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/admin/invoices/${r._id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-panel-elevated px-3 py-2 text-sm font-semibold text-brand-cta"
                >
                  Open
                </Link>
                <PopoverMenu
                  buttonLabel="More"
                  buttonClassName="inline-flex items-center justify-center rounded-xl border border-border bg-panel-elevated px-3 py-2 text-sm font-semibold text-foreground"
                  items={[
                    {
                      label: r.status === "paid" ? "Mark draft" : "Mark paid",
                      onClick: () => {
                        if (!canQuery) return;
                        setMsg(null);
                        void (async () => {
                          try {
                            if (r.status === "paid") {
                              await markDraft({
                                sessionToken,
                                invoiceId: r._id as Id<"invoices">,
                              });
                            } else {
                              await markPaid({
                                sessionToken,
                                invoiceId: r._id as Id<"invoices">,
                              });
                            }
                          } catch (e) {
                            setMsg(toUserFacingErrorMessage(e));
                          }
                        })();
                      },
                    },
                    {
                      label: "Delete",
                      tone: "danger",
                      onClick: () => {
                        if (!canQuery) return;
                        const ok = window.confirm(
                          `Delete invoice for ${r.clientName || "—"} (${r.invoiceDate})? This cannot be undone.`,
                        );
                        if (!ok) return;
                        setMsg(null);
                        void (async () => {
                          try {
                            await deleteInvoice({
                              sessionToken,
                              invoiceId: r._id as Id<"invoices">,
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
              <th className="px-4 py-3 text-center">Client</th>
              <th className="px-4 py-3 text-center">Date</th>
              <th className="px-4 py-3 text-center">Currency</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold text-foreground">
                  {r.clientName || "—"}
                  {r.itineraryId ? (
                    <div className="mt-0.5 text-xs text-muted">Linked itinerary</div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted">{r.invoiceDate}</td>
                <td className="px-4 py-3 text-muted">{r.currency}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ring-1 ${
                      r.status === "paid"
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
                      href={`/admin/invoices/${r._id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1 text-xs font-semibold text-brand-cta hover:bg-panel-elevated"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-panel-elevated"
                      onClick={() => {
                        if (!canQuery) return;
                        setMsg(null);
                        void (async () => {
                          try {
                            if (r.status === "paid") {
                              await markDraft({
                                sessionToken,
                                invoiceId: r._id as Id<"invoices">,
                              });
                            } else {
                              await markPaid({
                                sessionToken,
                                invoiceId: r._id as Id<"invoices">,
                              });
                            }
                          } catch (e) {
                            setMsg(toUserFacingErrorMessage(e));
                          }
                        })();
                      }}
                    >
                      {r.status === "paid" ? "Mark draft" : "Mark paid"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-panel-elevated"
                      onClick={() => {
                        if (!canQuery) return;
                        const ok = window.confirm(
                          `Delete invoice for ${r.clientName || "—"} (${r.invoiceDate})? This cannot be undone.`,
                        );
                        if (!ok) return;
                        setMsg(null);
                        void (async () => {
                          try {
                            await deleteInvoice({
                              sessionToken,
                              invoiceId: r._id as Id<"invoices">,
                            });
                          } catch (e) {
                            setMsg(toUserFacingErrorMessage(e));
                          }
                        })();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 ? <p className="p-6 text-sm text-muted">No invoices yet.</p> : null}
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
        <ButtonLink href="/admin/invoices/new" className="w-full justify-center">
          + Create invoice
        </ButtonLink>
      </div>
    </div>
  );
}

