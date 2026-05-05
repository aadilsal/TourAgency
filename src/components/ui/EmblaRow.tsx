"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState, Children } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  /** e.g. min-w-0 flex-[0_0_88%] sm:flex-[0_0_48%] lg:flex-[0_0_32%] */
  slideClassName: string;
  className?: string;
  gapClassName?: string;
  showArrows?: boolean;
  autoplayMs?: number;
  loop?: boolean;
  arrowsClassName?: string;
  arrowButtonClassName?: string;
};

export function EmblaRow({
  children,
  slideClassName,
  className,
  gapClassName = "pl-4 md:pl-5",
  showArrows = true,
  autoplayMs = 0,
  loop = false,
  arrowsClassName,
  arrowButtonClassName,
}: Props) {
  const reduce = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop,
    dragFree: false,
    slidesToScroll: 1,
    watchDrag: true,
  });
  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setPrevDisabled(!emblaApi.canScrollPrev());
      setNextDisabled(!emblaApi.canScrollNext());
    };
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("reInit", onSelect);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const slides = Children.toArray(children);

  useEffect(() => {
    if (!emblaApi) return;
    if (reduce) return;
    if (autoplayMs <= 0) return;
    if (slides.length <= 1) return;
    if (isPaused) return;

    const id = window.setInterval(() => {
      if (!emblaApi) return;
      if (emblaApi.canScrollNext()) emblaApi.scrollNext();
      else emblaApi.scrollTo(0);
    }, autoplayMs);

    return () => window.clearInterval(id);
  }, [autoplayMs, emblaApi, isPaused, reduce, slides.length]);

  return (
    <div className={cn("relative", className)}>
      <div
        className="embla cursor-grab select-none overflow-hidden active:cursor-grabbing"
        ref={emblaRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
      >
        <div className="embla__container -ml-4 md:-ml-5">
          {slides.map((child, i) => (
            <div
              key={i}
              className={cn("embla__slide", slideClassName, gapClassName)}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      {showArrows ? (
        <div className={cn("mt-6 flex justify-end gap-2", arrowsClassName)}>
          <button
            type="button"
            aria-label="Previous"
            disabled={prevDisabled}
            onClick={scrollPrev}
            className={cn(
              "rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-havezic-background-light disabled:opacity-40",
              arrowButtonClassName,
            )}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={nextDisabled}
            onClick={scrollNext}
            className={cn(
              "rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-havezic-background-light disabled:opacity-40",
              arrowButtonClassName,
            )}
          >
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}
