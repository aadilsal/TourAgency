"use client";

import type { Id } from "@convex/_generated/dataModel";
import { TOUR_TYPE_OPTIONS } from "@/lib/tours/tour-filters";
import { parseKnowBeforeYouGo } from "@/lib/tours/knowBeforeYouGo";
import { KnowBeforeYouGoContent } from "@/components/tours/KnowBeforeYouGo";
import { CheckboxGroupField, TextAreaField, TextField, inputClass } from "./fields";
import { slugify, type TourFormPatch, type TourFormValues } from "./model";

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
  const knowBeforeYouGoBlocks = parseKnowBeforeYouGo(values.knowBeforeYouGo);
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
      <p className="-mt-1 break-all text-xs text-slate-500">
        Page URL: /tours/{slugify(values.slug || values.title) || "…"}
      </p>
      <div>
        <TextAreaField
          label="Know before you go"
          rows={6}
          placeholder={
            "Documents:\n- Carry your original CNIC or passport for checkpoints\n- Foreign guests need a valid Pakistan visa\n\nFitness:\n- Moderate fitness needed for short hikes\n\nDress modestly at shrines and mosques."
          }
          value={values.knowBeforeYouGo}
          onChange={(knowBeforeYouGo) => onChange({ knowBeforeYouGo })}
        />
        <p className="mt-1 text-xs text-slate-500">
          Start a line with <code>-</code> for a bullet point or <code>1.</code> for a numbered
          point. End a line with <code>:</code> to make it a heading. Other lines show as
          paragraphs. Leave empty to hide the section.
        </p>
        {knowBeforeYouGoBlocks.length > 0 ? (
          <div className="mt-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Preview
            </p>
            <KnowBeforeYouGoContent blocks={knowBeforeYouGoBlocks} compact />
          </div>
        ) : null}
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
