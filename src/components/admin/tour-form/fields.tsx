"use client";

import type { ReactNode } from "react";
import type { NumberInput } from "./model";

/** Reusable admin form primitives (same look as the original tour editor). */

export const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";
const labelClass = "block text-xs font-semibold text-slate-600";

export function FormSection({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-xs font-semibold text-slate-600">{legend}</legend>
      {children}
    </fieldset>
  );
}

export function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "email";
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        type={type}
        required={required}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  required,
  placeholder,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        rows={rows}
        required={required}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** Number input where an empty box means "not set" (`""`). */
export function OptionalNumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: {
  label: ReactNode;
  value: NumberInput;
  onChange: (value: NumberInput) => void;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    </label>
  );
}

/** Checkbox grid for picking ids/values from a list. Unknown selected values stay selected. */
export function CheckboxGroupField<T extends string>({
  legend,
  options,
  selected,
  onChange,
  emptyHint,
  showUnknown = true,
}: {
  legend: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  selected: T[];
  onChange: (next: T[]) => void;
  emptyHint?: string;
  /** Pass false while `options` is still loading. */
  showUnknown?: boolean;
}) {
  const known = new Set(options.map((o) => o.value));
  const extras = showUnknown ? selected.filter((v) => !known.has(v)) : [];
  const all = [...options, ...extras.map((v) => ({ value: v, label: `${v} (not in list)` }))];
  return (
    <FormSection legend={legend}>
      {all.length === 0 && emptyHint ? (
        <p className="mt-1 text-xs text-slate-500">{emptyHint}</p>
      ) : null}
      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        {all.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange(selected.includes(opt.value) ? selected : [...selected, opt.value]);
                  } else {
                    onChange(selected.filter((x) => x !== opt.value));
                  }
                }}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </FormSection>
  );
}
