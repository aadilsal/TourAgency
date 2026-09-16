import { PageContainer } from "@/components/ui/PageContainer";
import {
  LoadingAnnouncement,
  Skeleton,
  SkeletonText,
} from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

/**
 * Route-level skeletons. Each mirrors the spacing/aspect ratios of the real
 * page (PageContainer gutters, card image heights, grid columns) so content
 * streams in without layout shift, on phones as well as desktop.
 */

/** Dark hero band used by index pages (tours, destinations, guides, blog). */
export function PageHeroSkeleton({ className }: { className?: string }) {
  return (
    <section className={cn("bg-slate-950", className)}>
      <PageContainer className="pb-10 pt-14 md:pb-14 md:pt-20 lg:pb-16">
        <Skeleton tone="dark" className="h-3 w-28 rounded-full" />
        <Skeleton tone="dark" className="mt-4 h-9 w-3/4 max-w-md md:h-12" />
        <SkeletonText tone="dark" lines={2} className="mt-5 max-w-2xl" />
      </PageContainer>
    </section>
  );
}

/** Mirrors `TourCard`: 14rem image, title, meta, price, two stacked buttons. */
export function TourCardSkeleton() {
  return (
    <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-border bg-white">
      <Skeleton className="h-56 rounded-none" />
      <div className="flex flex-1 flex-col p-5">
        <Skeleton className="h-6 w-4/5 rounded-md" />
        <Skeleton className="mt-3 h-4 w-1/2 rounded-md" />
        <Skeleton className="mt-2 h-5 w-1/3 rounded-md" />
        <div className="mt-auto space-y-2 pt-5">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}

/** Generic image + text card (destinations, guides, blog posts). */
export function MediaCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-5">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <SkeletonText lines={2} className="mt-3" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  variant = "media",
  className,
}: {
  count?: number;
  variant?: "media" | "tour";
  className?: string;
}) {
  const Card = variant === "tour" ? TourCardSkeleton : MediaCardSkeleton;
  return (
    <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}

/** Index/listing pages: hero band + filter row + card grid. */
export function ListingPageSkeleton({
  variant = "media",
  label = "Loading…",
}: {
  variant?: "media" | "tour";
  label?: string;
}) {
  return (
    <main className="min-h-screen">
      <LoadingAnnouncement label={label} />
      <PageHeroSkeleton />
      <PageContainer className="pb-20 pt-8 md:pt-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-11 w-full sm:w-40" />
          <Skeleton className="h-11 w-full sm:w-56" />
        </div>
        <CardGridSkeleton variant={variant} />
      </PageContainer>
    </main>
  );
}

/** Tour detail: breadcrumb, title, gallery + facts sidebar, highlights. */
export function TourDetailSkeleton() {
  return (
    <main className="min-h-screen pb-28 lg:pb-16">
      <LoadingAnnouncement label="Loading tour…" />
      <PageContainer className="py-6 md:py-8">
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="mt-4 h-9 w-5/6 max-w-2xl md:h-12" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="min-w-0 lg:col-span-2">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl sm:aspect-[16/9]" />
            <div className="mt-3 flex gap-2 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-24 shrink-0" />
              ))}
            </div>
            <Skeleton className="mt-8 h-6 w-3/4 rounded-md" />
            <SkeletonText lines={5} className="mt-4" />
          </div>
          <div className="rounded-2xl border border-border bg-white p-6">
            <Skeleton className="h-5 w-40 rounded-md" />
            <div className="mt-6 grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-6 h-8 w-32 rounded-md" />
            <Skeleton className="mt-6 h-12 w-full" />
          </div>
        </div>
      </PageContainer>
    </main>
  );
}

/** Long-form article (blog post, guide landing copy). */
export function ArticleSkeleton() {
  return (
    <main className="min-h-screen">
      <LoadingAnnouncement label="Loading article…" />
      <Skeleton className="h-[min(50vh,420px)] w-full rounded-none" />
      <PageContainer className="max-w-3xl py-10 md:py-14">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="mt-4 h-9 w-full md:h-11" />
        <Skeleton className="mt-3 h-9 w-2/3 md:h-11" />
        <SkeletonText lines={4} className="mt-8" />
        <SkeletonText lines={5} className="mt-8" />
        <SkeletonText lines={3} className="mt-8" />
      </PageContainer>
    </main>
  );
}

/** Form-first pages (contact, visa invitation, AI planner). */
export function FormPageSkeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="min-h-screen py-12 md:py-16">
      <LoadingAnnouncement label={label} />
      <PageContainer className="max-w-3xl">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="mt-4 h-9 w-3/4" />
        <SkeletonText lines={2} className="mt-4" />
        <FormCardSkeleton className="mt-10" />
      </PageContainer>
    </main>
  );
}

/** Card of labelled inputs — also used as a `next/dynamic` fallback. */
export function FormCardSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-white p-6 md:p-8", className)}>
      <Skeleton className="h-6 w-48 rounded-md" />
      <SkeletonText lines={2} className="mt-3" />
      <div className="mt-8 space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="mt-2 h-12 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-8 h-12 w-40" />
    </div>
  );
}
