"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { SCROLLY_CHAPTERS } from "./scrollyConfig";
import { RouteStage2D } from "./RouteStage2D";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function ScrollyJourneyReelMobile({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const chapters = useMemo(() => SCROLLY_CHAPTERS, []);
  const stageWrapRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    skipSnaps: false,
  });

  const active = chapters[clamp(activeIndex, 0, chapters.length - 1)]!;
  const progress =
    chapters.length <= 1 ? 0 : clamp(activeIndex / (chapters.length - 1), 0, 1);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
      setHasInteracted(true);
    };

    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (reduce) return;
    if (!stageWrapRef.current) return;

    const el = stageWrapRef.current;
    const scenes = Array.from(el.querySelectorAll<HTMLElement>("[data-scrolly-scene]"));
    const route = el.querySelector<SVGPathElement>("[data-route-progress]");
    const cityMarkers = Array.from(el.querySelectorAll<SVGGElement>("[data-city-marker]"));

    const ctx = gsap.context(() => {
      if (scenes.length) {
        gsap.to(scenes, { opacity: 0, duration: 0.22, ease: "power2.out" });
        const activeScene = scenes.find((n) => n.dataset.sceneId === active.id);
        if (activeScene) {
          gsap.to(activeScene, { opacity: 1, duration: 0.28, ease: "power2.out" });
        }
      }

      const routeLen = route?.getTotalLength?.() ?? 0;
      if (route && routeLen > 0) {
        gsap.set(route, { strokeDasharray: routeLen });
        gsap.to(route, {
          strokeDashoffset: routeLen * (1 - progress),
          duration: 0.45,
          ease: "power2.out",
        });
      }

      if (cityMarkers.length) {
        gsap.to(cityMarkers, {
          opacity: 0.45,
          scale: 1,
          duration: 0.18,
          ease: "power2.out",
          transformBox: "fill-box",
          transformOrigin: "center",
        });
        const activeMarker = el.querySelector<SVGGElement>(
          `[data-city-marker="${active.id}"]`,
        );
        if (activeMarker) {
          gsap.to(activeMarker, {
            opacity: 1,
            scale: 1.25,
            duration: 0.22,
            ease: "power2.out",
            transformBox: "fill-box",
            transformOrigin: "center",
          });
        }
      }
    }, stageWrapRef);

    return () => ctx.revert();
  }, [active.id, progress, reduce]);

  const onMarkerTap = (chapterId: string) => {
    const idx = chapters.findIndex((c) => c.id === chapterId);
    if (idx < 0) return;
    setHasInteracted(true);
    setActiveIndex(idx);
    emblaApi?.scrollTo(idx);
  };

  return (
    <section className={cn("relative", className)} aria-label="Journey reel">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="sticky top-3 z-10">
            <div className="relative h-[clamp(220px,32vh,320px)]">
              <div
                ref={stageWrapRef}
                className="absolute inset-0"
                style={{ ["--scrolly-accent" as never]: active.palette.accent }}
              >
                <RouteStage2D
                  chapters={chapters}
                  className="h-full"
                  interactiveMarkers
                  showPerks={false}
                  activeChapterId={active.id}
                  progress={progress}
                  enablePanZoom
                  onMarkerTap={onMarkerTap}
                />
              </div>

              <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-3">
                <div className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
                  {activeIndex + 1}/{chapters.length} · {active.mapPoint.label}
                </div>
                <div className="flex items-center gap-1.5">
                  {chapters.map((c, i) => (
                    <span
                      key={c.id}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full transition",
                        i === activeIndex ? "bg-white/85" : "bg-white/25",
                      )}
                      aria-hidden
                    />
                  ))}
                </div>
              </div>

              {!hasInteracted ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center">
                  <div className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white/75 backdrop-blur">
                    Swipe to explore
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex touch-pan-y">
                {chapters.map((c) => {
                  const bullets = c.bullets.slice(0, 2);
                  return (
                    <div
                      key={c.id}
                      className="min-w-0 flex-[0_0_88%] pr-4 sm:flex-[0_0_70%]"
                    >
                      <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                        <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-white/60">
                          {c.eyebrow}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {c.title}
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
                          {bullets.map((b) => (
                            <li key={b} className="flex gap-2">
                              <span
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/60"
                                aria-hidden
                              />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                        {c.stats?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {c.stats.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-semibold text-white/70"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

