"use client";

import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";

type StatusFilter = "all" | "pending" | "processed" | "rejected";
type VisaStatus = "pending" | "processed" | "rejected";

const statuses: VisaStatus[] = ["pending", "processed", "rejected"];

function formatWhen(ts: number) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(ts);
  }
}

function maskPassport(passport: string): string {
  const p = passport.trim();
  if (p.length <= 4) return "****";
  return `${p.slice(0, 2)}${"*".repeat(Math.max(2, p.length - 4))}${p.slice(-2)}`;
}

function formatSex(sex: string) {
  if (sex === "male") return "Male";
  if (sex === "female") return "Female";
  return "Other";
}

function statusBadgeClass(status: string) {
  if (status === "processed")
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "pending")
    return "bg-amber-100 text-amber-900 ring-amber-200";
  if (status === "rejected")
    return "bg-rose-100 text-rose-800 ring-rose-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function AdminVisaInvitationsPanel() {
  const sessionToken = useConvexSessionToken();
  const canMutate = typeof sessionToken === "string";
  const rows = useQuery(api.visaInvitations.listForAdmin, {});
  const setStatus = useMutation(api.visaInvitations.setStatus);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  async function saveRow(
    requestId: Id<"visaInvitationRequests">,
    status: VisaStatus,
  ) {
    if (!canMutate) return;
    setMsg(null);
    setSavingId(requestId);
    try {
      await setStatus({
        requestId,
        status,
        adminNote: notes[requestId]?.trim() || undefined,
        sessionToken,
      });
      setMsg("Request updated.");
    } catch (error) {
      setMsg(toUserFacingErrorMessage(error));
    } finally {
      setSavingId(null);
    }
  }

  if (rows === undefined) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      {msg ? (
        <p className="text-sm text-muted" role="status">
          {msg}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
        </span>
        {(
          [
            { id: "all" as const, label: "All" },
            { id: "pending" as const, label: "Pending" },
            { id: "processed" as const, label: "Processed" },
            { id: "rejected" as const, label: "Rejected" },
          ] as const
        ).map((f) => (
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
        <span className="ml-auto text-sm text-slate-500">
          {filtered.length} of {rows.length} shown
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Travelers</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const isOpen = expandedId === r._id;
              return (
                <Fragment key={r._id}>
                  <tr
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {formatWhen(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-brand-ink">
                        {r.contactName}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {r.contactEmail}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {r.contactPhone}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                        {r.travelers.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={cn(
                          "max-w-[140px] cursor-pointer appearance-none rounded-full border-0 bg-[length:0.75rem] bg-[right_0.65rem_center] bg-no-repeat py-2 pl-3 pr-7 text-xs font-bold capitalize shadow-sm ring-2 ring-inset focus:outline-none",
                          statusBadgeClass(r.status),
                        )}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23334155'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                        }}
                        value={r.status}
                        disabled={!canMutate || savingId === r._id}
                        aria-label={`Set status for ${r.contactName}`}
                        onChange={(e) => {
                          void saveRow(
                            r._id,
                            e.target.value as VisaStatus,
                          );
                        }}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s} className="bg-white">
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        className="!min-h-9 !px-2 !py-1.5 !text-xs"
                        onClick={() =>
                          setExpandedId(isOpen ? null : r._id)
                        }
                      >
                        {isOpen ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Details
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr key={`${r._id}-detail`} className="bg-slate-50/80">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-[640px] w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500">
                                <th className="py-2 pr-3">Name</th>
                                <th className="py-2 pr-3">Sex</th>
                                <th className="py-2 pr-3">Nationality</th>
                                <th className="py-2 pr-3">DOB</th>
                                <th className="py-2 pr-3">Passport</th>
                                <th className="py-2 pr-3">Issue</th>
                                <th className="py-2 pr-3">Expiry</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.travelers.map((t, i) => (
                                <tr
                                  key={`${r._id}-t-${i}`}
                                  className="border-b border-slate-100 last:border-0"
                                >
                                  <td className="py-2 pr-3 font-medium text-slate-900">
                                    {t.name}
                                  </td>
                                  <td className="py-2 pr-3">{formatSex(t.sex)}</td>
                                  <td className="py-2 pr-3">{t.nationalityLabel}</td>
                                  <td className="py-2 pr-3">{t.dateOfBirth}</td>
                                  <td className="py-2 pr-3 font-mono">
                                    {t.passportNumber}
                                  </td>
                                  <td className="py-2 pr-3">
                                    {t.passportIssueDate}
                                  </td>
                                  <td className="py-2 pr-3">
                                    {t.passportExpiryDate}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          List preview passports:{" "}
                          {r.travelers
                            .map((t) => maskPassport(t.passportNumber))
                            .join(", ")}
                        </p>
                        <label className="mt-4 block text-xs font-semibold text-slate-600">
                          Admin note
                          <textarea
                            rows={2}
                            className="mt-1 w-full max-w-xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                            value={notes[r._id] ?? r.adminNote ?? ""}
                            onChange={(e) =>
                              setNotes((prev) => ({
                                ...prev,
                                [r._id]: e.target.value,
                              }))
                            }
                            placeholder="Internal notes…"
                          />
                        </label>
                        <div className="mt-3">
                          <Button
                            type="button"
                            variant="secondary"
                            className="!text-xs"
                            disabled={!canMutate || savingId === r._id}
                            onClick={() => void saveRow(r._id, r.status)}
                          >
                            Save note
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            No visa invitation requests yet.
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            No requests match this filter.
          </p>
        ) : null}
      </div>
    </div>
  );
}
