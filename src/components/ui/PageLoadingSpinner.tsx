import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "dark" | "light";

export function PageLoadingSpinner({
  label = "Loading…",
  className,
  variant = "dark",
  size = "md",
}: {
  label?: string;
  className?: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}) {
  const icon =
    size === "sm" ? "h-6 w-6" : size === "lg" ? "h-12 w-12" : "h-10 w-10";

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className={cn(
          "animate-spin",
          icon,
          variant === "dark" ? "text-brand-accent" : "text-brand-primary",
        )}
        aria-hidden
      />
      <p
        className={cn(
          "text-sm font-medium",
          variant === "dark" ? "text-slate-400" : "text-slate-600",
        )}
      >
        {label}
      </p>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Centered loader for Next.js `loading.tsx` route segments */
export function RouteSegmentLoader({
  label = "Loading…",
  variant = "dark",
}: {
  label?: string;
  variant?: Variant;
}) {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center md:min-h-[60vh]">
      <PageLoadingSpinner label={label} variant={variant} className="py-0" />
    </div>
  );
}

/** Full-screen overlay during client navigation (e.g. after login) */
export function NavigationBlockingOverlay({
  label = "Redirecting…",
  variant = "dark",
}: {
  label?: string;
  variant?: Variant;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm",
        variant === "dark" ? "bg-slate-950/70" : "bg-white/80",
      )}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <div
        className={cn(
          "rounded-2xl border px-10 py-8 shadow-xl",
          variant === "dark"
            ? "border-white/10 bg-slate-900/90"
            : "border-slate-200 bg-white",
        )}
      >
        <PageLoadingSpinner
          label={label}
          variant={variant}
          size="lg"
          className="gap-4"
        />
      </div>
    </div>
  );
}
