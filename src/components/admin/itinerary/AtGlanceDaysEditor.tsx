"use client";

import { FieldLabel, TextAreaField, TextInput } from "@/components/ui/FormField";
import type { AtGlanceDay } from "@/components/admin/itinerary/itineraryModel";

/** Controlled editor for the "itinerary at a glance" day rows. */
export function AtGlanceDaysEditor({
  days,
  onChange,
}: {
  days: AtGlanceDay[];
  onChange: (updater: (prev: AtGlanceDay[]) => AtGlanceDay[]) => void;
}) {
  const update = (idx: number, patch: Partial<AtGlanceDay>) =>
    onChange((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  return (
    <div className="mt-3 space-y-4">
      {days.map((d, idx) => (
        <div key={d.dayNumber} className="rounded-xl border border-border bg-panel p-3">
          <p className="text-xs font-bold text-muted">Day {d.dayNumber}</p>
          <div className="mt-2">
            <FieldLabel>Title</FieldLabel>
            <TextInput value={d.title} onChange={(e) => update(idx, { title: e.target.value })} />
          </div>
          <div className="mt-2">
            <FieldLabel>Details</FieldLabel>
            <TextAreaField
              rows={3}
              value={d.detail}
              onChange={(e) => update(idx, { detail: e.target.value })}
            />
          </div>
          <div className="mt-2">
            <FieldLabel>Overnight (optional)</FieldLabel>
            <TextInput
              value={d.overnight ?? ""}
              onChange={(e) => update(idx, { overnight: e.target.value || undefined })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
