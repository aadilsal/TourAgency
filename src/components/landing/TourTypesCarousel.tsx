"use client";

import Link from "next/link";
import { EmblaRow } from "@/components/ui/EmblaRow";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";

const SLIDES: { label: string; href: string; image: string }[] = [
  {
    label: "Family tours",
    href: "/tours?type=family",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Honeymoon trips",
    href: "/tours?type=honeymoon",
    image:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Adventure tours",
    href: "/tours?type=adventure",
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Corporate trips",
    href: "/tours?type=corporate",
    image:
      "https://images.unsplash.com/photo-1540575467063-27a04d016fca?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Budget tours",
    href: "/tours?type=budget",
    image:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
  },
];

export function TourTypesCarousel() {
  return (
    <section className="border-y border-white/10 py-16 md:py-24">
      <PageContainer>
        <SectionHeader
          align="center"
          variant="onDark"
          eyebrow="Browse by style"
          title="Types of tours"
          description="Swipe through styles — each opens matching packages. Real photos, real routes."
        />
        <div className="mt-12 md:mt-16">
          <EmblaRow slideClassName="min-w-0 flex-[0_0_88%] sm:flex-[0_0_72%] md:flex-[0_0_48%] lg:flex-[0_0_38%]">
            {SLIDES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group relative block h-[min(22rem,65vw)] overflow-hidden rounded-2xl border border-white/15 shadow-glass transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/40 to-brand-primary/10" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                  <h3 className="text-2xl font-bold text-white md:text-3xl">
                    {s.label}
                  </h3>
                  <span className="mt-2 inline-flex text-sm font-semibold text-brand-accent">
                    Explore packages →
                  </span>
                </div>
              </Link>
            ))}
          </EmblaRow>
        </div>
      </PageContainer>
    </section>
  );
}
