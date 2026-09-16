"use client";

import { usePaginatedQuery_experimental } from "convex/react";
import type {
  PaginatedQueryArgs,
  PaginatedQueryItem,
  PaginatedQueryReference,
} from "convex/react";
import { useRef } from "react";

export type SafePaginatedStatus = "LoadingFirstPage" | "LoadingMore" | "CanLoadMore" | "Exhausted";

export type SafePaginatedResult<T> = {
  results: T[];
  status: SafePaginatedStatus;
  isLoading: boolean;
  loadMore: (numItems: number) => void;
  /** Set when the latest page load failed (e.g. session expired). Results stay on screen. */
  error: Error | null;
};

/**
 * Drop-in, non-throwing replacement for `usePaginatedQuery`.
 *
 * Convex's `usePaginatedQuery` throws on error, which unmounts the whole admin
 * panel — including any open editor dialog and its unsaved text — when a session
 * ends. This keeps the last loaded rows and returns `error` instead, so panels
 * can show `<QueryErrorBanner error={error} />` and nothing typed is lost.
 *
 * Same call signature and return shape (`results`, `status`, `loadMore`) as
 * `usePaginatedQuery`, plus `error`. The Convex API it wraps lives only here.
 */
export function useSafePaginatedQuery<Query extends PaginatedQueryReference>(
  query: Query,
  args: PaginatedQueryArgs<Query> | "skip",
  options: { initialNumItems: number },
): SafePaginatedResult<PaginatedQueryItem<Query>> {
  const r = usePaginatedQuery_experimental({
    query,
    args,
    initialNumItems: options.initialNumItems,
    throwOnError: false,
  });

  const lastGood = useRef<PaginatedQueryItem<Query>[]>([]);
  if (r.status === "success" || (r.status === "pending" && r.data)) {
    lastGood.current = r.data ?? [];
  }

  if (r.status === "error") {
    return {
      results: r.data?.length ? r.data : lastGood.current,
      status: "Exhausted",
      isLoading: false,
      loadMore: r.loadMore,
      error: r.error,
    };
  }
  if (r.status === "pending") {
    const hasData = Boolean(r.data && r.data.length);
    return {
      results: r.data ?? [],
      status: hasData ? "LoadingMore" : "LoadingFirstPage",
      isLoading: true,
      loadMore: r.loadMore,
      error: null,
    };
  }
  return {
    results: r.data,
    status: r.canLoadMore ? "CanLoadMore" : "Exhausted",
    isLoading: false,
    loadMore: r.loadMore,
    error: null,
  };
}
