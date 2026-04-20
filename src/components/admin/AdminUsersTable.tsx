"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Eye } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AdminRoleBadge } from "@/components/admin/AdminRoleBadge";

type UserRow = {
  _id: Id<"users">;
  name: string;
  email: string;
  phone?: string;
  role: string;
  emailVerified?: boolean;
  createdAt: number;
};

export function AdminUsersTable() {
  const users = useQuery(api.admin.getUsers, {});
  const [detail, setDetail] = useState<UserRow | null>(null);

  if (users === undefined) {
    return <p className="text-sm text-brand-muted">Loading…</p>;
  }

  const list = users as UserRow[];

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border bg-panel shadow-sm backdrop-blur-xl">
        <table className="min-w-[560px] w-full text-left text-sm">
          <thead className="border-b border-border bg-black/5 text-xs font-semibold uppercase tracking-wide text-muted dark:bg-white/5">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr
                key={u._id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {u.name}
                </td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <AdminRoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1 text-xs font-semibold text-brand-cta hover:bg-panel-elevated"
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
        {list.length === 0 ? (
          <p className="p-6 text-sm text-muted">No users yet.</p>
        ) : null}
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
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Role
              </dt>
              <dd className="mt-1">
                <AdminRoleBadge role={detail.role} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Phone
              </dt>
              <dd className="mt-1 text-foreground">
                {detail.phone?.trim() ? detail.phone : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Email verified
              </dt>
              <dd className="mt-1 text-foreground">
                {detail.emailVerified === true
                  ? "Yes"
                  : detail.emailVerified === false
                    ? "No"
                    : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Joined
              </dt>
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
