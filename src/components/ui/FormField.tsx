import { cn } from "@/lib/cn";
import type { ComponentProps, ReactNode } from "react";

const fieldShell =
  "mt-1 flex w-full items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2.5 text-base sm:text-sm text-brand-ink shadow-sm transition-[box-shadow,border-color] focus-within:border-brand-accent/50 focus-within:ring-2 focus-within:ring-brand-accent/20";

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

export function FieldError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 text-sm text-red-600" role="alert">
      {children}
    </p>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs text-muted">{children}</p>;
}

type InputProps = ComponentProps<"input"> & {
  icon?: ReactNode;
  error?: boolean;
};

export function TextInput({ className, icon, error, ...props }: InputProps) {
  return (
    <div
      className={cn(
        fieldShell,
        error && "border-red-300 focus-within:ring-red-200",
        className,
      )}
    >
      {icon ? (
        <span className="shrink-0 text-slate-400 [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
      ) : null}
      <input
        className="min-w-0 flex-1 bg-transparent text-black caret-black outline-none placeholder:text-slate-500 text-base sm:text-sm"
        {...props}
      />
    </div>
  );
}

type TextAreaProps = ComponentProps<"textarea"> & { error?: boolean };

export function TextAreaField({ className, error, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(
        "mt-1 w-full rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2.5 text-base sm:text-sm text-brand-ink shadow-sm transition-[box-shadow,border-color] placeholder:text-slate-400 focus:border-brand-accent/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/20",
        error && "border-red-300 focus:ring-red-200",
        className,
      )}
      {...props}
    />
  );
}

type SelectProps = ComponentProps<"select"> & { error?: boolean };

export function SelectField({ className, error, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "mt-1 w-full cursor-pointer appearance-none rounded-xl border border-slate-200/90 bg-white/95 bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat px-3 py-2.5 pr-10 text-base sm:text-sm text-black shadow-sm transition-[box-shadow,border-color] focus:border-brand-accent/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/20",
        error && "border-red-300 focus:ring-red-200",
        className,
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
      }}
      {...props}
    >
      {children}
    </select>
  );
}
