import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function FormStepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="grid w-full grid-cols-3 gap-x-5 gap-y-2 sm:flex sm:items-start sm:justify-between sm:gap-6">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={`${label}-${n}`} className="flex min-w-0 flex-col items-center gap-1 px-1">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                done && "bg-brand-accent text-white",
                active &&
                  "bg-brand-primary text-white ring-2 ring-brand-accent/40 ring-offset-2 ring-offset-white",
                !done && !active && "bg-slate-200 text-slate-500",
              )}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : n}
            </div>
            <span
              className={cn(
                "block w-full text-center text-[10px] font-semibold uppercase tracking-[0.08em] leading-tight",
                "whitespace-nowrap",
                active ? "text-brand-accent" : "text-slate-500",
              )}
              title={label}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
