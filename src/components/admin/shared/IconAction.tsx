import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { Trash2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "title"> & {
  /** Tooltip and accessible name, e.g. "Remove payment row". */
  label: string;
  icon?: LucideIcon;
  tone?: "danger" | "neutral";
};

/**
 * Compact icon-only action button for admin rows (remove, delete, …).
 *
 * Fixed square size, so it never wraps or squashes the way a text button does
 * in a narrow grid column. The label is exposed as a native tooltip (`title`,
 * which isn't clipped by scrolling tables/cards) and as `aria-label`.
 */
function iconActionClass(tone: "danger" | "neutral", className?: string) {
  return cn(
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 sm:h-9 sm:w-9",
    tone === "danger"
      ? "text-red-600 hover:border-red-200 hover:bg-red-50 focus-visible:outline-red-500"
      : "text-slate-600 hover:border-slate-200 hover:bg-slate-100 focus-visible:outline-slate-500",
    className,
  );
}

export function IconAction({
  label,
  icon: Icon = Trash2,
  tone = "danger",
  className,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={iconActionClass(tone, className)}
      {...rest}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

/** Same look as `IconAction`, but a navigation link (edit page, view page…). */
export function IconActionLink({
  label,
  icon: Icon,
  tone = "neutral",
  className,
  ...rest
}: Omit<ComponentProps<typeof Link>, "children" | "title"> & {
  label: string;
  icon: LucideIcon;
  tone?: "danger" | "neutral";
}) {
  return (
    <Link title={label} aria-label={label} className={iconActionClass(tone, className)} {...rest}>
      <Icon className="h-4 w-4" aria-hidden />
    </Link>
  );
}
