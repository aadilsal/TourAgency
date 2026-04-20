"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PageContainer } from "@/components/ui/PageContainer";
import { usePlannerWidget } from "@/components/planner/PlannerWidgetContext";
import { useMemo, useState } from "react";

type VibeKey = "mountains" | "culture" | "coastDesert";

const VIBES: Record<
  VibeKey,
  {
    label: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    hero: string;
    stills: [string, string, string];
  }
> = {
  mountains: {
    label: "Mountains",
    eyebrow: "North",
    title: "Pakistan, told as a journey.",
    subtitle: "Hunza mornings, Skardu lakes, and roads worth the detour.",
    hero:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80",
    stills: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80",
    ],
  },
  culture: {
    label: "Culture",
    eyebrow: "Cities & heritage",
    title: "Pakistan, told as a journey.",
    subtitle: "Old streets, warm chai, loud bazaars — the soul of the trip.",
    hero:
      "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=2400&q=80",
    stills: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80",
    ],
  },
  coastDesert: {
    label: "Desert & coast",
    eyebrow: "South & west",
    title: "Pakistan, told as a journey.",
    subtitle: "Makran coastlines, Thar sunsets, and long cinematic roads.",
    hero:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2400&q=80",
    stills: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80",
    ],
  },
};

export function HeroAiPlanner() {
  const reduce = useReducedMotion();
  const { open } = usePlannerWidget();
  const vibeKeys = useMemo(() => Object.keys(VIBES) as VibeKey[], []);
  const [vibe, setVibe] = useState<VibeKey>("mountains");
  const active = VIBES[vibe];

  return (
    <section
      id="ai-planner"
      className="relative isolate min-h-[min(88vh,820px)] overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-brand-primary bg-cover bg-center"
        style={{ backgroundImage: `url(${active.hero})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/95 via-brand-primary/80 to-slate-900/90" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <PageContainer className="relative flex min-h-[min(88vh,820px)] flex-col justify-center py-16 lg:py-24">
        <div className="mx-auto grid max-w-5xl items-center gap-10 text-center text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:text-left">
          <div>
          <motion.p
            className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-accent lg:justify-start"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            JunketTours · {active.eyebrow}
          </motion.p>
          <motion.h1
            className="mt-5 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.15rem] lg:leading-[1.06]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            {active.title}
          </motion.h1>
          <motion.p
            className="mt-6 text-lg leading-relaxed text-white/85"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.12 }}
          >
            {active.subtitle} Private or group. Budget to luxury. Planned around your dates.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
          >
            {vibeKeys.map((k) => {
              const isActive = k === vibe;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setVibe(k)}
                  className={[
                    "rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] backdrop-blur-md transition",
                    isActive
                      ? "border-white/35 bg-white/15 text-white"
                      : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {VIBES[k].label}
                </button>
              );
            })}
          </motion.div>
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
          >
            <button
              type="button"
              onClick={open}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-cta px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/25 transition hover:brightness-110"
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
              href="/ai-planner"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              Full-screen planner →
            </ButtonLink>
          </motion.div>
          </div>

          <motion.div
            className="mx-auto w-full max-w-xl lg:max-w-none"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {active.stills.map((src) => (
                <div
                  key={src}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.04]"
                    style={{ backgroundImage: `url(${src})` }}
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/10" />
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs font-semibold text-white/70 lg:text-left">
              Photo-heavy trips across Pakistan — curated routes, clear pricing, quick support.
            </p>
          </motion.div>
        </div>
      </PageContainer>
    </section>
  );
}
