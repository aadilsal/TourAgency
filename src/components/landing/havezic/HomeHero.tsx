"use client";

import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { usePlannerWidget } from "@/components/planner/PlannerWidgetContext";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";

type Slide = {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  featuredGuide?: { label: string; href: string };
};

const SLIDES: Slide[] = [
  {
    image:
      "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=2400&q=80",
    eyebrow: "HERITAGE & HISTORY",
    title: "Walk Through Centuries\nOf Pakistan",
    subtitle:
      "Mughal cities, ancient forts, and living traditions — curated routes with clear pricing.",
    featuredGuide: { label: "Explore Punjab guide", href: "/guides/punjab" },
  },
  {
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=80",
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
    image:
      "https://demo2wpopal.b-cdn.net/havezic/wp-content/uploads/2024/07/h2_slider3.jpg",
    eyebrow: "PLAN WITH AI",
    title: "Your Story,\nDay by Day",
    subtitle: "Browse heritage tours and lock your dates — or let AI draft your route.",
  },
];

type Props = {
  className?: string;
  whatsappUrl?: string | null;
};

export function HomeHero({ className, whatsappUrl = null }: Props) {
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
  const featuredGuide = active.featuredGuide ?? {
    label: "Explore provinces",
    href: "/guides",
  };

  return (
    <section className={cn("relative", className)} aria-label="Hero">
      <div ref={emblaRef} className="relative overflow-hidden">
        <div className="flex">
          {slides.map((s) => (
            <div key={s.image} className="min-w-0 flex-[0_0_100%]">
              <div className="relative h-[520px] md:h-[640px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
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
          <h1 className="mt-4 whitespace-pre-line text-4xl font-semibold leading-[1.06] tracking-tight md:text-6xl">
            {active.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-white/85 md:text-lg">
            {active.subtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
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
            <ButtonLink
              href={featuredGuide.href}
              variant="secondary"
              className="border-white/40 bg-white/10 py-3.5 text-white backdrop-blur-md hover:bg-white/20"
            >
              {featuredGuide.label}
            </ButtonLink>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
              >
                <WhatsAppBrandIcon className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            ) : null}
          </div>

          <p className="mt-5 text-xs font-medium text-white/65">
            Heritage routes · Clear pricing · Licensed operator
          </p>

          <div className="mt-6 flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  "h-2 w-2 rounded-full border border-white/45 transition",
                  i === index ? "bg-white" : "bg-white/10 hover:bg-white/30",
                )}
                onClick={() => emblaApi?.scrollTo(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
