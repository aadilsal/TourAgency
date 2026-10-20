"use client";

import { useId } from "react";
import { TextAreaField, TextInput } from "@/components/ui/FormField";
import { AdminField } from "@/components/admin/shared/AdminField";
import type { AtGlanceDay } from "@/components/admin/itinerary/itineraryModel";

/** Controlled editor for the "itinerary at a glance" day rows. */
export function AtGlanceDaysEditor({
  days,
  onChange,
}: {
  days: AtGlanceDay[];
  onChange: (updater: (prev: AtGlanceDay[]) => AtGlanceDay[]) => void;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const update = (idx: number, patch: Partial<AtGlanceDay>) =>
    onChange((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  return (
    <div className="mt-3 space-y-4">
      {days.map((d, idx) => {
        const base = `glance-${uid}-day-${d.dayNumber}`;
        return (
          <div key={d.dayNumber} className="rounded-xl border border-border bg-panel p-3">
            <p className="text-xs font-bold text-muted">Day {d.dayNumber}</p>
            <AdminField
              className="mt-2"
              label="Title"
              htmlFor={`${base}-title`}
              tip="Short heading for this day in the day-by-day plan on the PDF."
            >
              <TextInput
                id={`${base}-title`}
                value={d.title}
                onChange={(e) => update(idx, { title: e.target.value })}
                placeholder={idx === 0 ? "e.g. Lahore to Islamabad, drive to Naran" : "e.g. Hunza sightseeing: Altit & Baltit Fort"}
              />
            </AdminField>
            <AdminField
              className="mt-2"
              label="Details"
              htmlFor={`${base}-detail`}
              tip="What happens on this day — printed under the day title on the PDF."
            >
              <TextAreaField
                id={`${base}-detail`}
                rows={3}
                value={d.detail}
                onChange={(e) => update(idx, { detail: e.target.value })}
                placeholder="e.g. Breakfast at the hotel, then visit Attabad Lake and Passu Cones. Evening free at Karimabad bazaar."
              />
            </AdminField>
            <AdminField
              className="mt-2"
              label="Overnight (optional)"
              htmlFor={`${base}-overnight`}
              tip="Where the group sleeps that night. Leave blank on the last day or if not needed."
            >
              <TextInput
                id={`${base}-overnight`}
                value={d.overnight ?? ""}
                onChange={(e) => update(idx, { overnight: e.target.value || undefined })}
                placeholder="e.g. Hunza (Karimabad)"
              />
            </AdminField>
          </div>
        );
      })}
    </div>
  );
}
