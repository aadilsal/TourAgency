import { Skeleton } from "@/components/ui/Skeleton";

export function AdminLoadingSkeleton() {
  return (
    // Renders inside the admin layout's content column, which already has
    // gutters and vertical padding — no extra PageContainer here.
    <div className="min-h-[60vh]" role="status" aria-label="Loading">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-52 bg-slate-200/80" />
            <Skeleton className="h-4 w-72 bg-slate-200/60" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl bg-slate-200/70" />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 rounded-lg bg-slate-200/70" />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
    </div>
  );
}

