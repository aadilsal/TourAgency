"use client";

import type { Id } from "@convex/_generated/dataModel";
import { TOUR_TYPE_OPTIONS } from "@/lib/tours/tour-filters";
import { parseKnowBeforeYouGo } from "@/lib/tours/knowBeforeYouGo";
import { KnowBeforeYouGoContent } from "@/components/tours/KnowBeforeYouGo";
import { TOUR_AUDIENCE_OPTIONS, parseTourAudience } from "@/lib/tours/tourAudience";
import { AdminField, type RequiredFieldsForm } from "@/components/admin/shared/AdminField";
import { CheckboxGroupField, TextAreaField, TextField, inputClass } from "./fields";
import type { TourFormPatch, TourFormValues } from "./model";

type Option<T> = { _id: T; name: string };

export function BasicsSection({
  values,
  onChange,
  destinations,
  blogPosts,
  req,
}: {
  values: TourFormValues;
  onChange: TourFormPatch;
  destinations: ReadonlyArray<Option<Id<"destinations">>> | undefined;
  blogPosts: ReadonlyArray<{ _id: Id<"blogPosts">; title: string; published: boolean }> | undefined;
  /** Required-field tracker from the editor (title, description, duration, location). */
  req?: RequiredFieldsForm;
}) {
  const knowBeforeYouGoBlocks = parseKnowBeforeYouGo(values.knowBeforeYouGo);
  return (
    <>
      <AdminField
        label="Tour badge"
        htmlFor="tour-editor-audience"
        tip="Optional badge on the tour's photo. “Most popular” tours are listed first on the home page; “International tour” ones also appear in the home page's International tours section. Visitors can filter by them on the Tours page. Choose No badge to show none."
      >
        <select
          id="tour-editor-audience"
          className={inputClass}
          value={values.audience}
          onChange={(e) => onChange({ audience: parseTourAudience(e.target.value) ?? "" })}
        >
          <option value="">No badge</option>
          {TOUR_AUDIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} — badge “{o.badge}”
            </option>
          ))}
        </select>
      </AdminField>
      <TextField
        label="Title"
        required
        tip="The tour name shown on its page, on tour cards and in Google results. Keep it short and specific."
        placeholder="e.g. 7-Day Hunza & Skardu Adventure"
        error={req?.errorFor("title")}
        controlProps={req?.fieldProps("title")}
        value={values.title}
        onChange={(title) => onChange({ title })}
      />
      <div>
        <TextAreaField
          label="Know before you go"
          id="tour-editor-know-before-you-go"
          tip="Practical travel notes shown in their own section on the tour page: documents for checkpoints, fitness level, weather and packing, dress code, mobile signal, altitude. Leave empty to hide the section."
          rows={6}
          placeholder={
            "Documents:\n- Carry your original CNIC or passport for checkpoints\n- Foreign guests need a valid Pakistan visa\n\nFitness:\n- Moderate fitness needed for short hikes\n\nDress modestly at shrines and mosques."
          }
          hint={
            <>
              Start a line with <code>-</code> for a bullet point or <code>1.</code> for a
              numbered point. End a line with <code>:</code> to make it a heading. Other lines
              show as paragraphs. Leave empty to hide the section.
            </>
          }
          value={values.knowBeforeYouGo}
          onChange={(knowBeforeYouGo) => onChange({ knowBeforeYouGo })}
        />
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
        tip="The main introduction on the tour page and the summary used for search results. Describe the route, the experience and who it suits."
        placeholder="e.g. Drive the Karakoram Highway to Hunza, see Attabad Lake and Passu Cones, then fly to Skardu for Shangrila and Deosai. Ideal for families and first-time visitors to Gilgit-Baltistan."
        error={req?.errorFor("description")}
        controlProps={req?.fieldProps("description")}
        rows={4}
        value={values.description}
        onChange={(description) => onChange({ description })}
      />
      <CheckboxGroupField<string>
        legend="Tour types"
        tip="Tick every style that fits. Visitors use these to filter tours on the Tours page (e.g. Family, Honeymoon, Adventure)."
        options={TOUR_TYPE_OPTIONS}
        selected={values.types}
        onChange={(types) => onChange({ types })}
      />
      <CheckboxGroupField
        legend="Destinations"
        tip="Places this tour visits (e.g. Hunza Valley, Skardu). The tour is listed on each ticked destination's page. Manage the list under Destinations in the menu."
        options={(destinations ?? []).map((d) => ({ value: d._id, label: d.name }))}
        selected={values.destinationIds}
        onChange={(destinationIds) => onChange({ destinationIds })}
        showUnknown={destinations !== undefined}
      />
      <CheckboxGroupField
        legend="Related blog posts (shown on the tour page)"
        tip="Travel guides that help visitors plan this trip, e.g. a Hunza packing list or a best-time-to-visit post. They are linked at the bottom of the tour page; drafts stay hidden until published."
        options={(blogPosts ?? []).map((p) => ({
          value: p._id,
          label: p.published ? p.title : `${p.title} (draft — hidden until published)`,
        }))}
        selected={values.relatedBlogPostIds}
        onChange={(relatedBlogPostIds) => onChange({ relatedBlogPostIds })}
        showUnknown={blogPosts !== undefined}
        emptyHint="No blog posts yet — add them in Admin → Blog."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField
          label="Duration (days)"
          htmlFor={req?.id("durationDays") ?? "tour-editor-durationDays"}
          required
          tip="Total number of days including travel days, e.g. 7 for a 7-day / 6-night trip. Shown on tour cards and used by the duration filter."
          error={req?.errorFor("durationDays")}
        >
          <input
            id="tour-editor-durationDays"
            {...req?.fieldProps("durationDays")}
            type="number"
            min={1}
            className={inputClass}
            placeholder="e.g. 7"
            value={values.durationDays}
            onChange={(e) => onChange({ durationDays: Number(e.target.value) })}
          />
        </AdminField>
        <TextField
          label="Location"
          required
          tip="Where the tour starts or mainly takes place, shown on tour cards and in the quick facts."
          placeholder="e.g. Islamabad to Hunza, Gilgit-Baltistan"
          error={req?.errorFor("location")}
          controlProps={req?.fieldProps("location")}
          value={values.location}
          onChange={(location) => onChange({ location })}
        />
      </div>
    </>
  );
}
