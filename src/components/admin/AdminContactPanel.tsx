"use client";

import Link from "next/link";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { StatusSelect } from "@/components/admin/shared/StatusSelect";
import { InlineNoteEditor } from "@/components/admin/shared/InlineNoteEditor";
import { LoadMoreFooter } from "@/components/admin/shared/InboxControls";

const leadStatuses = ["new", "contacted", "converted", "closed"] as const;
const PAGE_SIZE = 25;

/**
 * Leads inbox. Public contact details (address, WhatsApp, email, map) used to
 * be edited here AND on Settings — two forms writing the same fields. They now
 * live only under Settings.
 */
export function AdminContactPanel() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const { results, status, loadMore } = usePaginatedQuery(
    api.leads.listLeadsPage,
    canQuery ? { sessionToken } : "skip",
    { initialNumItems: PAGE_SIZE },
  );
  const updateLead = useMutation(api.leads.updateLead);

  function requireToken(): string {
    if (typeof sessionToken !== "string") {
      throw new Error("Session expired — refresh and sign in again.");
    }
    return sessionToken;
  }

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-border bg-panel-elevated p-3 text-sm text-muted">
        Office address, WhatsApp, email and map are edited in{" "}
        <Link href="/admin/settings" className="font-semibold text-brand-cta underline">
          Site settings
        </Link>
        .
      </p>

      <section className="rounded-xl border border-border bg-panel shadow-sm backdrop-blur-xl">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">Leads & contact messages</h2>
          <p className="mt-1 text-sm text-muted">
            Messages from the contact page, tour customisation forms and the AI planner.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {results.map((lead) => {
            const leadId = lead._id as Id<"leads">;
            return (
              <li key={lead._id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    {lead.name}
                    <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted dark:bg-white/10">
                      {lead.source}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {lead.phone && lead.phone !== "—" ? (
                      <a href={`tel:${lead.phone}`} className="hover:underline">
                        {lead.phone}
                      </a>
                    ) : (
                      "No phone"
                    )}
                    {" · "}
                    {new Date(lead.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">
                    {lead.message?.trim() || "—"}
                  </p>
                  <InlineNoteEditor
                    className="mt-3"
                    value={lead.adminNote}
                    disabled={!canQuery}
                    hint="Internal only."
                    rows={2}
                    onSave={(note) =>
                      updateLead({ sessionToken: requireToken(), leadId, adminNote: note })
                    }
                  />
                </div>
                <div className="md:text-right">
                  <StatusSelect
                    value={lead.status ?? "new"}
                    options={leadStatuses}
                    disabled={!canQuery}
                    label={`Set follow-up status for ${lead.name}`}
                    onChange={(next) =>
                      updateLead({ sessionToken: requireToken(), leadId, status: next })
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <LoadMoreFooter
          status={canQuery ? status : "LoadingFirstPage"}
          count={results.length}
          onLoadMore={() => loadMore(PAGE_SIZE)}
          noun="leads"
          emptyText="No contact messages yet."
        />
      </section>
    </div>
  );
}
