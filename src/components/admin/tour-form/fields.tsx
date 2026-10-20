"use client";

import { useId, type ReactNode } from "react";
import { AdminField, InfoTip, fieldHintId } from "@/components/admin/shared/AdminField";
import type { NumberInput } from "./model";

/** Reusable admin form primitives (same look as the original tour editor). */

export const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

/**
 * Bubble classes for an (i) tip whose anchor is narrow (a legend or a short
 * label): give it a fixed readable width instead of the anchor's width.
 */
export const narrowTipBubbleClass = "!right-auto w-72 max-w-[80vw]";

/**
 * Extra props for the control, normally `form.fieldProps(name)` from
 * `useRequiredFields` (id, aria-*, data-field, blur tracking).
 */
export type ControlProps = {
  id?: string;
  "data-field"?: string;
  "aria-required"?: true;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  onBlur?: () => void;
};

/** Shared wrapper props for the labelled primitives below. */
type FieldChrome = {
  label: ReactNode;
  /** Red asterisk only (no native `required`; the form validates on save). */
  required?: boolean;
  /** Longer explanation in an (i) tooltip next to the label. */
  tip?: ReactNode;
  /** One short always-visible line under the control. */
  hint?: ReactNode;
  /** Error message (`form.errorFor(name)`); undefined until it should show. */
  error?: string | null;
  /** Control id. Defaults to `controlProps.id`, then a generated id. */
  id?: string;
  controlProps?: ControlProps;
};

function useControlId(id: string | undefined, controlProps: ControlProps | undefined) {
  const auto = useId();
  return id ?? controlProps?.id ?? `tour-field-${auto.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function describedBy(fid: string, hint: ReactNode, controlProps: ControlProps | undefined) {
  if (controlProps) return controlProps["aria-describedby"];
  return hint ? fieldHintId(fid) : undefined;
}

export function FormSection({
  legend,
  tip,
  children,
}: {
  legend: string;
  /** Explanation of the whole section in an (i) tooltip next to the legend. */
  tip?: ReactNode;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-xs font-semibold text-slate-600">
        {tip ? (
          <span className="relative flex items-center gap-1">
            {legend}
            <InfoTip label={`About ${legend}`} bubbleClassName={narrowTipBubbleClass}>
              {tip}
            </InfoTip>
          </span>
        ) : (
          legend
        )}
      </legend>
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
  tip,
  hint,
  error,
  id,
  controlProps,
}: FieldChrome & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email";
}) {
  const fid = useControlId(id, controlProps);
  return (
    <AdminField label={label} htmlFor={fid} required={required} tip={tip} hint={hint} error={error}>
      <input
        {...controlProps}
        id={fid}
        aria-describedby={describedBy(fid, hint, controlProps)}
        type={type}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </AdminField>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  required,
  placeholder,
  tip,
  hint,
  error,
  id,
  controlProps,
}: FieldChrome & {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const fid = useControlId(id, controlProps);
  return (
    <AdminField label={label} htmlFor={fid} required={required} tip={tip} hint={hint} error={error}>
      <textarea
        {...controlProps}
        id={fid}
        aria-describedby={describedBy(fid, hint, controlProps)}
        rows={rows}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </AdminField>
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
  required,
  tip,
  hint,
  error,
  id,
  controlProps,
}: FieldChrome & {
  value: NumberInput;
  onChange: (value: NumberInput) => void;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
}) {
  const fid = useControlId(id, controlProps);
  return (
    <AdminField label={label} htmlFor={fid} required={required} tip={tip} hint={hint} error={error}>
      <input
        {...controlProps}
        id={fid}
        aria-describedby={describedBy(fid, hint, controlProps)}
        type="number"
        min={min}
        max={max}
        step={step}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    </AdminField>
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
  tip,
}: {
  legend: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  selected: T[];
  onChange: (next: T[]) => void;
  emptyHint?: string;
  /** Pass false while `options` is still loading. */
  showUnknown?: boolean;
  /** Explanation in an (i) tooltip next to the legend. */
  tip?: ReactNode;
}) {
  const known = new Set(options.map((o) => o.value));
  const extras = showUnknown ? selected.filter((v) => !known.has(v)) : [];
  const all = [...options, ...extras.map((v) => ({ value: v, label: `${v} (not in list)` }))];
  return (
    <FormSection legend={legend} tip={tip}>
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
