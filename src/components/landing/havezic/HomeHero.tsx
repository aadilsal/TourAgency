"use client";

import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/cn";
import { HomeHeroSearchBar } from "./HomeHeroSearchBar";

type Slide = {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
};

const SLIDES: Slide[] = [
  {
    image:
      "https://demo2wpopal.b-cdn.net/havezic/wp-content/uploads/2024/07/h2_slider1.jpg",
    eyebrow: "CHASE YOUR PASSION",
    title: "Seize The Day And\nMake It Yours",
    subtitle: "Check out the tours below, then get booking today!",
  },
  {
    image:
      "https://demo2wpopal.b-cdn.net/havezic/wp-content/uploads/2024/07/h2_slider2.jpg",
    eyebrow: "EXPLORE PAKISTAN",
    title: "Discover Mountains\nAnd Hidden Valleys",
    subtitle: "Curated routes with clear pricing and quick support.",
  },
  {
    image:
      "https://demo2wpopal.b-cdn.net/havezic/wp-content/uploads/2024/07/h2_slider3.jpg",
    eyebrow: "WEEKLY DEALS",
    title: "Plan Faster.\nTravel Better.",
    subtitle: "Browse popular tours and lock your dates.",
  },
];

export function HomeHero({ className }: { className?: string }) {
  const slides = useMemo(() => SLIDES, []);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 28 });
  const [index, setIndex] = useState(0);

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

          <div className="mt-9">
            <HomeHeroSearchBar />
          </div>

          <div className="mt-7 flex items-center justify-center gap-2">
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

