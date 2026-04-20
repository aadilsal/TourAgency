import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/ui/PageContainer";

export function DashboardLoadingSkeleton() {
  return (
    <main className="min-h-[60vh] py-12">
      <PageContainer>
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full max-w-none lg:max-w-[280px]">
            <div className="glass-panel rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <Skeleton className="h-7 w-40 bg-white/10" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-white/10" />
                ))}
              </div>
            </div>
          </aside>

          <section className="flex-1">
            <div className="glass-panel rounded-2xl border border-white/10 bg-slate-950/30 p-6">
              <Skeleton className="h-8 w-52 bg-white/10" />
              <Skeleton className="mt-3 h-4 w-[min(560px,92%)] bg-white/10" />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl bg-white/10" />
                ))}
              </div>
              <div className="mt-8 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl bg-white/10" />
                ))}
              </div>
            </div>
          </section>
        </div>
      </PageContainer>
    </main>
  );
}

