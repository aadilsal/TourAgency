"use client";

import { cn } from "@/lib/cn";
import { analyzePassword } from "@/lib/passwordStrength";
import { Check, X } from "lucide-react";

export function PasswordStrengthMeter({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  if (!password) return null;
  const a = analyzePassword(password);
  const pct = (a.score / a.maxScore) * 100;
  const barColor =
    a.score <= 1
      ? "bg-red-500"
      : a.score === 2
        ? "bg-amber-500"
        : a.score === 3
          ? "bg-brand-sun"
          : "bg-emerald-600";

  return (
    <div className={cn("mt-2 space-y-2", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">Password strength</span>
        <span
          className={cn(
            "font-semibold",
            a.score <= 1 && "text-red-600",
            a.score === 2 && "text-amber-600",
            a.score === 3 && "text-brand-sun",
            a.score >= 4 && "text-emerald-700",
          )}
        >
          {a.label}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn("h-full rounded-full transition-all duration-200", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-1 text-xs text-slate-600">
        {a.checks.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            {c.ok ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />
            )}
            <span className={c.ok ? "text-slate-700" : "text-slate-400"}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
