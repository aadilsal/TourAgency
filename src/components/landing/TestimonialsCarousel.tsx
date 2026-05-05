"use client";

import { EmblaRow } from "@/components/ui/EmblaRow";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";

const ITEMS: {
  name: string;
  text: string;
  rating: number;
  image: string;
}[] = [
  {
    name: "Ayesha K.",
    text: "Itinerary was spot-on for our family — Hunza in 6 days without the usual stress.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Bilal R.",
    text: "Booked through WhatsApp, quick confirmation. Skardu trip exceeded expectations.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Sara & Omar",
    text: "AI planner matched us to a tour that fit our budget. Support was responsive.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  },
];

export function TestimonialsCarousel() {
  return (
    <section className="py-10 md:py-14">
      <PageContainer>
        <SectionHeader
          align="center"
          eyebrow="Verified Google reviews"
          title="Travelers love the experience"
          description="Real feedback from guests who planned and booked with JunketTours."
        />
        <div className="mt-12 md:mt-16">
          <EmblaRow slideClassName="min-w-0 flex-[0_0_92%] sm:flex-[0_0_70%] lg:flex-[0_0_42%]">
            {ITEMS.map((t) => (
              <Card
                key={t.name}
                className="relative h-full min-h-[280px] overflow-hidden p-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/20" />
                <blockquote className="relative flex h-full min-h-[280px] flex-col justify-end p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-havezic-primary text-base font-bold text-white"
                      aria-hidden
                    >
                      {t.name.slice(0, 1)}
                    </div>
                    <div>
                      <cite className="not-italic text-lg font-semibold text-white">
                        {t.name}
                      </cite>
                      <p className="text-sm text-amber-300">
                        {"★".repeat(t.rating)} Google
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-white/95">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </blockquote>
              </Card>
            ))}
          </EmblaRow>
        </div>
      </PageContainer>
    </section>
  );
}
