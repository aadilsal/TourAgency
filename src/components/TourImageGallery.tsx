"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

type Props = {
  images: string[];
  title: string;
};

export function TourImageGallery({ images, title }: Props) {
  const reduce = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: images.length > 1,
    align: "start",
    dragFree: false,
  });
  const [selected, setSelected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const imagesKey = useMemo(() => images.join("\0"), [images]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    emblaApi.scrollTo(0, true);
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi, imagesKey]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    if (reduce) return;
    if (isPaused) return;
    if (images.length <= 1) return;

    const id = window.setInterval(() => {
      emblaApi.scrollNext();
    }, 2000);

    return () => window.clearInterval(id);
  }, [emblaApi, images.length, isPaused, reduce]);

  const scrollTo = useCallback(
    (i: number) => {
      emblaApi?.scrollTo(i);
    },
    [emblaApi],
  );

  if (images.length === 0) {
    return (
      <section aria-label={`${title} photo gallery`}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-xl font-semibold text-white md:text-2xl">
            Photo gallery
          </h2>
        </div>
        <div className="aspect-[21/9] w-full rounded-2xl bg-gradient-to-br from-brand-primary/25 via-brand-accent/20 to-brand-primary/10 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] ring-1 ring-white/20" />
      </section>
    );
  }

  const photoLabel =
    images.length === 1 ? "1 photo" : `${images.length} photos`;

  return (
    <section
      className="space-y-4"
      aria-label={`${title} photo gallery`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-xl font-semibold text-white md:text-2xl">
          Photo gallery
        </h2>
        <p className="text-sm font-medium text-white/75">{photoLabel}</p>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing photo {selected + 1} of {images.length}
      </p>

      <div
        className="overflow-hidden rounded-2xl shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] ring-1 ring-white/25"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} images`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
      >
        <div
          className="embla cursor-grab overflow-hidden active:cursor-grabbing"
          ref={emblaRef}
        >
          <div className="embla__container">
            {images.map((src, i) => (
              <div
                key={`${i}-${src}`}
                className="embla__slide min-w-0 flex-[0_0_100%] pl-0"
              >
                <div className="relative aspect-[4/3] min-h-[220px] bg-slate-200 sm:aspect-[21/9] md:min-h-[280px] md:aspect-[2.35/1]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${title} — photo ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-slate-900/10" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/20 bg-white/95 backdrop-blur-md">
        {images.length > 1 ? (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
            <button
              type="button"
              aria-label="Previous image"
              className="shrink-0 rounded-xl p-2.5 text-brand-primary transition hover:bg-brand-surface"
              onClick={() => emblaApi?.scrollPrev()}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 justify-center gap-1.5 sm:gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === selected ? "true" : undefined}
                  onClick={() => scrollTo(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === selected
                      ? "w-8 bg-brand-cta"
                      : "w-2 bg-slate-300 hover:bg-slate-400",
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next image"
              className="shrink-0 rounded-xl p-2.5 text-brand-primary transition hover:bg-brand-surface"
              onClick={() => emblaApi?.scrollNext()}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        {images.length > 1 ? (
          <div className="border-t border-slate-200/80 px-2 pb-3 pt-2 sm:px-3">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {images.map((src, i) => (
                <button
                  key={`thumb-${i}-${src}`}
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === selected ? "true" : undefined}
                  onClick={() => scrollTo(i)}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-white transition sm:h-16 sm:w-24",
                    i === selected
                      ? "ring-brand-cta opacity-100"
                      : "ring-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center border-t border-slate-200/80 px-4 py-3 text-center text-sm text-brand-muted">
            Every uploaded photo for this tour is shown in the gallery above.
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
