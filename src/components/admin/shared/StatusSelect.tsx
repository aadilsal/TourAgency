"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

/** Default colour per status word, shared by every admin inbox. */
export function statusToneClass(status: string): string {
  switch (status) {
    case "confirmed":
    case "processed":
    case "approved":
    case "converted":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    case "pending":
    case "new":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "contacted":
      return "bg-sky-100 text-sky-900 ring-sky-200";
    case "cancelled":
    case "rejected":
      return "bg-rose-100 text-rose-800 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

/** Read-only status pill using the same tones as StatusSelect. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ring-1",
        statusToneClass(status),
        className,
      )}
    >
      {status}
    </span>
  );
}

const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23334155'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`;

/**
 * Status dropdown for inbox rows. Shows the new value immediately, disables
 * itself while saving, and reverts + shows the error if the save fails — so a
 * failed change can never look like it succeeded.
 */
export function StatusSelect<S extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
  labelFor,
  className,
}: {
  value: S;
  options: readonly S[];
  /** Persist the change. Throw to signal failure. */
  onChange: (next: S) => Promise<unknown>;
  /** Accessible label, e.g. "Set status for Ali". */
  label: string;
  disabled?: boolean;
  labelFor?: (s: S) => string;
  className?: string;
}) {
  const [optimistic, setOptimistic] = useState<S | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server caught up (or changed elsewhere): drop the optimistic value.
  useEffect(() => {
    setOptimistic(null);
  }, [value]);

  const shown = optimistic ?? value;

  async function handle(next: S) {
    if (next === shown) return;
    setError(null);
    setOptimistic(next);
    setSaving(true);
    try {
      await onChange(next);
    } catch (e) {
      setOptimistic(null);
      setError(toUserFacingErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      <div className="relative inline-flex items-center">
        <select
          className={cn(
            "min-h-9 max-w-[180px] cursor-pointer appearance-none rounded-full border-0 bg-[length:0.75rem] bg-[right_0.65rem_center] bg-no-repeat py-2 pl-3 pr-7 text-xs font-bold capitalize shadow-sm ring-2 ring-inset focus:outline-none focus:ring-brand-primary/35 disabled:cursor-not-allowed disabled:opacity-70",
            statusToneClass(shown),
          )}
          style={{ backgroundImage: CHEVRON }}
          value={shown}
          disabled={disabled || saving}
          aria-label={label}
          aria-busy={saving}
          onChange={(e) => void handle(e.target.value as S)}
        >
          {options.map((s) => (
            <option key={s} value={s} className="bg-white text-slate-900">
              {labelFor ? labelFor(s) : s}
            </option>
          ))}
        </select>
        {saving ? (
          <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin text-slate-400" aria-hidden />
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="max-w-[220px] text-xs font-medium text-red-600">
          Not saved — {error}
        </p>
      ) : null}
    </div>
  );
}
