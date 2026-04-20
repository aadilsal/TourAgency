"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/cn";
import { SCROLLY_CHAPTERS } from "./scrollyConfig";
import { ScrollyChapter } from "./ScrollyChapter";
import { RouteStage2D } from "./RouteStage2D";
import { FairyMeadowsStage3D } from "./FairyMeadowsStage3D";
import { ScrollyJourneyReelMobile } from "./ScrollyJourneyReelMobile";

export function ScrollyJourneyReel({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const chapters = useMemo(() => SCROLLY_CHAPTERS, []);
  const [isDesktop, setIsDesktop] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const stageWrapRef = useRef<HTMLDivElement | null>(null);
  const stagePinRef = useRef<HTMLDivElement | null>(null);
  const stage2DRef = useRef<HTMLDivElement | null>(null);
  const stage3DRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia?.("(min-width: 1024px)");
    if (!mq) return;
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    if (!isDesktop) return;
    if (reduce) return;
    if (!rootRef.current || !stageWrapRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const root = rootRef.current!;
      const stageWrap = stageWrapRef.current!;
      const stagePin = stagePinRef.current;

      const scenes = Array.from(
        root.querySelectorAll<HTMLElement>("[data-scrolly-scene]"),
      );
      const route = root.querySelector<SVGPathElement>("[data-route-progress]");
      const title = root.querySelector<HTMLElement>("[data-scrolly-stage-title]");
      const cityMarkers = Array.from(
        root.querySelectorAll<SVGGElement>("[data-city-marker]"),
      );
      const chapterEls = Array.from(
        root.querySelectorAll<HTMLElement>("[data-scrolly-chapter]"),
      );
      const lastChapter = chapterEls[chapterEls.length - 1] ?? null;

      gsap.set(scenes, { opacity: 0 });
      if (scenes[0]) gsap.set(scenes[0], { opacity: 1 });
      if (stage3DRef.current) gsap.set(stage3DRef.current, { opacity: 0 });
      gsap.set(root.querySelectorAll("[data-chapter-inner]"), { opacity: 0.55 });

      const isLg = window.matchMedia?.("(min-width: 1024px)")?.matches ?? false;
      const isMd = window.matchMedia?.("(min-width: 768px)")?.matches ?? false;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stageWrap,
          start: "top top",
          // Tie the pin duration to real content height (chapters),
          // so we don't create "dead scroll" past the last chapter.
          endTrigger: lastChapter ?? stageWrap,
          end: lastChapter ? "bottom bottom" : () => `+=${Math.max(1, chapters.length) * 900}`,
          scrub: true,
          pin: isLg && stagePin ? stagePin : false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      const routeLen = route?.getTotalLength?.() ?? 0;
      if (route && routeLen > 0) {
        gsap.set(route, { strokeDasharray: routeLen, strokeDashoffset: routeLen });
      } else if (route) {
        tl.to(route, { strokeDashoffset: 0 }, 0);
      }

      if (cityMarkers.length) {
        gsap.set(cityMarkers, {
          opacity: 0.55,
          scale: 1,
          transformBox: "fill-box",
          transformOrigin: "center",
        });
      }

      const seg = 1 / Math.max(1, chapters.length - 1);
      chapters.forEach((c, i) => {
        const t = i * seg;
        const scene = scenes.find((n) => n.dataset.sceneId === c.id);
        if (!scene) return;

        tl.to(stage2DRef.current, { ["--scrolly-accent" as never]: c.palette.accent }, t);
        if (title) tl.call(() => (title.textContent = c.eyebrow), [], t);

        tl.to(scenes, { opacity: 0, duration: seg * 0.35 }, t);
        tl.to(scene, { opacity: 1, duration: seg * 0.35 }, t);

        if (route && routeLen > 0) {
          // Reveal route proportionally to chapter progress.
          const n = Math.max(1, chapters.length - 1);
          const p = i / n;
          tl.to(
            route,
            { strokeDashoffset: routeLen * (1 - p), duration: seg * 0.6 },
            t,
          );
        }

        if (cityMarkers.length) {
          const activeMarker = root.querySelector<SVGGElement>(
            `[data-city-marker="${c.id}"]`,
          );
          tl.to(cityMarkers, { opacity: 0.45, scale: 1, duration: seg * 0.18 }, t);
          if (activeMarker) {
            tl.to(
              activeMarker,
              { opacity: 1, scale: 1.25, duration: seg * 0.18 },
              t + seg * 0.05,
            );
          }
        }

        if (c.id === "hunza" && stage3DRef.current) {
          tl.to(stage3DRef.current, { opacity: 1, duration: seg * 0.25 }, t + seg * 0.15);
          if (stage2DRef.current) {
            tl.to(stage2DRef.current, { opacity: 0.25, duration: seg * 0.25 }, t + seg * 0.15);
          }
        }
        if (c.id === "khunjerab" && stage2DRef.current) {
          tl.to(stage2DRef.current, { opacity: 1, duration: seg * 0.2 }, t);
          if (stage3DRef.current) tl.to(stage3DRef.current, { opacity: 0, duration: seg * 0.2 }, t);
        }
      });

      chapterEls.forEach((el) => {
        const inner = el.querySelector<HTMLElement>("[data-chapter-inner]");
        const eyebrow = el.querySelector<HTMLElement>("[data-chapter-eyebrow]");
        const titleEl = el.querySelector<HTMLElement>("[data-chapter-title]");
        const bullets = Array.from(el.querySelectorAll<HTMLElement>("[data-chapter-bullet]"));
        const stats = el.querySelector<HTMLElement>("[data-chapter-stats]");

        if (inner) {
          ScrollTrigger.create({
            trigger: el,
            // Mobile has less vertical room due to the sticky stage,
            // so bias the "active" range slightly lower.
            start: isMd ? "top 65%" : "top 72%",
            end: isMd ? "bottom 35%" : "bottom 28%",
            onEnter: () => {
              gsap.to(inner, { opacity: 1, duration: 0.25, ease: "power2.out" });
              if (eyebrow) gsap.fromTo(eyebrow, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" });
              if (titleEl) gsap.fromTo(titleEl, { y: 16, opacity: 0, filter: "blur(6px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out" });
              if (bullets.length) gsap.fromTo(bullets, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out", stagger: 0.06 });
              if (stats) gsap.fromTo(stats, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out", delay: 0.1 });
            },
            onLeave: () => {
              gsap.to(inner, { opacity: 0.55, duration: 0.2, ease: "power2.out" });
            },
            onEnterBack: () => {
              gsap.to(inner, { opacity: 1, duration: 0.25, ease: "power2.out" });
            },
            onLeaveBack: () => {
              gsap.to(inner, { opacity: 0.55, duration: 0.2, ease: "power2.out" });
            },
          });
        }
      });
    }, rootRef);

    return () => ctx.revert();
  }, [isDesktop, reduce, chapters]);

  if (!isDesktop) {
    return <ScrollyJourneyReelMobile className={className} />;
  }

  return (
    <section
      ref={(node) => {
        rootRef.current = node;
      }}
      className={cn("relative", className)}
      aria-label="Journey reel"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div
            ref={stageWrapRef}
            className="relative lg:pt-24"
          >
            <div
              ref={stagePinRef}
              className="relative h-[min(70vh,720px)] lg:h-[calc(100vh-8rem)]"
            >
              <div
                ref={stage2DRef}
                className="absolute inset-0"
                style={{ ["--scrolly-accent" as never]: chapters[0]?.palette.accent }}
              >
                <RouteStage2D chapters={chapters} className="h-full" />
              </div>
              <div ref={stage3DRef} className="absolute inset-0 hidden lg:block">
                <FairyMeadowsStage3D
                  accent="#FACC15"
                  label="Desert & coast"
                  subtitle="Cinematic roads"
                  className="h-full"
                />
              </div>
            </div>
          </div>

          <div>
            {chapters.map((chapter) => (
              <ScrollyChapter key={chapter.id} chapter={chapter} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

