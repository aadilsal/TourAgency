"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState, Children } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  /** e.g. min-w-0 flex-[0_0_88%] sm:flex-[0_0_48%] lg:flex-[0_0_32%] */
  slideClassName: string;
  className?: string;
  gapClassName?: string;
  showArrows?: boolean;
};

export function EmblaRow({
  children,
  slideClassName,
  className,
  gapClassName = "pl-4 md:pl-5",
  showArrows = true,
}: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: false,
    slidesToScroll: 1,
    watchDrag: true,
  });
  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(true);

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

  return (
    <div className={cn("relative", className)}>
      <div
        className="embla cursor-grab select-none overflow-hidden active:cursor-grabbing"
        ref={emblaRef}
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
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            aria-label="Previous"
            disabled={prevDisabled}
            onClick={scrollPrev}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand-primary shadow-sm transition hover:bg-brand-surface disabled:opacity-40"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={nextDisabled}
            onClick={scrollNext}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand-primary shadow-sm transition hover:bg-brand-surface disabled:opacity-40"
          >
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}
