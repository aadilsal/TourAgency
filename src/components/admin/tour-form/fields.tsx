"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
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

/**
 * Collapsed "Advanced (optional)" box for technical or rarely used fields.
 * Closed by default; opens by itself when `forceOpen` turns true (e.g. a field
 * inside has a validation error) and whenever a control inside is marked
 * invalid (`aria-invalid` / `data-invalid`), so errors are never hidden.
 * Children stay mounted while closed, so ids and values are unaffected.
 */
export function AdvancedSection({
  children,
  title = "Advanced (optional)",
  summary = "Rarely needed. Leave these as they are unless you know you need them.",
  forceOpen,
  className,
}: {
  children: ReactNode;
  title?: string;
  summary?: ReactNode;
  forceOpen?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  // Open automatically when something inside becomes invalid.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof MutationObserver === "undefined") return;
    const check = () => {
      if (el.querySelector('[aria-invalid="true"], [data-invalid="true"]')) setOpen(true);
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(el, { subtree: true, attributes: true, attributeFilter: ["aria-invalid", "data-invalid"] });
    return () => obs.disconnect();
  }, []);

  return (
    <details
      ref={ref}
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className={`group rounded-lg border border-dashed border-slate-300 bg-slate-50/60 ${className ?? ""}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span aria-hidden className="text-slate-400 transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="space-y-4 border-t border-slate-200 px-3 pb-3 pt-3">
        {summary ? <p className="text-xs text-slate-500">{summary}</p> : null}
        {children}
      </div>
    </details>
  );
}

/**
 * Small secondary "More" dropdown for rarely used actions (bulk upload,
 * developer tools). Closes on pick, outside click or Escape.
 */
export function MoreMenu({
  items,
  label = "More",
}: {
  items: ReadonlyArray<{ label: string; onSelect: () => void; disabled?: boolean } | false | null | undefined>;
  label?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const shown = items.filter(Boolean) as Array<{ label: string; onSelect: () => void; disabled?: boolean }>;

  useEffect(() => {
    function onDown(e: PointerEvent) {
      const el = ref.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    }
    function onKey(e: KeyboardEvent) {
      const el = ref.current;
      if (e.key === "Escape" && el?.open) el.open = false;
    }
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (shown.length === 0) return null;
  return (
    <details ref={ref} className="relative">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-sm hover:border-border-strong hover:bg-havezic-background-light [&::-webkit-details-marker]:hidden">
        {label} <span aria-hidden>▾</span>
      </summary>
      <div className="absolute left-0 z-20 mt-1 min-w-[14rem] rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
        {shown.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => {
              if (ref.current) ref.current.open = false;
              item.onSelect();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </details>
  );
}
