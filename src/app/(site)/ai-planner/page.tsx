import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { MotionSection } from "@/components/ui/MotionSection";
import { PageLoadingSpinner } from "@/components/ui/PageLoadingSpinner";

const AiPlannerPageClient = dynamic(
  () =>
    import("@/components/AiPlannerPageClient").then((m) => ({
      default: m.AiPlannerPageClient,
    })),
  {
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <PageLoadingSpinner label="Loading planner…" variant="dark" />
      </div>
    ),
    ssr: false,
  },
);

export const metadata: Metadata = {
  title: "AI trip planner",
  description:
    "Plan your northern Pakistan trip with AI — structured inputs, day-by-day outline, and real tours from our catalog.",
};

export default function AiPlannerPage() {
  return (
    <main className="min-h-screen py-12 md:py-16 lg:py-20">
      <PageContainer className="max-w-6xl">
        <MotionSection>
          <header className="mx-auto max-w-3xl text-center">
            <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-accent">
              <Sparkles className="h-4 w-4" aria-hidden />
              AI concierge
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Plan Your Trip with AI
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-300 md:text-lg">
              Add your budget, how long you can travel, where you&apos;re leaving
              from, and what you love — we generate a tailored outline, match
              live packages, and let you book or save the plan.
            </p>
          </header>
        </MotionSection>

        <div className="mt-12 md:mt-14">
          <AiPlannerPageClient />
        </div>
      </PageContainer>
    </main>
  );
}
