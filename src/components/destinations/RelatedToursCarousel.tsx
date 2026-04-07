"use client";

import { EmblaRow } from "@/components/ui/EmblaRow";
import { TourCardCompact, type TourCardData } from "@/components/shared/TourCard";

export function RelatedToursCarousel({ tours }: { tours: TourCardData[] }) {
  if (tours.length === 0) return null;

  return (
    <section className="mt-16 border-t border-slate-200/80 pt-16">
      <h2 className="text-2xl font-bold text-brand-ink md:text-3xl">
        Related tours
      </h2>
      <p className="mt-2 text-sm text-brand-muted">
        Packages that include this region — swipe to explore.
      </p>
      <div className="mt-8">
        <EmblaRow slideClassName="min-w-0 flex-[0_0_88%] sm:flex-[0_0_55%] lg:flex-[0_0_36%]">
          {tours.map((t) => (
            <TourCardCompact key={t.slug} tour={t} />
          ))}
        </EmblaRow>
      </div>
    </section>
  );
}
