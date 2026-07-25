"use client";

import Link from "next/link";
import Image from "next/image";
import { EmblaRow } from "@/components/ui/EmblaRow";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";

const SLIDES: { label: string; href: string; image: string }[] = [
  {
    label: "Heritage tours",
    href: "/tours?type=culture",
    image: "/images/marketing/tour-type-heritage.jpg",
  },
  {
    label: "Family tours",
    href: "/tours?type=family",
    image: "/images/marketing/tour-type-family.jpg",
  },
  {
    label: "Honeymoon trips",
    href: "/tours?type=honeymoon",
    image: "/images/marketing/tour-type-honeymoon.jpg",
  },
  {
    label: "Adventure tours",
    href: "/tours?type=adventure",
    image: "/images/marketing/tour-type-adventure.jpg",
  },
  {
    label: "Corporate trips",
    href: "/tours?type=corporate",
    image: "/images/marketing/tour-type-corporate.jpg",
  },
  {
    label: "Budget tours",
    href: "/tours?type=budget",
    image: "/images/marketing/tour-type-budget.jpg",
  },
];

export function TourTypesCarousel() {
  return (
    <section className="py-8 md:py-12">
      <PageContainer>
        <SectionHeader
          align="left"
          title="Choose Your Travel Style"
        />
        <div className="mt-6 md:mt-8">
          <EmblaRow slideClassName="min-w-0 flex-[0_0_62%] sm:flex-[0_0_42%] md:flex-[0_0_32%] lg:flex-[0_0_25%]">
            {SLIDES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group relative block h-[min(15rem,52vw)] overflow-hidden rounded-2xl bg-black/5 shadow-[0_10px_28px_rgba(0,0,0,0.12)] ring-1 ring-black/10 transition hover:-translate-y-0.5"
              >
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 42vw, 62vw"
                  className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4">
                  <p className="text-base font-semibold text-white drop-shadow-sm">
                    {s.label}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition group-hover:bg-havezic-primary">
                    Explore →
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
