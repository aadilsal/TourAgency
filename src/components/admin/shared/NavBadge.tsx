"use client";

import { cn } from "@/lib/cn";
import type { AdminNavLink } from "./adminNav";
import { formatBadgeCount, type useInboxCounts } from "./inboxHooks";

/** Red count bubble next to an Inbox menu item (hidden when zero). */
export function NavBadge({
  link,
  counts,
  className,
}: {
  link: AdminNavLink;
  counts: ReturnType<typeof useInboxCounts>;
  className?: string;
}) {
  if (!link.badgeKey || !counts) return null;
  const n = counts[link.badgeKey];
  if (!n) return null;
  const text = formatBadgeCount(n, counts.cap);
  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-none text-white tabular-nums",
        className,
      )}
      aria-label={`${text} new`}
    >
      {text}
    </span>
  );
}
