import { cn } from "@/lib/cn";
import { AlertCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

const fieldShellBase =
  "mt-1 flex w-full items-center gap-2 rounded-xl border bg-white/95 px-3 py-2.5 text-base sm:text-sm text-brand-ink shadow-sm transition-[box-shadow,border-color] focus-within:ring-2";
const fieldShellOk =
  "border-slate-200/90 focus-within:border-brand-accent/50 focus-within:ring-brand-accent/20";
const fieldShellError =
  "border-red-500 focus-within:border-red-500 focus-within:ring-red-200";

const controlBase =
  "mt-1 w-full rounded-xl border bg-white/95 px-3 py-2.5 text-base sm:text-sm shadow-sm transition-[box-shadow,border-color] focus:outline-none focus:ring-2";
const controlOk =
  "border-slate-200/90 focus:border-brand-accent/50 focus:ring-brand-accent/20";
const controlError = "border-red-500 focus:border-red-500 focus:ring-red-200";

/** Id used to link a field to its inline error message via `aria-describedby`. */
export function fieldErrorId(fieldId: string) {
  return `${fieldId}-error`;
}

/**
 * Spread onto a TextInput / TextAreaField / SelectField (or a raw control) to wire
 * the error border, `aria-invalid`, and `aria-describedby` for an inline message
 * rendered with `<FieldError id={fieldErrorId(fieldId)}>`.
 */
export function fieldErrorProps(fieldId: string, error?: string | null) {
  return {
    error: Boolean(error),
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? fieldErrorId(fieldId) : undefined,
  };
}

/** Same as `fieldErrorProps` but without the `error` flag, for native elements. */
export function nativeFieldErrorProps(fieldId: string, error?: string | null) {
  return {
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? fieldErrorId(fieldId) : undefined,
  };
}

export function FieldLabel({
  children,
  className,
  htmlFor,
  required,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-medium text-black", className)}
    >
      {children}
      {required ? <span className="text-brand-cta"> *</span> : null}
    </label>
  );
}

/**
 * Inline error message under a field. Pass `id` (see `fieldErrorId`) when the
 * field references it through `aria-describedby`; without an id it behaves as a
 * standalone alert (legacy usage).
 */
export function FieldError({
  children,
  id,
  className,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      id={id}
      className={cn("mt-1.5 text-sm text-red-600", className)}
      role={id ? undefined : "alert"}
    >
      {children}
    </p>
  );
}

/** Form-level alert for server / mutation failures. Always visible, announced. */
export function FormAlert({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs text-muted">{children}</p>;
}

export type InputProps = ComponentProps<"input"> & {
  icon?: ReactNode;
  error?: boolean;
  /** Rendered inside the field after the input (e.g. a show-password button). */
  endAdornment?: ReactNode;
};

export function TextInput({ className, icon, error, endAdornment, ...props }: InputProps) {
  return (
    <div
      className={cn(
        fieldShellBase,
        error ? fieldShellError : fieldShellOk,
        className,
      )}
    >
      {icon ? (
        <span
          className={cn(
            "shrink-0 [&_svg]:h-4 [&_svg]:w-4",
            error ? "text-red-500" : "text-slate-400",
          )}
        >
          {icon}
        </span>
      ) : null}
      <input
        className="min-w-0 flex-1 bg-transparent text-black caret-black outline-none placeholder:text-slate-500 text-base sm:text-sm"
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {endAdornment}
    </div>
  );
}


type TextAreaProps = ComponentProps<"textarea"> & { error?: boolean };

export function TextAreaField({ className, error, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(
        controlBase,
        "text-brand-ink placeholder:text-slate-400",
        error ? controlError : controlOk,
        className,
      )}
      aria-invalid={error ? true : undefined}
      {...props}
    />
  );
}

type SelectProps = ComponentProps<"select"> & { error?: boolean };

export function SelectField({ className, error, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        controlBase,
        "cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10 text-black",
        error ? controlError : controlOk,
        className,
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
      }}
      aria-invalid={error ? true : undefined}
      {...props}
    >
      {children}
    </select>
  );
}
