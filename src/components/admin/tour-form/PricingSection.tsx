"use client";

import { FormSection, OptionalNumberField } from "./fields";
import {
  emptyPerHeadRow,
  type NumberInput,
  type PerHeadRow,
  type TourFormPatch,
  type TourFormValues,
} from "./model";

const cellInputClass =
  "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:mt-0";

export function PricingSection({
  values,
  onChange,
}: {
  values: TourFormValues;
  onChange: TourFormPatch;
}) {
  const rows = values.perHeadRows;

  function setCell(index: number, key: keyof PerHeadRow, raw: string) {
    const nextValue: NumberInput = raw === "" ? "" : Number(raw);
    onChange((prev) => ({
      perHeadRows: prev.perHeadRows.map((r, j) => (j === index ? { ...r, [key]: nextValue } : r)),
    }));
  }

  const cells: Array<{ key: keyof PerHeadRow; label: string; min: number; placeholder: string }> = [
    { key: "persons", label: "Persons", min: 1, placeholder: "e.g. 4" },
    { key: "priceUsd", label: "Per head (USD)", min: 0, placeholder: "e.g. 400" },
    { key: "pricePkr", label: "Per head (PKR)", min: 0, placeholder: "e.g. 110000" },
  ];

  return (
    <FormSection legend="Pricing">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Total tour price
      </p>
      <p className="mb-2 text-xs text-slate-500">
        Total cost for the whole tour. Set a price to publish this tour with a public price and a{" "}
        <span className="font-semibold">Book now</span> button. Leave everything in this section
        blank to keep it as a <span className="font-semibold">Customise</span>{" "}
        (request-a-quote) tour.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <OptionalNumberField
          label="Total tour price (USD) — shown to international visitors"
          min={0}
          placeholder="e.g. 1200"
          value={values.priceUsd}
          onChange={(priceUsd) => onChange({ priceUsd })}
        />
        <OptionalNumberField
          label="Total tour price (PKR) — shown to Pakistan visitors"
          min={0}
          placeholder="e.g. 250000"
          value={values.pricePkr}
          onChange={(pricePkr) => onChange({ pricePkr })}
        />
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Price per head (optional)
      </p>
      <p className="mb-2 text-xs text-slate-500">
        Per person rates for specific group sizes, e.g.{" "}
        <span className="font-semibold">4 persons → $400 each</span>. Add as many options as you
        need. Rows without a group size and at least one amount are ignored — with no rows at
        all, the per head block is hidden on the website entirely.
      </p>
      {rows.length > 0 ? (
        <div className="space-y-2">
          <div className="hidden gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[6rem_1fr_1fr_2.25rem]">
            <span>Persons</span>
            <span>Per head (USD)</span>
            <span>Per head (PKR)</span>
            <span className="sr-only">Remove</span>
          </div>
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-[6rem_1fr_1fr_2.25rem] sm:items-center sm:border-0 sm:p-0"
            >
              {cells.map((cell) => (
                <label
                  key={cell.key}
                  className="block text-xs font-semibold text-slate-600 sm:contents"
                >
                  <span className="sm:hidden">{cell.label}</span>
                  <input
                    type="number"
                    min={cell.min}
                    className={cellInputClass}
                    placeholder={cell.placeholder}
                    value={row[cell.key]}
                    onChange={(e) => setCell(i, cell.key, e.target.value)}
                  />
                </label>
              ))}
              <button
                type="button"
                aria-label={`Remove per head option ${i + 1}`}
                className="mt-1 h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 sm:mt-0"
                onClick={() =>
                  onChange((prev) => ({ perHeadRows: prev.perHeadRows.filter((_, j) => j !== i) }))
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        onClick={() =>
          onChange((prev) => ({ perHeadRows: [...prev.perHeadRows, { ...emptyPerHeadRow }] }))
        }
      >
        + Add per head option
      </button>
    </FormSection>
  );
}
