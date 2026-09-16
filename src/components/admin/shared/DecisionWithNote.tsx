"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { InlineNoteEditor } from "./InlineNoteEditor";

export type Decision<S extends string> = {
  status: S;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  /** Label on the confirm button, e.g. "Confirm approval". */
  confirmLabel?: string;
  noteLabel?: string;
};

/**
 * Approve / reject style decisions that optionally carry a note.
 * Replaces `window.prompt` (where pressing Cancel still applied the decision).
 * Clicking a decision opens an inline note editor pre-filled with the current
 * note; nothing is saved until Confirm, and Cancel really cancels.
 */
export function DecisionWithNote<S extends string>({
  decisions,
  currentNote,
  onDecide,
  disabled,
  hint,
}: {
  decisions: readonly Decision<S>[];
  currentNote?: string | null;
  /** Persist status + note ("" = clear). Throw to keep the editor open. */
  onDecide: (status: S, note: string) => Promise<unknown>;
  disabled?: boolean;
  hint?: string;
}) {
  const [active, setActive] = useState<Decision<S> | null>(null);

  if (active) {
    return (
      <InlineNoteEditor
        key={active.status}
        autoOpen
        value={currentNote}
        label={active.noteLabel ?? `${active.label} — note (optional)`}
        hint={hint}
        saveLabel={active.confirmLabel ?? active.label}
        onSave={async (note) => {
          await onDecide(active.status, note);
          setActive(null);
        }}
        onCancel={() => setActive(null)}
        className="w-full"
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {decisions.map((d) => (
        <Button
          key={d.status}
          type="button"
          variant={d.variant ?? "secondary"}
          className="!min-h-10 !py-2 !text-sm"
          disabled={disabled}
          onClick={() => setActive(d)}
        >
          {d.label}
        </Button>
      ))}
    </div>
  );
}
