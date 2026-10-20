"use client";

import { InfoTip } from "@/components/admin/shared/AdminField";
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
      <FormSection
        legend="Facts row"
        tip="The row of quick facts near the top of the tour page (group size, minimum age, tour type, rating). Leave any box blank to hide that fact."
      >
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <OptionalNumberField
            label="Max people"
            id="tour-editor-max-people"
            tip="Largest group size for this tour, shown as “Max people” in the facts row."
            placeholder="e.g. 12"
            min={1}
            value={values.maxPeople}
            onChange={(maxPeople) => onChange({ maxPeople })}
          />
          <OptionalNumberField
            label="Min age"
            id="tour-editor-min-age"
            tip="Youngest age allowed, e.g. 5 for family trips or 16 for treks. Leave blank for all ages."
            placeholder="e.g. 5"
            min={0}
            value={values.minAge}
            onChange={(minAge) => onChange({ minAge })}
          />
          <TextField
            label="Tour type label"
            id="tour-editor-tour-type-label"
            tip="Free-text tour type shown in the facts row. It doesn't affect the Tour types filters above."
            placeholder="e.g. Honeymoon tours"
            value={values.tourTypeLabel}
            onChange={(tourTypeLabel) => onChange({ tourTypeLabel })}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <OptionalNumberField
            label="Rating avg"
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
            label="Reviews count"
            id="tour-editor-reviews-count"
            tip="Number of reviews behind the manual rating, shown next to the stars until approved customer reviews exist."
            placeholder="e.g. 36"
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
          id="tour-editor-highlights"
          tip="The best moments of the trip, shown as a bullet list on the tour page. Put each highlight on its own line."
          placeholder={"Sunset at Attabad Lake\nPassu Cones viewpoint\nBaltit Fort guided visit"}
          rows={4}
          value={values.highlightsInput}
          onChange={(highlightsInput) => onChange({ highlightsInput })}
        />
        <TextAreaField
          label="What’s included (one per line)"
          id="tour-editor-included"
          tip="Everything the price covers, shown with tick marks on the tour page. One item per line."
          placeholder={"Private transport with driver\nHotel stays (twin sharing)\nBreakfast & dinner"}
          rows={4}
          value={values.includedInput}
          onChange={(includedInput) => onChange({ includedInput })}
        />
        <TextAreaField
          label="Not included (one per line)"
          id="tour-editor-excluded"
          tip="Costs the traveller pays separately, shown with crosses on the tour page. One item per line."
          placeholder={"Flights to Islamabad\nLunch\nPersonal expenses & tips"}
          rows={4}
          value={values.excludedInput}
          onChange={(excludedInput) => onChange({ excludedInput })}
        />
      </div>

      <FormSection
        legend="Booking form fields"
        tip="Options visitors pick in the booking / enquiry form on this tour page. Leave a box empty to hide that choice."
      >
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <TextAreaField
            label="Time slots (one per line)"
            id="tour-editor-time-slots"
            tip="Departure times or start dates visitors can choose from. One per line."
            placeholder={"8:00 AM pickup from Islamabad\nEvery Friday"}
            value={values.timeSlotsInput}
            onChange={(timeSlotsInput) => onChange({ timeSlotsInput })}
          />
          <TextAreaField
            label="Ticket groups (one per line, optional “(age range)”)"
            id="tour-editor-ticket-groups"
            tip="Traveller categories the visitor counts in the form, e.g. adults and children. Add an age range in brackets if it matters."
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
          placeholder="e.g. Blue Area, Islamabad (blank = site contact details)"
          value={values.office}
          onChange={(office) => onChange({ office })}
        />
        <TextField
          label="Email"
          id="tour-editor-email"
          tip="Contact email shown for this tour. Leave blank to use the main site contact email."
          type="email"
          placeholder="e.g. hunza@yourdomain.com (blank = site contact email)"
          value={values.email}
          onChange={(email) => onChange({ email })}
        />
      </div>
      <div className="relative flex items-center gap-1">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => onChange({ isActive: e.target.checked })}
          />
          Active (visible on site)
        </label>
        <InfoTip label="About Active">
          Untick to hide this tour from the website (listings, search and its page) without
          deleting it — handy for off-season trips.
        </InfoTip>
      </div>
    </>
  );
}
