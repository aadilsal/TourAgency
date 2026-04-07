"use client";

import { EmblaRow } from "@/components/ui/EmblaRow";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TourCard } from "@/components/shared/TourCard";

export type FeaturedTour = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  types?: string[];
  price: number;
  durationDays: number;
  location: string;
  images: string[];
};

type Props = { tours: FeaturedTour[] };

export function FeaturedToursCarousel({ tours }: Props) {
  if (tours.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <PageContainer>
        <SectionHeader
          variant="onDark"
          eyebrow="Featured"
          title="Hand-picked tours"
          description="Limited slots on peak dates — swipe to explore packages with live pricing."
        />
        <div className="mt-12 md:mt-16">
          <EmblaRow slideClassName="min-w-0 flex-[0_0_90%] sm:flex-[0_0_55%] lg:flex-[0_0_36%] xl:flex-[0_0_32%]">
            {tours.map((t, i) => (
              <TourCard
                key={t._id}
                tour={t}
                badge={
                  i % 3 === 0
                    ? "Most popular"
                    : i % 3 === 1
                      ? "Limited slots"
                      : "Best value"
                }
              />
            ))}
          </EmblaRow>
        </div>
      </PageContainer>
    </section>
  );
}
