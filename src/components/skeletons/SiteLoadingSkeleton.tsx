import { Skeleton } from "@/components/ui/Skeleton";
import { SceneCut } from "@/components/ui/SceneCut";
import { PageContainer } from "@/components/ui/PageContainer";

export function SiteLoadingSkeleton() {
  return (
    <main className="min-h-screen">
      <section className="relative isolate min-h-[min(88vh,820px)] overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/70 via-slate-950/60 to-black/70" />
        <PageContainer className="relative flex min-h-[min(88vh,820px)] flex-col justify-center py-16 lg:py-24">
          <div className="mx-auto w-full max-w-2xl text-center lg:max-w-3xl">
            <Skeleton className="mx-auto h-4 w-56 rounded-full bg-white/10" />
            <Skeleton className="mx-auto mt-6 h-12 w-[min(680px,92%)]" />
            <Skeleton className="mx-auto mt-4 h-12 w-[min(560px,86%)]" />
            <Skeleton className="mx-auto mt-8 h-5 w-[min(720px,92%)] bg-white/10" />
            <Skeleton className="mx-auto mt-3 h-5 w-[min(610px,84%)] bg-white/10" />
            <div className="mx-auto mt-10 flex max-w-md flex-wrap justify-center gap-3">
              <Skeleton className="h-12 w-44 rounded-xl bg-white/15" />
              <Skeleton className="h-12 w-36 rounded-xl bg-white/10" />
              <Skeleton className="h-12 w-40 rounded-xl bg-white/10" />
            </div>
          </div>
        </PageContainer>
      </section>

      <SceneCut variant="subtle" />

      <section className="py-10 md:py-12">
        <PageContainer>
          <div className="glass-panel rounded-2xl border border-white/10 bg-slate-950/30 px-6 py-6 md:px-10">
            <div className="flex flex-wrap items-center justify-center gap-8 text-center md:justify-between md:text-left">
              <Skeleton className="h-5 w-44 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-40 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-48 rounded-full bg-white/10" />
            </div>
          </div>
        </PageContainer>
      </section>

      <SceneCut />

      <section className="py-14 md:py-16">
        <PageContainer>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-28 rounded-2xl bg-white/10 md:h-32"
              />
            ))}
          </div>
        </PageContainer>
      </section>

      <SceneCut />

      <section className="py-14 md:py-16">
        <PageContainer>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-72 rounded-2xl bg-white/10"
              />
            ))}
          </div>
        </PageContainer>
      </section>
    </main>
  );
}

