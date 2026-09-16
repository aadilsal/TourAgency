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
    <FormSection legend="Itinerary — day by day">
      <div className="space-y-3">
        {days.map((d, idx) => (
          <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Day</span>
              <input
                type="number"
                className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={d.day}
                onChange={(e) => updateDay(idx, { day: Number(e.target.value) })}
              />
              <input
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
              rows={2}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="What happens this day…"
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
