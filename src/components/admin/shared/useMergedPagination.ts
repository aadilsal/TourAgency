"use client";

import { useMemo } from "react";

type PaginationStatus = "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";

export type PaginatedSource<T> = {
  results: T[];
  status: PaginationStatus;
  loadMore: (numItems: number) => void;
};

/**
 * Merge several independently paginated, newest-first Convex streams (e.g.
 * guest requests + member bookings) into one correctly ordered list.
 *
 * Rows older than the oldest loaded row of any stream that still has more
 * pages are held back until that stream loads further — otherwise the merged
 * list could skip rows that belong in between.
 */
export function useMergedPagination<T>(
  sources: PaginatedSource<T>[],
  getTime: (row: T) => number,
  pageSize: number,
) {
  return useMemo(() => {
    const anyLoadingFirst = sources.some((s) => s.status === "LoadingFirstPage");
    const all = sources.flatMap((s) => s.results);
    all.sort((a, b) => getTime(b) - getTime(a));

    let horizon = -Infinity;
    for (const s of sources) {
      if (s.status === "Exhausted") continue;
      if (s.results.length === 0) {
        horizon = Infinity;
        continue;
      }
      const oldest = Math.min(...s.results.map(getTime));
      horizon = Math.max(horizon, oldest);
    }
    const results = all.filter((r) => getTime(r) >= horizon);

    let status: PaginationStatus;
    if (anyLoadingFirst) status = "LoadingFirstPage";
    else if (sources.some((s) => s.status === "LoadingMore")) status = "LoadingMore";
    else if (sources.some((s) => s.status === "CanLoadMore")) status = "CanLoadMore";
    else status = "Exhausted";

    const loadMore = () => {
      for (const s of sources) {
        if (s.status === "CanLoadMore") s.loadMore(pageSize);
      }
    };

    return { results, status, loadMore };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...sources.flatMap((s) => [s.results, s.status]), pageSize]);
}
