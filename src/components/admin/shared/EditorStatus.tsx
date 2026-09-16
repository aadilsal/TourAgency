"use client";

import { AlertTriangle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import type { AutosaveStatus } from "@/hooks/useAutosave";
import { isAuthError } from "@/hooks/useSafeQuery";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { cn } from "@/lib/cn";

/** Compact "Saving… / All changes saved / Unsaved changes / Not saved" indicator. */
export function SaveStatusPill({
  status,
  dirty,
  error,
  className,
}: {
  status?: AutosaveStatus;
  dirty?: boolean;
  error?: string | null;
  className?: string;
}) {
  let tone = "text-slate-500";
  let icon: React.ReactNode = null;
  let label = "";
  if (status === "error" || error) {
    tone = "text-red-600";
    icon = <AlertTriangle className="h-3.5 w-3.5" aria-hidden />;
    label = error ? `Not saved — ${error}` : "Not saved";
  } else if (status === "saving") {
    icon = <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />;
    label = "Saving…";
  } else if (status === "pending" || dirty) {
    tone = "text-amber-600";
    label = "Unsaved changes";
  } else if (status === "saved") {
    tone = "text-emerald-600";
    icon = <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />;
    label = "All changes saved";
  }
  if (!label) return null;
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium", tone, className)}
    >
      {icon}
      {label}
    </span>
  );
}

/** Offers back a local draft backup (see useLocalDraft). */
export function DraftRestoreBanner({
  savedAt,
  onRestore,
  onDiscard,
}: {
  savedAt: number;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      role="status"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-center gap-2">
        <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
        <span>
          We found unsaved changes from <strong>{new Date(savedAt).toLocaleString()}</strong>.
          Restore them?
        </span>
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onRestore}
          className="min-h-10 rounded-lg bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-700"
        >
          Restore
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="min-h-10 rounded-lg border border-sky-300 bg-white px-3 py-1.5 font-semibold text-sky-800 hover:bg-sky-100"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

/** Non-destructive banner for a failing query: the form stays mounted. */
export function QueryErrorBanner({ error }: { error: Error | null }) {
  if (!error) return null;
  const auth = isAuthError(error);
  return (
    <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      {auth ? (
        <>
          <strong>Your session has ended.</strong> Your edits are still here and backed up on this
          device. Sign in again in a new tab, then press Save.
        </>
      ) : (
        <>
          <strong>Connection problem.</strong> {toUserFacingErrorMessage(error)} Your edits are
          still here — keep this page open.
        </>
      )}
    </div>
  );
}
