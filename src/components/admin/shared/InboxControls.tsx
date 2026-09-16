"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type FilterOption<K extends string> = { id: K; label: string };

/** Status filter pills used at the top of every admin inbox. */
export function InboxFilterTabs<K extends string>({
  options,
  value,
  onChange,
  label = "Status",
  summary,
  className,
}: {
  options: readonly FilterOption<K>[];
  value: K;
  onChange: (next: K) => void;
  label?: string;
  summary?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {options.map((f) => (
        <Button
          key={f.id}
          type="button"
          variant={value === f.id ? "primary" : "secondary"}
          className="!min-h-9 !px-3 !py-1.5 !text-xs"
          aria-pressed={value === f.id}
          onClick={() => onChange(f.id)}
        >
          {f.label}
        </Button>
      ))}
      {summary ? <span className="ml-auto text-sm text-slate-500">{summary}</span> : null}
    </div>
  );
}

/** Loading / empty / "Load more" footer for paginated inbox lists. */
export function LoadMoreFooter({
  status,
  onLoadMore,
  count,
  emptyText,
  noun = "items",
}: {
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  onLoadMore: () => void;
  count: number;
  emptyText: string;
  noun?: string;
}) {
  if (status === "LoadingFirstPage") {
    return <p className="p-4 text-sm text-slate-500">Loading…</p>;
  }
  if (count === 0 && status === "Exhausted") {
    return <p className="p-4 text-sm text-slate-500">{emptyText}</p>;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3">
      <span className="text-xs text-slate-500">
        Showing {count} {noun}
        {status === "Exhausted" ? " (all loaded)" : ""}
      </span>
      {status === "CanLoadMore" || status === "LoadingMore" ? (
        <Button
          type="button"
          variant="secondary"
          className="!min-h-9 !px-3 !py-1.5 !text-xs"
          disabled={status === "LoadingMore"}
          onClick={onLoadMore}
        >
          {status === "LoadingMore" ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}
