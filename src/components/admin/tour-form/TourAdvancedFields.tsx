"use client";

import type { Id } from "@convex/_generated/dataModel";
import {
  AdvancedSection,
  CheckboxGroupField,
  FormSection,
  OptionalNumberField,
  TextAreaField,
  TextField,
} from "./fields";
import { slugify, type TourFormPatch, type TourFormValues } from "./model";

/**
 * Technical or rarely used tour fields, collapsed under "Advanced (optional)".
 * Same ids and values as before; only where they appear changed.
 */
export function TourAdvancedFields({
  values,
  onChange,
  provinces,
  approvedReviews,
  forceOpen,
}: {
  values: TourFormValues;
  onChange: TourFormPatch;
  provinces: ReadonlyArray<{ _id: Id<"provinces">; name: string }> | undefined;
  /** Computed from approved customer reviews (read-only). */
  approvedReviews?: { average?: number; count?: number };
  /** Open the box, e.g. when a save failed because of the web address. */
  forceOpen?: boolean;
}) {
  const approvedCount = approvedReviews?.count ?? 0;
  return (
    <AdvancedSection forceOpen={forceOpen}>
      <div>
        <TextField
          label="Web address (auto from title)"
          id="tour-editor-slug"
          tip="The end of this tour's web address. Leave blank and it is made from the title. If you change it later, old links still lead to the new address."
          placeholder="e.g. hunza-skardu-7-days (leave blank to use the title)"
          value={values.slug}
          onChange={(slug) => onChange({ slug })}
        />
        <p className="mt-1 break-all text-xs text-slate-500">
          Page address: /tours/{slugify(values.slug || values.title) || "…"}
        </p>
      </div>

      <CheckboxGroupField
        legend="Provinces"
        tip="Provinces or regions the tour passes through (e.g. Gilgit-Baltistan, Khyber Pakhtunkhwa). Used for the province pages and filters."
        options={(provinces ?? []).map((p) => ({ value: p._id, label: p.name }))}
        selected={values.provinceIds}
        onChange={(provinceIds) => onChange({ provinceIds })}
        showUnknown={provinces !== undefined}
      />

      <TextField
        label="Tour style text (shown in quick facts)"
        id="tour-editor-tour-type-label"
        tip="Short text shown in the quick facts, e.g. “Honeymoon tours”. It doesn't change the Tour types ticks."
        placeholder="e.g. Honeymoon tours"
        value={values.tourTypeLabel}
        onChange={(tourTypeLabel) => onChange({ tourTypeLabel })}
      />

      <div>
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionalNumberField
            label="Starting star rating"
            id="tour-editor-rating-avg"
            tip="Star rating out of 5 shown until the tour has approved customer reviews. Use a real figure, e.g. from Google or TripAdvisor."
            placeholder="e.g. 4.8"
            min={0}
            max={5}
            step="0.1"
            value={values.ratingAvg}
            onChange={(ratingAvg) => onChange({ ratingAvg })}
          />
          <OptionalNumberField
            label="Starting number of reviews"
            id="tour-editor-reviews-count"
            tip="Number of reviews shown next to the starting star rating."
            placeholder="e.g. 36"
            min={0}
            step="1"
            value={values.reviewsCount}
            onChange={(reviewsCount) => onChange({ reviewsCount })}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {approvedCount > 0 && typeof approvedReviews?.average === "number"
            ? `The website now shows ${approvedReviews.average.toFixed(1)} stars from ${approvedCount} real review${approvedCount === 1 ? "" : "s"}, so these two boxes are not used.`
            : "Only used until real customer reviews arrive."}
        </p>
      </div>

      <FormSection
        legend="Booking form choices"
        tip="Options visitors pick in the booking / enquiry form on this tour page. Leave a box empty to hide that choice."
      >
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <TextAreaField
            label="Departure times (one per line)"
            id="tour-editor-time-slots"
            tip="Departure times or start dates visitors can choose from. One per line."
            placeholder={"8:00 AM pickup from Islamabad\nEvery Friday"}
            value={values.timeSlotsInput}
            onChange={(timeSlotsInput) => onChange({ timeSlotsInput })}
          />
          <TextAreaField
            label="Traveller types (one per line, age in brackets)"
            id="tour-editor-ticket-groups"
            tip="Types of traveller the visitor counts in the form, e.g. adults and children. Add an age range in brackets if it matters."
            value={values.ticketGroupsInput}
            onChange={(ticketGroupsInput) => onChange({ ticketGroupsInput })}
            placeholder={"Adult (18+)\nChildren (0-12)"}
          />
        </div>
      </FormSection>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Office"
          id="tour-editor-office"
          tip="Office address or city shown in this tour's contact box, e.g. a Gilgit branch for northern tours."
          placeholder="e.g. Blue Area, Islamabad (blank = your main contact details)"
          value={values.office}
          onChange={(office) => onChange({ office })}
        />
        <TextField
          label="Email"
          id="tour-editor-email"
          tip="Contact email shown for this tour. Leave blank to use your main contact email."
          type="email"
          placeholder="e.g. hunza@yourdomain.com (blank = main contact email)"
          value={values.email}
          onChange={(email) => onChange({ email })}
        />
      </div>
    </AdvancedSection>
  );
}
