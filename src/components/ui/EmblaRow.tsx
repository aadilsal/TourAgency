"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState, Children } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** 44px square arrow buttons (WCAG 2.5.8 / Apple HIG touch target). */
const arrowBase =
  "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-foreground shadow-sm transition hover:bg-havezic-background-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-havezic-primary disabled:cursor-not-allowed disabled:opacity-40";

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
  /** Used in arrow labels, e.g. "Next slide" / "Next tour". */
  itemLabel?: string;
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
  itemLabel = "slide",
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
            aria-label={`Previous ${itemLabel}`}
            disabled={prevDisabled}
            onClick={scrollPrev}
            className={cn(arrowBase, arrowButtonClassName)}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Next ${itemLabel}`}
            disabled={nextDisabled}
            onClick={scrollNext}
            className={cn(arrowBase, arrowButtonClassName)}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
