import { Star } from "lucide-react";
import { HeroAiPlanner } from "./HeroAiPlanner";
import { PageContainer } from "@/components/ui/PageContainer";
import { MotionSection } from "@/components/ui/MotionSection";
import { SceneCut } from "@/components/ui/SceneCut";

export function HomeLandingAboveFold() {
  return (
    <>
      <HeroAiPlanner />
      <SceneCut variant="subtle" />
      <MotionSection>
        <section className="border-y border-white/10 py-8 md:py-10">
          <PageContainer>
            <div className="glass-panel rounded-2xl border border-white/15 bg-slate-950/40 px-6 py-6 md:px-10">
              <div className="flex flex-wrap items-center justify-center gap-10 text-center md:justify-between md:text-left">
                <div className="flex items-center gap-2">
                  <span className="flex text-amber-400" aria-hidden>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </span>
                  <span className="font-semibold text-white">4.8/5 on Google</span>
                </div>
                <p className="font-medium text-slate-100">500+ happy travelers</p>
                <p className="text-slate-300">Top-rated tours in Pakistan</p>
              </div>
            </div>
          </PageContainer>
        </section>
      </MotionSection>
    </>
  );
}

