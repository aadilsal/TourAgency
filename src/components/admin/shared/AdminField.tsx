"use client";

import { Info } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/* Ids                                                                        */
/* -------------------------------------------------------------------------- */

import { fieldErrorMsgId, fieldHintId, isBlank } from "./requiredFields";

export { fieldErrorMsgId, fieldHintId, isBlank };

/* -------------------------------------------------------------------------- */
/* InfoTip — accessible (i) tooltip                                           */
/* -------------------------------------------------------------------------- */

/**
 * Small (i) button that explains a field. Opens on hover, on keyboard focus
 * and on tap (toggle); Escape or tapping elsewhere closes it. The text is also
 * exposed via `aria-describedby` so screen readers read it with the button.
 *
 * The bubble is positioned against the nearest `relative` ancestor — inside
 * `AdminField` that is the whole label row, so it is as wide as the field and
 * never spills out of a scrolling modal.
 */
export function InfoTip({
  children,
  label = "More info",
  bubbleClassName,
}: {
  children: ReactNode;
  label?: string;
  /** Extra classes for the bubble, e.g. a fixed width when the anchor is narrow (a legend). */
  bubbleClassName?: string;
}) {
  const id = useId();
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const open = pinned || hover;

  useEffect(() => {
    if (!pinned) return;
    function onDown(e: PointerEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      setPinned(false);
    }
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [pinned]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-describedby={id}
        aria-expanded={open}
        className="relative -my-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-700 focus-visible:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400 before:absolute before:-inset-2 before:content-['']"
        onClick={(e) => {
          e.preventDefault(); // don't focus/toggle the control the <label> wraps
          setPinned((v) => !v);
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => {
          setHover(false);
          setPinned(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            // Close the tip only — not the surrounding modal.
            e.preventDefault();
            e.stopPropagation();
            setPinned(false);
            setHover(false);
          }
        }}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-0 right-0 top-full z-30 mt-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-white shadow-lg",
          open ? "block" : "hidden",
          bubbleClassName,
        )}
      >
        {children}
      </span>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* AdminField — label + asterisk + tooltip + hint + error around a control     */
/* -------------------------------------------------------------------------- */

/**
 * Wraps any control (raw `<input>`, `TextInput`, `<select>`, `<textarea>`,
 * custom widgets). It does NOT render the control; pass it as children and
 * give it `id={htmlFor}` (or spread `form.fieldProps(name)`).
 *
 * While `error` is set, every input/select/textarea inside gets a red border
 * and ring through descendant selectors, so existing control classes need no
 * changes.
 */
export function AdminField({
  label,
  htmlFor,
  required,
  tip,
  hint,
  error,
  children,
  className,
  labelClassName,
}: {
  label: ReactNode;
  /** The control's id (`form.id(name)` when using `useRequiredFields`). */
  htmlFor?: string;
  /** Shows a red asterisk. Only set when the backend really requires it. */
  required?: boolean;
  /** Longer explanation shown in an (i) tooltip next to the label. */
  tip?: ReactNode;
  /** One short line of always-visible help under the control. */
  hint?: ReactNode;
  /** Error message; pass `form.errorFor(name)` (undefined until it should show). */
  error?: string | null;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  const invalid = Boolean(error);
  return (
    <div
      data-invalid={invalid ? "true" : undefined}
      className={cn(
        "block min-w-0",
        invalid &&
          "[&_input:not([type=checkbox]):not([type=radio])]:!border-red-500 [&_select]:!border-red-500 [&_textarea]:!border-red-500 [&_input:not([type=checkbox]):not([type=radio])]:ring-2 [&_select]:ring-2 [&_textarea]:ring-2 [&_input]:ring-red-100 [&_select]:ring-red-100 [&_textarea]:ring-red-100",
        className,
      )}
    >
      <div className="relative flex items-center gap-1">
        <label
          htmlFor={htmlFor}
          className={cn("block text-xs font-semibold text-slate-600", labelClassName)}
        >
          {label}
          {required ? (
            <span className="ml-0.5 text-red-600" aria-hidden>
              *
            </span>
          ) : null}
          {required ? <span className="sr-only"> (required)</span> : null}
        </label>
        {tip ? <InfoTip label={`About ${typeof label === "string" ? label : "this field"}`}>{tip}</InfoTip> : null}
      </div>
      {children}
      {hint && !invalid ? (
        <p id={htmlFor ? fieldHintId(htmlFor) : undefined} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {invalid ? (
        <p
          id={htmlFor ? fieldErrorMsgId(htmlFor) : undefined}
          className="mt-1 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* useRequiredFields — "required" validation that stays quiet on first load   */
/* -------------------------------------------------------------------------- */

export type RequiredField = {
  /** Stable key, e.g. the form field name. */
  name: string;
  /** Human label used in messages ("Title is required", "Fill in: Title"). */
  label: string;
  /** Current value. Missing = undefined/null, blank string, empty array, NaN. */
  value: unknown;
  /** Custom emptiness check (e.g. a select whose "" means "none chosen"). */
  isMissing?: (value: unknown) => boolean;
  /** Set false to temporarily not require it (conditional fields). */
  when?: boolean;
  /** Custom message instead of "<label> is required". */
  message?: string;
};


/**
 * Tracks required fields for one form.
 *
 * - Errors are hidden on first load. A field's error shows after the first
 *   submit attempt, or after the admin edited the field and left it empty.
 * - `submitProps` makes the save button LOOK disabled (aria-disabled) with a
 *   tooltip listing what's missing, but keeps it clickable so a blocked click
 *   can highlight the fields and jump to the first one.
 * - `guardSubmit(e)` — call first in onSubmit/onClick; returns false (and
 *   prevents the submit) when something is missing.
 * - Never use it to gate AUTOSAVE — only explicit Save/Create buttons.
 */
export function useRequiredFields(fields: RequiredField[], opts?: { idPrefix?: string }) {
  const autoId = useId();
  const prefix = opts?.idPrefix ?? `f${autoId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Record<string, true>>({});
  const initial = useRef<Record<string, string>>({});

  const active = fields.filter((f) => f.when !== false);
  const missingFields = active.filter((f) => (f.isMissing ?? isBlank)(f.value));
  const missingNames = missingFields.map((f) => f.name);
  const missingKey = missingNames.join("|");

  // Remember each field's value the first time we see it (and after reset),
  // so a blur only flags fields the admin actually changed.
  for (const f of fields) {
    if (!(f.name in initial.current)) initial.current[f.name] = JSON.stringify(f.value ?? null);
  }
  const valuesRef = useRef(fields);
  valuesRef.current = fields;

  const id = useCallback((name: string) => `${prefix}-${name}`, [prefix]);

  const isMissing = useCallback((name: string) => missingKey.split("|").includes(name), [missingKey]);

  const errorFor = useCallback(
    (name: string): string | undefined => {
      if (!(attempted || touched[name])) return undefined;
      const f = missingFields.find((m) => m.name === name);
      return f ? (f.message ?? `${f.label} is required`) : undefined;
    },
    // missingFields is derived from missingKey + labels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attempted, touched, missingKey],
  );

  const markTouched = useCallback((name: string) => {
    const f = valuesRef.current.find((x) => x.name === name);
    if (!f) return;
    if (JSON.stringify(f.value ?? null) === initial.current[name]) return;
    setTouched((t) => (t[name] ? t : { ...t, [name]: true }));
  }, []);

  /** Spread onto the control: id, aria-*, data-field and the blur tracker. */
  const fieldProps = useCallback(
    (name: string) => {
      const fid = id(name);
      const err = errorFor(name);
      const required = active.some((f) => f.name === name);
      return {
        id: fid,
        "data-field": name,
        "aria-required": required ? (true as const) : undefined,
        "aria-invalid": err ? (true as const) : undefined,
        "aria-describedby": err ? fieldErrorMsgId(fid) : fieldHintId(fid),
        onBlur: () => markTouched(name),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, errorFor, markTouched, missingKey, active.length],
  );

  const focusFirstMissing = useCallback(() => {
    const first = missingNames[0];
    if (!first || typeof document === "undefined") return;
    const el =
      document.getElementById(id(first)) ??
      (document.querySelector(`[data-field="${CSS.escape(first)}"]`) as HTMLElement | null);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    window.setTimeout(() => el.focus({ preventScroll: true }), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey, id]);

  /** Call at the top of the submit handler. Returns true when it may proceed. */
  const guardSubmit = useCallback(
    (e?: FormEvent | { preventDefault: () => void }) => {
      setAttempted(true);
      if (missingNames.length === 0) return true;
      e?.preventDefault();
      focusFirstMissing();
      return false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [missingKey, focusFirstMissing],
  );

  /** Hide all errors again (e.g. when the editor opens a different record). */
  const reset = useCallback(() => {
    setAttempted(false);
    setTouched({});
    initial.current = {};
  }, []);

  const missingLabels = useMemo(
    () => missingFields.map((f) => f.label),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [missingKey],
  );
  const submitTitle = missingLabels.length ? `Fill in the required fields: ${missingLabels.join(", ")}` : undefined;

  /**
   * Spread onto the Save/Create button. It stays clickable on purpose — a
   * click while invalid is how errors get revealed. Pair with `guardSubmit`.
   * `<Button>` dims itself via `aria-disabled:` styles; for a raw <button>
   * add `aria-disabled:opacity-50 aria-disabled:cursor-not-allowed`.
   */
  const submitProps = {
    "aria-disabled": missingLabels.length > 0 ? (true as const) : undefined,
    title: submitTitle,
  };

  return {
    id,
    fieldProps,
    errorFor,
    isMissing,
    isValid: missingLabels.length === 0,
    missingLabels,
    showErrors: attempted,
    guardSubmit,
    focusFirstMissing,
    submitProps,
    submitTitle,
    reset,
  };
}

export type RequiredFieldsForm = ReturnType<typeof useRequiredFields>;

/** "Fields marked * are required" note for the top or bottom of a form. */
export function RequiredFieldsNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-slate-500", className)}>
      Fields marked <span className="font-semibold text-red-600">*</span> are required.
    </p>
  );
}
