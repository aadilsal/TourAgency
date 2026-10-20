"use client";

import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { useSafePaginatedQuery } from "@/hooks/useSafePaginatedQuery";
import { QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { StatusSelect } from "@/components/admin/shared/StatusSelect";
import { InlineNoteEditor } from "@/components/admin/shared/InlineNoteEditor";
import { InboxFilterTabs, LoadMoreFooter } from "@/components/admin/shared/InboxControls";
import { ContactActions } from "@/components/admin/shared/ContactActions";
import { useInboxFilter } from "@/components/admin/shared/inboxHooks";
import { LEAD_STATUS_LABEL, labelFrom } from "@/components/admin/shared/statusLabels";
import { splitContact } from "@/components/admin/shared/contact";

const leadStatuses = ["new", "contacted", "converted", "closed"] as const;
type LeadStatus = (typeof leadStatuses)[number];
type StatusFilter = "all" | LeadStatus;
const PAGE_SIZE = 25;

const FILTERS = [
  { id: "new", label: "New" },
  { id: "all", label: "All" },
  { id: "contacted", label: "Replied" },
  { id: "converted", label: "Booked" },
  { id: "closed", label: "Not interested" },
] as const;
const FILTER_IDS = FILTERS.map((f) => f.id);

const statusLabel = labelFrom(LEAD_STATUS_LABEL);

/**
 * Leads inbox. Public contact details (address, WhatsApp, email, map) used to
 * be edited here AND on Settings — two forms writing the same fields. They now
 * live only under Settings.
 */
export function AdminContactPanel() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const [filter, setFilter] = useInboxFilter<StatusFilter>(FILTER_IDS, "new");
  const { results, status, loadMore, error } = useSafePaginatedQuery(
    api.leads.listLeadsPage,
    canQuery ? { sessionToken, ...(filter === "all" ? {} : { status: filter }) } : "skip",
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

      <QueryErrorBanner error={error} />
      <InboxFilterTabs options={FILTERS} value={filter} onChange={setFilter} />

      <section className="rounded-xl border border-border bg-panel shadow-sm backdrop-blur-xl">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="text-lg font-bold text-foreground">Leads & contact messages</h2>
          <p className="mt-1 text-sm text-muted">
            Messages from the contact page, tour customisation forms and the AI planner.
            After you reply, set the status to “Replied”.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {results.map((lead) => {
            const leadId = lead._id as Id<"leads">;
            const c = splitContact(lead.phone);
            return (
              <li key={lead._id} className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {lead.name}
                      <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted dark:bg-white/10">
                        {lead.source}
                      </span>
                    </p>
                    <div className="md:hidden">
                      <StatusSelect
                        value={lead.status ?? "new"}
                        options={leadStatuses}
                        labelFor={statusLabel}
                        disabled={!canQuery}
                        label={`Set follow-up status for ${lead.name}`}
                        onChange={(next) =>
                          updateLead({ sessionToken: requireToken(), leadId, status: next })
                        }
                      />
                    </div>
                  </div>
                  <p className="mt-0.5 break-words text-sm text-muted">
                    {c.phone ?? c.email ?? "No phone"}
                    {" · "}
                    {new Date(lead.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">
                    {lead.message?.trim() || "—"}
                  </p>
                  <ContactActions
                    className="mt-3"
                    name={lead.name}
                    phone={c.phone}
                    email={c.email}
                    about="message"
                  />
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
                <div className="hidden md:block md:text-right">
                  <StatusSelect
                    value={lead.status ?? "new"}
                    options={leadStatuses}
                    labelFor={statusLabel}
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
          emptyText={
            filter === "all"
              ? "No contact messages yet."
              : filter === "new"
                ? "No new messages — you're all caught up."
                : "No leads with this status."
          }
        />
      </section>
    </div>
  );
}
