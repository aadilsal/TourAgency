"use client";

import { useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Eye, Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AdminRoleBadge } from "@/components/admin/AdminRoleBadge";
import { InboxFilterTabs, LoadMoreFooter } from "@/components/admin/shared/InboxControls";
import { QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { useSafePaginatedQuery } from "@/hooks/useSafePaginatedQuery";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type UserRow = {
  _id: Id<"users">;
  name: string;
  email: string;
  phone?: string;
  role: string;
  emailVerified?: boolean;
  createdAt: number;
};

type RoleFilter = "all" | "customer" | "admin" | "super_admin";

const ROLE_FILTERS = [
  { id: "all", label: "All" },
  { id: "customer", label: "Customers" },
  { id: "admin", label: "Admins" },
  { id: "super_admin", label: "Super admins" },
] as const;

const PAGE_SIZE = 50;

export function AdminUsersTable() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const [role, setRole] = useState<RoleFilter>("all");
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue(term.trim(), 300);
  const searching = debouncedTerm.length > 0;

  const list = useSafePaginatedQuery(
    api.admin.listUsersPage,
    canQuery && !searching
      ? { sessionToken, ...(role === "all" ? {} : { role }) }
      : "skip",
    { initialNumItems: PAGE_SIZE },
  );
  const search = useSafeQuery(
    api.admin.searchUsers,
    canQuery && searching ? { sessionToken, term: debouncedTerm } : "skip",
  );

  const [detail, setDetail] = useState<UserRow | null>(null);

  const rows: UserRow[] = searching
    ? ((search.data ?? []) as UserRow[]).filter((u) => role === "all" || u.role === role)
    : (list.results as UserRow[]);

  return (
    <div className="space-y-4">
      <QueryErrorBanner error={list.error ?? search.error} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InboxFilterTabs label="Role" options={ROLE_FILTERS} value={role} onChange={setRole} />
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Search users by name or email</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search name or exact email"
            className="min-h-11 w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-panel shadow-sm backdrop-blur-xl">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="whitespace-nowrap border-b border-border bg-black/5 text-xs font-semibold uppercase tracking-wide text-muted dark:bg-white/5">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <AdminRoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1 text-xs font-semibold text-brand-cta hover:bg-panel-elevated"
                    onClick={() => setDetail(u)}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {searching ? (
          search.isLoading ? (
            <p className="p-4 text-sm text-slate-500">Searching…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No users match “{debouncedTerm}”.</p>
          ) : null
        ) : (
          <LoadMoreFooter
            status={list.status}
            onLoadMore={() => list.loadMore(PAGE_SIZE)}
            count={rows.length}
            emptyText="No users yet."
            noun="users"
          />
        )}
      </div>

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.name ?? "User"}
        description={detail?.email}
        panelClassName="max-w-md"
      >
        {detail ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Role</dt>
              <dd className="mt-1">
                <AdminRoleBadge role={detail.role} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Phone</dt>
              <dd className="mt-1 text-foreground">{detail.phone?.trim() ? detail.phone : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email verified</dt>
              <dd className="mt-1 text-foreground">
                {detail.emailVerified === true ? "Yes" : detail.emailVerified === false ? "No" : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Joined</dt>
              <dd className="mt-1 text-foreground">
                {new Date(detail.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
            <Button type="button" variant="secondary" onClick={() => setDetail(null)}>
              Close
            </Button>
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
