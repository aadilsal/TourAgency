"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { TextInput } from "@/components/ui/FormField";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

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

  const rows = useQuery(
    api.itineraries.listForAdmin,
    canQuery ? { sessionToken } : "skip",
  );

  const list = useMemo(() => {
    const all = (rows ?? []) as Row[];
    const needle = q.trim().toLowerCase();
    const filtered =
      needle.length === 0
        ? all
        : all.filter((r) => {
            const hay = `${r.title}\n${r.clientName}\n${r.status}`.toLowerCase();
            return hay.includes(needle);
          });
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [rows, q]);

  if (!canQuery) {
    return (
      <p className="text-sm text-amber-800">
        {sessionToken === undefined
          ? "Loading your session…"
          : "You need an admin session to view itineraries."}
      </p>
    );
  }

  if (rows === undefined) {
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
        <ButtonLink href="/admin/itineraries/new">+ Create itinerary</ButtonLink>
      </div>

      <Card className="overflow-x-auto">
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
                <td className="px-4 py-3 text-muted">
                  {r.clientName || "—"}
                </td>
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
                <td className="px-4 py-3 text-muted tabular-nums">
                  {fmt(r.updatedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/admin/itineraries/${r._id}`}
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
                      {r.status === "final" ? "Mark draft" : "Mark final"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-panel-elevated"
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
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 ? (
          <p className="p-6 text-sm text-muted">No itineraries yet.</p>
        ) : null}
      </Card>
    </div>
  );
}

