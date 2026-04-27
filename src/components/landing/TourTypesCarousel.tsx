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
    <section className="py-10 md:py-14">
      <PageContainer>
        <SectionHeader
          align="left"
          title="Choose Your Travel Style"
        />
        <div className="mt-12 md:mt-16">
          <EmblaRow slideClassName="min-w-0 flex-[0_0_88%] sm:flex-[0_0_72%] md:flex-[0_0_48%] lg:flex-[0_0_38%]">
            {SLIDES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group relative block h-[min(24rem,72vw)] overflow-hidden rounded-3xl bg-black/5 shadow-[0_16px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/10 transition hover:-translate-y-0.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-between p-6">
                  <p className="mt-2 text-lg font-semibold text-white drop-shadow-sm">
                    {s.label}
                  </p>
                  <div className="mb-2 flex h-12 items-center justify-center rounded-full bg-havezic-primary px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(251,91,50,0.35)] ring-1 ring-white/20">
                    Open
                  </div>
                </div>
              </Link>
            ))}
          </EmblaRow>
        </div>
      </PageContainer>
    </section>
  );
}
