"use client";

import { Button } from "@/components/ui/Button";
import { confirmDiscard } from "@/hooks/useUnsavedChangesGuard";
import type { AutosaveStatus } from "@/hooks/useAutosave";
import { SaveStatusPill } from "./EditorStatus";

/**
 * Sticky Save / Discard bar for settings-style forms (explicit save).
 * Pairs with `useServerForm` + `useUnsavedChangesGuard`.
 */
export function FormSaveBar({
  dirty,
  saving,
  savedOnce,
  error,
  onSave,
  onDiscard,
  saveLabel = "Save changes",
  disabled,
}: {
  dirty: boolean;
  saving: boolean;
  /** True after a successful save in this session (shows "All changes saved"). */
  savedOnce: boolean;
  error: string | null;
  onSave: () => void;
  onDiscard?: () => void;
  saveLabel?: string;
  disabled?: boolean;
}) {
  const status: AutosaveStatus = error
    ? "error"
    : saving
      ? "saving"
      : dirty
        ? "pending"
        : savedOnce
          ? "saved"
          : "idle";
  return (
    <div className="sticky bottom-0 z-20 -mx-1 mt-6 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-border bg-panel/95 px-4 py-3 shadow-lg backdrop-blur-xl pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <SaveStatusPill status={status} error={error} className="mr-auto" />
      {onDiscard && dirty ? (
        <Button
          type="button"
          variant="ghost"
          disabled={saving}
          onClick={() => {
            if (confirmDiscard(true, "Discard your unsaved changes?")) onDiscard();
          }}
        >
          Discard
        </Button>
      ) : null}
      <Button type="button" disabled={saving || !dirty || disabled} onClick={onSave}>
        {saving ? "Saving…" : saveLabel}
      </Button>
    </div>
  );
}
