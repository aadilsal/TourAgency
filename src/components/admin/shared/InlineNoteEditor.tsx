"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { confirmDiscard, useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { cn } from "@/lib/cn";

/**
 * View/edit a single note on an inbox record.
 *
 * - Shows the saved note; "Add note" / "Edit" opens an inline textarea.
 * - Save persists via `onSave` (empty text = clear). On failure the draft stays
 *   open with the error so nothing typed is lost.
 * - Cancel / navigating away asks before discarding unsaved text.
 * - If someone else changes the note while you're editing, you're told instead
 *   of having your draft silently replaced.
 */
export function InlineNoteEditor({
  value,
  onSave,
  label = "Admin note",
  hint,
  placeholder = "Internal notes…",
  emptyText = "No note yet.",
  disabled,
  rows = 3,
  className,
  autoOpen = false,
  saveLabel = "Save note",
  onCancel,
}: {
  value?: string | null;
  onSave: (next: string) => Promise<unknown>;
  label?: string;
  hint?: string;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
  /** Start in edit mode (used by decision flows). */
  autoOpen?: boolean;
  saveLabel?: string;
  /** Called after the editor closes via Cancel. */
  onCancel?: () => void;
}) {
  const saved = value ?? "";
  const id = useId();
  const [editing, setEditing] = useState(autoOpen);
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteChanged, setRemoteChanged] = useState(false);
  const baseRef = useRef(saved);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const dirty = editing && draft.trim() !== baseRef.current.trim();
  useUnsavedChangesGuard(dirty);

  // Keep in sync with the server while not editing; flag conflicts while editing.
  useEffect(() => {
    if (saved === baseRef.current) return;
    if (!editing || draft.trim() === baseRef.current.trim()) {
      baseRef.current = saved;
      setDraft(saved);
      setRemoteChanged(false);
    } else {
      setRemoteChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  function open() {
    baseRef.current = saved;
    setDraft(saved);
    setError(null);
    setRemoteChanged(false);
    setEditing(true);
  }

  function cancel() {
    if (!confirmDiscard(dirty)) return;
    setDraft(saved);
    baseRef.current = saved;
    setError(null);
    setRemoteChanged(false);
    setEditing(false);
    onCancel?.();
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft.trim());
      baseRef.current = draft.trim();
      setRemoteChanged(false);
      setEditing(false);
    } catch (e) {
      setError(toUserFacingErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className={cn("min-w-0", className)}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <button
            type="button"
            onClick={open}
            disabled={disabled}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-brand-cta hover:bg-black/5 disabled:opacity-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {saved ? "Edit" : "Add note"}
          </button>
        </div>
        {saved ? (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-brand-ink">{saved}</p>
        ) : (
          <p className="mt-1 text-sm text-slate-400">{emptyText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <textarea
        ref={textareaRef}
        id={id}
        rows={rows}
        value={draft}
        placeholder={placeholder}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void save();
        }}
        className="mt-1 w-full max-w-2xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sun"
      />
      {remoteChanged ? (
        <p role="status" className="mt-1 text-xs text-amber-700">
          Someone else updated this note while you were editing. Saving will replace it with your
          text.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          Not saved — {error}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="!min-h-9 !px-3 !py-1.5 !text-xs"
          disabled={saving || disabled}
          onClick={() => void save()}
        >
          {saving ? "Saving…" : saveLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="!min-h-9 !px-3 !py-1.5 !text-xs"
          disabled={saving}
          onClick={cancel}
        >
          Cancel
        </Button>
        {dirty && !saving ? <span className="text-xs text-amber-600">Unsaved changes</span> : null}
      </div>
    </div>
  );
}
