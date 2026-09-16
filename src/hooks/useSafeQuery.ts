"use client";

import { useQueries } from "convex/react";
import type { RequestForQueries } from "convex/react";
import type { FunctionReference, FunctionReturnType } from "convex/server";
import { useMemo, useRef } from "react";

export type SafeQueryResult<T> = {
  /** Latest successful value. Kept (stale) while the query is erroring. */
  data: T | undefined;
  /** Set when the most recent run failed (e.g. session expired). */
  error: Error | null;
  /** True until the first successful or failed result arrives. */
  isLoading: boolean;
};

/**
 * Non-throwing `useQuery` for editors. Convex's `useQuery` throws on error,
 * which unmounts the whole form (and every unsaved edit) the moment a session
 * expires or a transient error happens. This keeps the last good data on
 * screen and returns the error so the editor can show a banner instead.
 *
 * Pass `"skip"` as args to not run the query.
 */
export function useSafeQuery<Q extends FunctionReference<"query">>(
  query: Q,
  args: Q["_args"] | "skip",
): SafeQueryResult<FunctionReturnType<Q>> {
  const argsKey = args === "skip" ? "skip" : JSON.stringify(args);
  const request = useMemo<RequestForQueries>(
    (): RequestForQueries =>
      args === "skip" ? {} : { q: { query, args: args as Record<string, never> } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, argsKey],
  );
  const results = useQueries(request);
  const raw = results.q as FunctionReturnType<Q> | Error | undefined;

  const lastGood = useRef<{ key: string; value: FunctionReturnType<Q> } | null>(null);
  if (raw !== undefined && !(raw instanceof Error)) {
    lastGood.current = { key: argsKey, value: raw };
  }
  const stale = lastGood.current?.key === argsKey ? lastGood.current.value : undefined;

  if (raw instanceof Error) {
    return { data: stale, error: raw, isLoading: false };
  }
  return { data: raw, error: null, isLoading: args !== "skip" && raw === undefined };
}

export function isAuthError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  return (
    msg.includes("not authenticated") ||
    msg.includes("unauthorized") ||
    msg.includes("admin access required") ||
    msg.includes("super admin access required")
  );
}
