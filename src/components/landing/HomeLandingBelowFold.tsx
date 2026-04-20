import Link from "next/link";
import { Sparkles, ShieldCheck, Users, Zap } from "lucide-react";
import {
  FeaturedToursCarousel,
  type FeaturedTour,
} from "./FeaturedToursCarousel";
import { TourTypesCarousel } from "./TourTypesCarousel";
import { TestimonialsCarousel } from "./TestimonialsCarousel";
import { PlanByBudgetCarousel } from "./PlanByBudgetCarousel";
import {
  TravelGuidesCarousel,
  type GuideItem,
} from "./TravelGuidesCarousel";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { MotionSection } from "@/components/ui/MotionSection";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";
import { blogCoverImage } from "@/lib/blog-covers";
import { SceneCut } from "@/components/ui/SceneCut";
import { ScrollyJourneyReelLazy } from "./ScrollyJourneyReelLazy";

type BlogPostInput = {
  slug: string;
  title: string;
  metaDescription?: string;
  coverImage: string;
};

type Props = {
  tours: FeaturedTour[];
  blogPosts: BlogPostInput[];
  whatsappUrl: string | null;
};

const DESTINATIONS: { name: string; slug: string; blurb: string }[] = [
  {
    name: "Hunza",
    slug: "hunza",
    blurb: "Rakaposhi views, ancient forts, and cherry blossoms.",
  },
  {
    name: "Skardu",
    slug: "skardu",
    blurb: "Gateway to K2 base camp and surreal blue lakes.",
  },
  {
    name: "Swat",
    slug: "swat",
    blurb: "Alpine valleys, rivers, and rich heritage.",
  },
  {
    name: "Naran",
    slug: "naran",
    blurb: "Lake Saif-ul-Malook and the Babusar route.",
  },
];

const FALLBACK_GUIDES: GuideItem[] = [
  {
    href: "/blog",
    title: "Hunza trip cost guide",
    description: "Budget ranges, transport, and where to save.",
    image: blogCoverImage("hunza-trip-cost-guide"),
  },
  {
    href: "/blog",
    title: "Best time to visit Skardu",
    description: "Seasons, roads, and weather windows.",
    image: blogCoverImage("skardu-best-time"),
  },
  {
    href: "/blog",
    title: "Northern Pakistan packing list",
    description: "Layers, gear, and altitude basics.",
    image: blogCoverImage("packing-list-north"),
  },
];

export function HomeLandingBelowFold({ tours, blogPosts, whatsappUrl }: Props) {
  const fromCms: GuideItem[] = blogPosts.map((p) => ({
    href: `/blog/${p.slug}`,
    title: p.title,
    description: p.metaDescription,
    image: p.coverImage,
  }));
  const guideItems: GuideItem[] = [...fromCms];
  for (const filler of FALLBACK_GUIDES) {
    if (guideItems.length >= 6) break;
    guideItems.push(filler);
  }

  return (
    <>
      <SceneCut />
      <MotionSection className="py-16 md:py-24">
        <PageContainer>
          <SectionHeader
            variant="onDark"
            eyebrow="Story"
            title="A journey that unfolds as you scroll"
            description="Mountains, culture, desert & coast — pick your style (budget to luxury, private or group)."
          />
        </PageContainer>
        <div className="mt-10">
          <ScrollyJourneyReelLazy />
        </div>
      </MotionSection>

      <SceneCut />
      <TourTypesCarousel />
      <FeaturedToursCarousel tours={tours} />

      <SceneCut />
      <MotionSection className="py-16 md:py-24">
        <PageContainer>
          <SectionHeader
            align="center"
            variant="onDark"
            eyebrow="Simple flow"
            title="How it works"
            description="Three steps from idea to booking — AI does the heavy lifting."
          />
          <ol className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Enter your trip details",
                body: "Budget, duration, and departure city — no long forms.",
              },
              {
                step: "2",
                title: "Get an AI-powered itinerary",
                body: "We match our live catalog and suggest the best-fit tours.",
              },
              {
                step: "3",
                title: "Book your trip instantly",
                body: "Reserve online or message us on WhatsApp for confirmation.",
              },
            ].map((s) => (
              <li key={s.step}>
                <Card className="h-full p-8 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                    {s.step}
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-brand-ink">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-brand-muted">{s.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </PageContainer>
      </MotionSection>

      <SceneCut />
      <MotionSection className="py-16 md:py-24">
        <PageContainer>
          <SectionHeader
            align="center"
            variant="onDark"
            title="Why choose JunketTours"
            description="Built for travelers who want clarity, speed, and real local expertise."
          />
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Sparkles,
                title: "AI-powered trip planning",
                text: "Structured matching to real tours — not generic blog fluff.",
              },
              {
                icon: ShieldCheck,
                title: "Verified tour experiences",
                text: "Curated itineraries with clear pricing and inclusions.",
              },
              {
                icon: Users,
                title: "Local travel experts",
                text: "On-the-ground knowledge for roads, seasons, and stays.",
              },
              {
                icon: Zap,
                title: "Fast booking & support",
                text: "Guest checkout and quick responses on WhatsApp.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-6 text-center sm:text-left" hover>
                  <div className="flex justify-center text-brand-accent sm:justify-start">
                    <Icon className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-4 font-bold text-brand-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted">{item.text}</p>
                </Card>
              );
            })}
          </div>
        </PageContainer>
      </MotionSection>

      <SceneCut />
      <MotionSection className="py-16 md:py-24">
        <PageContainer>
          <SectionHeader
            variant="onDark"
            title="Destinations"
            description="Deep-dive guides for the routes travelers book most."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DESTINATIONS.map((d) => (
              <Link key={d.slug} href={`/destinations/${d.slug}`} className="block h-full">
                <Card className="flex h-full flex-col p-6 transition-shadow hover:shadow-card-hover" hover>
                  <h3 className="text-lg font-bold text-brand-ink">{d.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-brand-muted">{d.blurb}</p>
                  <span className="mt-4 text-sm font-semibold text-brand-accent">
                    Explore →
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </PageContainer>
      </MotionSection>

      <SceneCut />
      <TestimonialsCarousel />

      <SceneCut />
      <PlanByBudgetCarousel />

      <SceneCut />
      <MotionSection className="py-20 md:py-28">
        <PageContainer className="max-w-3xl text-center">
          <div className="glass-panel-strong rounded-3xl px-8 py-12 md:px-14 md:py-14">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-brand-ink md:text-4xl">
              Ready to plan your trip?
            </h2>
            <p className="mt-4 text-lg text-brand-muted">
              Start with AI or browse tours — we are one message away.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <ButtonLink
                href="/ai-planner"
                variant="primary"
                className="px-8 py-4 text-base"
              >
                Generate AI plan
              </ButtonLink>
              <ButtonLink
                href="/tours"
                variant="secondary"
                className="px-8 py-4 text-base"
              >
                Browse tours
              </ButtonLink>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-14 w-14 shrink-0 items-center justify-center self-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/25 transition hover:brightness-110 sm:self-auto"
                  aria-label="Chat on WhatsApp"
                >
                  <WhatsAppBrandIcon className="h-8 w-8" />
                </a>
              ) : null}
            </div>
          </div>
        </PageContainer>
      </MotionSection>

      <SceneCut variant="subtle" />
      <TravelGuidesCarousel items={guideItems} />
    </>
  );
}

