"use client";

import dynamic from "next/dynamic";

const ScrollyJourneyReel = dynamic(
  () => import("@/components/scrolly/ScrollyJourneyReel").then((m) => m.ScrollyJourneyReel),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="relative lg:pt-24">
            <div className="relative h-[min(70vh,720px)] lg:h-[calc(100vh-8rem)] rounded-3xl border border-white/10 bg-white/5" />
          </div>
          <div className="space-y-6">
            <div className="h-10 w-2/3 rounded-xl bg-white/5" />
            <div className="h-24 rounded-xl bg-white/5" />
            <div className="h-24 rounded-xl bg-white/5" />
            <div className="h-24 rounded-xl bg-white/5" />
          </div>
        </div>
      </div>
    ),
  },
);

export function ScrollyJourneyReelLazy() {
  return <ScrollyJourneyReel />;
}

