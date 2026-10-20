"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@convex/_generated/api";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";

/** Current time, refreshed every `intervalMs` (for "5 min ago" labels). */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Inbox status filter that opens on `fallback` (the "new / pending" view) but
 * honours `?status=…` in the URL, so links from search can open "All".
 */
export function useInboxFilter<K extends string>(
  allowed: readonly K[],
  fallback: K,
): [K, (next: K) => void] {
  const params = useSearchParams();
  const fromUrl = params?.get("status");
  const initial = fromUrl && (allowed as readonly string[]).includes(fromUrl) ? (fromUrl as K) : fallback;
  return useState<K>(initial);
}

export type InboxBadgeKey = "bookings" | "leads" | "trips" | "visa" | "reviews";

/** New / pending counts for the menu badges (one shared, cheap query). */
export function useInboxCounts() {
  const sessionToken = useConvexSessionToken();
  const { data } = useSafeQuery(
    api.dashboard.getInboxCounts,
    typeof sessionToken === "string" ? { sessionToken } : "skip",
  );
  return data;
}

export function formatBadgeCount(n: number, cap: number): string {
  return n >= cap ? `${cap - 1}+` : String(n);
}
