"use client";

import { Button } from "@/components/ui/Button";
import { FormSection } from "./fields";
import {
  defaultItinerary,
  type ItineraryDay,
  type TourFormPatch,
  type TourFormValues,
} from "./model";

export function ItinerarySection({
  values,
  onChange,
}: {
  values: TourFormValues;
  onChange: TourFormPatch;
}) {
  const days = values.itinerary;

  const setDays = (fn: (prev: ItineraryDay[]) => ItineraryDay[]) =>
    onChange((prev) => ({ itinerary: fn(prev.itinerary) }));

  function updateDay(idx: number, patch: Partial<ItineraryDay>) {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }
  function addDay() {
    setDays((prev) => [
      ...prev,
      {
        day: prev.length ? (prev[prev.length - 1]!.day ?? prev.length - 1) + 1 : 1,
        title: "",
        description: "",
      },
    ]);
  }
  function removeDay(idx: number) {
    setDays((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [...defaultItinerary];
    });
  }
  function moveDay(idx: number, dir: -1 | 1) {
    setDays((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j]!, next[idx]!];
      return next;
    });
  }

  return (
    <FormSection
      legend="Itinerary — day by day"
      tip="The day-by-day plan shown on the tour page. Give each day a short title (e.g. “Islamabad — Naran via Kaghan Valley”) and a few lines on drives, stops and the overnight stay. At least one day needs a title before you can save. Use the arrows to reorder days."
    >
      <div className="space-y-3">
        {days.map((d, idx) => (
          <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Day</span>
              <input
                id={`tour-editor-day-${idx}-number`}
                aria-label={`Day number, row ${idx + 1}`}
                title="Day number shown on the tour page"
                type="number"
                placeholder="1"
                className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={d.day}
                onChange={(e) => updateDay(idx, { day: Number(e.target.value) })}
              />
              <input
                id={`tour-editor-day-${idx}-title`}
                aria-label={`Day ${d.day} title`}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium"
                placeholder="Day title (e.g. Islamabad — Hunza)"
                value={d.title}
                onChange={(e) => updateDay(idx, { title: e.target.value })}
              />
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  className="rounded px-2 py-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                  disabled={idx === 0}
                  onClick={() => moveDay(idx, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  className="rounded px-2 py-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                  disabled={idx === days.length - 1}
                  onClick={() => moveDay(idx, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label="Remove day"
                  className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    const hasContent = Boolean(d.title.trim() || d.description.trim());
                    if (hasContent && !window.confirm("Remove this day and its text?")) return;
                    removeDay(idx);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <textarea
              id={`tour-editor-day-${idx}-description`}
              aria-label={`Day ${d.day} description`}
              rows={2}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="What happens this day, e.g. Drive the Karakoram Highway (8–9 hrs), lunch stop at Besham, overnight at a hotel in Karimabad."
              value={d.description}
              onChange={(e) => updateDay(idx, { description: e.target.value })}
            />
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="mt-3 !px-3 !py-1.5 !text-xs"
        onClick={addDay}
      >
        + Add day
      </Button>
    </FormSection>
  );
}
