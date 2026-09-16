import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { MotionSection } from "@/components/ui/MotionSection";
import { FormCardSkeleton } from "@/components/skeletons/PageSkeletons";

const AiPlannerPageClient = dynamic(
  () =>
    import("@/components/AiPlannerPageClient").then((m) => ({
      default: m.AiPlannerPageClient,
    })),
  {
    loading: () => <FormCardSkeleton fields={4} />,
    ssr: false,
  },
);

export const metadata: Metadata = buildMetadata({
  title: "AI Pakistan Trip Planner",
  description:
    "Describe your dates, budget and interests and get a draft Pakistan itinerary in seconds — heritage cities, ancient sites and northern valleys, refined by local experts.",
  path: "/ai-planner",
});

export default function AiPlannerPage() {
  return (
    <main className="min-h-screen py-12 md:py-16 lg:py-20">
      <PageContainer className="max-w-6xl">
        <MotionSection>
          <header className="mx-auto max-w-3xl text-center">
            <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-havezic-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
              AI concierge
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Plan Your Trip with AI
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
              Heritage cities, ancient sites, or northern valley culture — add
              your budget, duration, and departure city. Try: &ldquo;Lahore
              heritage weekend&rdquo;, &ldquo;Hunza forts &amp; valley
              culture&rdquo;, or &ldquo;Swat Buddhist sites&rdquo;.
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
