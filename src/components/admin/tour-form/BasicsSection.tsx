"use client";

import type { Id } from "@convex/_generated/dataModel";
import { TOUR_TYPE_OPTIONS } from "@/lib/tour-filters";
import { CheckboxGroupField, TextAreaField, TextField, inputClass } from "./fields";
import type { TourFormPatch, TourFormValues } from "./model";

type Option<T> = { _id: T; name: string };

export function BasicsSection({
  values,
  onChange,
  destinations,
  provinces,
}: {
  values: TourFormValues;
  onChange: TourFormPatch;
  destinations: ReadonlyArray<Option<Id<"destinations">>> | undefined;
  provinces: ReadonlyArray<Option<Id<"provinces">>> | undefined;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Title" required value={values.title} onChange={(title) => onChange({ title })} />
        <TextField
          label="Slug"
          placeholder="auto from title if empty"
          value={values.slug}
          onChange={(slug) => onChange({ slug })}
        />
      </div>
      <TextAreaField
        label="Description"
        required
        rows={4}
        value={values.description}
        onChange={(description) => onChange({ description })}
      />
      <CheckboxGroupField<string>
        legend="Tour types"
        options={TOUR_TYPE_OPTIONS}
        selected={values.types}
        onChange={(types) => onChange({ types })}
      />
      <CheckboxGroupField
        legend="Destinations"
        options={(destinations ?? []).map((d) => ({ value: d._id, label: d.name }))}
        selected={values.destinationIds}
        onChange={(destinationIds) => onChange({ destinationIds })}
        showUnknown={destinations !== undefined}
      />
      <CheckboxGroupField
        legend="Provinces"
        options={(provinces ?? []).map((p) => ({ value: p._id, label: p.name }))}
        selected={values.provinceIds}
        onChange={(provinceIds) => onChange({ provinceIds })}
        showUnknown={provinces !== undefined}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-600">
          Duration (days)
          <input
            type="number"
            required
            min={1}
            className={inputClass}
            value={values.durationDays}
            onChange={(e) => onChange({ durationDays: Number(e.target.value) })}
          />
        </label>
        <TextField
          label="Location"
          required
          value={values.location}
          onChange={(location) => onChange({ location })}
        />
      </div>
    </>
  );
}
