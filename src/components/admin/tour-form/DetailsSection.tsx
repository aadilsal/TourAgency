"use client";

import { FormSection, OptionalNumberField, TextAreaField, TextField } from "./fields";
import type { TourFormPatch, TourFormValues } from "./model";

export function DetailsSection({
  values,
  onChange,
  approvedReviews,
}: {
  values: TourFormValues;
  onChange: TourFormPatch;
  /** Computed from approved customer reviews (read-only). */
  approvedReviews?: { average?: number; count?: number };
}) {
  const approvedCount = approvedReviews?.count ?? 0;
  return (
    <>
      <FormSection legend="Facts row">
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <OptionalNumberField
            label="Max people"
            min={1}
            value={values.maxPeople}
            onChange={(maxPeople) => onChange({ maxPeople })}
          />
          <OptionalNumberField
            label="Min age"
            min={0}
            value={values.minAge}
            onChange={(minAge) => onChange({ minAge })}
          />
          <TextField
            label="Tour type label"
            placeholder="e.g. Honeymoon tours"
            value={values.tourTypeLabel}
            onChange={(tourTypeLabel) => onChange({ tourTypeLabel })}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <OptionalNumberField
            label="Rating avg"
            min={0}
            max={5}
            step="0.1"
            value={values.ratingAvg}
            onChange={(ratingAvg) => onChange({ ratingAvg })}
          />
          <OptionalNumberField
            label="Reviews count"
            min={0}
            step="1"
            value={values.reviewsCount}
            onChange={(reviewsCount) => onChange({ reviewsCount })}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {approvedCount > 0 && typeof approvedReviews?.average === "number"
            ? `The website shows ${approvedReviews.average.toFixed(1)} from ${approvedCount} approved customer review${approvedCount === 1 ? "" : "s"}; the manual values above are used only while there are no approved reviews.`
            : "Shown on the website until this tour has approved customer reviews."}
        </p>
      </FormSection>

      <div className="grid gap-3 sm:grid-cols-3">
        <TextAreaField
          label="Highlights (one per line)"
          rows={4}
          value={values.highlightsInput}
          onChange={(highlightsInput) => onChange({ highlightsInput })}
        />
        <TextAreaField
          label="What’s included (one per line)"
          rows={4}
          value={values.includedInput}
          onChange={(includedInput) => onChange({ includedInput })}
        />
        <TextAreaField
          label="Not included (one per line)"
          rows={4}
          value={values.excludedInput}
          onChange={(excludedInput) => onChange({ excludedInput })}
        />
      </div>

      <FormSection legend="Booking form fields">
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <TextAreaField
            label="Time slots (one per line)"
            value={values.timeSlotsInput}
            onChange={(timeSlotsInput) => onChange({ timeSlotsInput })}
          />
          <TextAreaField
            label="Ticket groups (one per line, optional “(age range)”)"
            value={values.ticketGroupsInput}
            onChange={(ticketGroupsInput) => onChange({ ticketGroupsInput })}
            placeholder={"Adult (18+)\nChildren (0-12)"}
          />
        </div>
      </FormSection>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Office"
          placeholder="Leave blank to use the site contact details"
          value={values.office}
          onChange={(office) => onChange({ office })}
        />
        <TextField
          label="Email"
          type="email"
          placeholder="Leave blank to use the site contact email"
          value={values.email}
          onChange={(email) => onChange({ email })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => onChange({ isActive: e.target.checked })}
        />
        Active (visible on site)
      </label>
    </>
  );
}
