"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PageContainer } from "@/components/ui/PageContainer";
import { usePlannerWidget } from "@/components/planner/PlannerWidgetContext";

const HERO_BG =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80";

export function HeroAiPlanner() {
  const reduce = useReducedMotion();
  const { open } = usePlannerWidget();

  return (
    <section
      id="ai-planner"
      className="relative isolate min-h-[min(88vh,820px)] overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-brand-primary bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/95 via-brand-primary/80 to-slate-900/90" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <PageContainer className="relative flex min-h-[min(88vh,820px)] flex-col justify-center py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center text-white lg:max-w-3xl">
          <motion.p
            className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-accent"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            JunketTours · Northern Pakistan
          </motion.p>
          <motion.h1
            className="mt-5 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3rem] lg:leading-[1.1]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            Plan Your Perfect Trip to Pakistan in Seconds
          </motion.h1>
          <motion.p
            className="mt-6 text-lg leading-relaxed text-white/85"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.12 }}
          >
            Open the trip assistant — get real tours, a clear itinerary, or a
            custom draft sent to our team. Your chat is saved on this device.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
          >
            <button
              type="button"
              onClick={open}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-cta px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/25 transition hover:brightness-110"
            >
              Open trip assistant
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
      </PageContainer>
    </section>
  );
}
