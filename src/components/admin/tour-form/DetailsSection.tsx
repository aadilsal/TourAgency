"use client";

import { InfoTip } from "@/components/admin/shared/AdminField";
import { FormSection, OptionalNumberField, TextAreaField } from "./fields";
import type { TourFormPatch, TourFormValues } from "./model";

export function DetailsSection({
  values,
  onChange,
}: {
  values: TourFormValues;
  onChange: TourFormPatch;
}) {
  return (
    <>
      <FormSection
        legend="Quick facts"
        tip="The row of quick facts near the top of the tour page (group size, minimum age). Leave any box blank to hide that fact."
      >
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <OptionalNumberField
            label="Max people"
            id="tour-editor-max-people"
            tip="Largest group size for this tour, shown as “Max people” in the quick facts."
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
        </div>
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
