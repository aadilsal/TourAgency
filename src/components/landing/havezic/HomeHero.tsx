"use client";

import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { usePlannerWidget } from "@/components/planner/PlannerWidgetContext";

type Slide = {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  featuredGuide?: { label: string; href: string };
};

const SLIDES: Slide[] = [
  {
    image: "/images/marketing/hero-heritage.jpg",
    alt: "Red sandstone gateway and minaret of the Badshahi Mosque courtyard in Lahore under a cloudy sky",
    eyebrow: "HERITAGE & HISTORY",
    title: "Walk Through Centuries\nOf Pakistan",
    subtitle:
      "Mughal cities, ancient forts, and living traditions — curated routes with clear pricing.",
    featuredGuide: { label: "Explore Punjab guide", href: "/guides/punjab" },
  },
  {
    image: "/images/marketing/hero-northern-heritage.jpg",
    alt: "Snow-capped mountain range above a braided river valley and pine forest",
    eyebrow: "NORTHERN HERITAGE",
    title: "Valley Forts, Karakoram Views\n& Living Traditions",
    subtitle:
      "Baltit & Altit forts, Swat Gandhara, and northern valley culture — not just the peaks.",
    featuredGuide: {
      label: "Explore Gilgit-Baltistan",
      href: "/guides/gilgit-baltistan",
    },
  },
  {
    image: "/images/marketing/hero-plan-ai.jpg",
    alt: "Tiered temple tower among pine trees at sunset",
    eyebrow: "PLAN WITH AI",
    title: "Your Story,\nDay by Day",
    subtitle: "Browse heritage tours and lock your dates — or let AI draft your route.",
  },
];

type Props = {
  className?: string;
};

export function HomeHero({ className }: Props) {
  const slides = useMemo(() => SLIDES, []);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 28 });
  const [index, setIndex] = useState(0);
  const { open: openPlanner } = usePlannerWidget();

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const id = window.setInterval(() => emblaApi.scrollNext(), 5500);
    return () => window.clearInterval(id);
  }, [emblaApi]);

  const active = slides[index % slides.length]!;

  return (
    <section className={cn("relative", className)} aria-label="Hero">
      <div ref={emblaRef} className="relative overflow-hidden">
        <div className="flex">
          {slides.map((s) => (
            <div key={s.image} className="min-w-0 flex-[0_0_100%]">
              <div className="relative h-[540px] sm:h-[520px] md:h-[640px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt={s.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/45" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/55" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto mx-auto w-full max-w-5xl px-4 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            {active.eyebrow}
          </p>
          <h1 className="mt-4 whitespace-pre-line text-balance text-[2rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            {active.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-white/85 md:text-lg">
            {active.subtitle}
          </p>

          <div className="mx-auto mt-8 flex max-w-xs flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center md:mt-9">
            <button
              type="button"
              onClick={openPlanner}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-cta px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/25 transition hover:brightness-110"
            >
              Get my itinerary
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <ButtonLink
              href="/tours"
              variant="secondary"
              className="border-white/40 bg-white/10 py-3.5 text-white backdrop-blur-md hover:bg-white/20"
            >
              Browse tours
            </ButtonLink>
          </div>

          <p className="mt-5 text-xs font-medium text-white/65">
            Heritage routes · Clear pricing · Licensed operator
          </p>

          <div className="mt-3 flex items-center justify-center">
            {slides.map((_, i) => (
              // 44px hit area around an 8px visual dot.
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className="group inline-flex h-11 w-11 items-center justify-center"
                onClick={() => emblaApi?.scrollTo(i)}
              >
                <span
                  className={cn(
                    "h-2 rounded-full border border-white/45 transition-all",
                    i === index ? "w-6 bg-white" : "w-2 bg-white/10 group-hover:bg-white/30",
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
