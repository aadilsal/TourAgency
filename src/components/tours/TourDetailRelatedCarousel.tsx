"use client";

import { EmblaRow } from "@/components/ui/EmblaRow";
import { TourCard, type TourCardData } from "@/components/shared/TourCard";
import { useCurrency } from "@/hooks/useCurrency";
import type { CurrencyCode } from "@/lib/money";

type Props = {
  tours: TourCardData[];
  currentSlug: string;
  initialCurrency?: CurrencyCode;
};

export function TourDetailRelatedCarousel({ tours, currentSlug, initialCurrency }: Props) {
  const currency = useCurrency(initialCurrency);
  const list = tours.filter((t) => t.slug !== currentSlug).slice(0, 8);
  if (list.length === 0) return null;

  return (
    <section className="mt-12 md:mt-14">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-accent">
            Keep exploring
          </p>
          <h2 className="mt-1 text-2xl font-bold text-brand-ink">
            More tours you may like
          </h2>
        </div>
      </div>
      <EmblaRow slideClassName="min-w-0 flex-[0_0_88%] sm:flex-[0_0_52%] lg:flex-[0_0_38%] xl:flex-[0_0_34%]">
        {list.map((t, i) => (
          <TourCard
            key={t.slug}
            tour={t}
            currency={currency}
            badge={
              i % 3 === 0
                ? "Popular"
                : i % 3 === 1
                  ? "Limited slots"
                  : "Best value"
            }
          />
        ))}
      </EmblaRow>
    </section>
  );
}
