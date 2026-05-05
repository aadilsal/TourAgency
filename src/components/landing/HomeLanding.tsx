import Link from "next/link";
import Image from "next/image";
import { Sparkles, ShieldCheck, Users, Zap, Star } from "lucide-react";
import { HeroAiPlanner } from "./HeroAiPlanner";
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
import { ScrollyJourneyReel } from "@/components/scrolly/ScrollyJourneyReel";
import { DESTINATION_DETAILS } from "@/lib/destinations-data";

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

const DESTINATIONS: { name: string; slug: string; blurb: string; image: string }[] = [
  {
    name: "Hunza",
    slug: "hunza",
    blurb: "Rakaposhi views, ancient forts, and cherry blossoms.",
    image: DESTINATION_DETAILS.hunza.heroImage,
  },
  {
    name: "Skardu",
    slug: "skardu",
    blurb: "Gateway to K2 base camp and surreal blue lakes.",
    image: DESTINATION_DETAILS.skardu.heroImage,
  },
  {
    name: "Swat",
    slug: "swat",
    blurb: "Alpine valleys, rivers, and rich heritage.",
    image: DESTINATION_DETAILS.swat.heroImage,
  },
  {
    name: "Naran",
    slug: "naran",
    blurb: "Lake Saif-ul-Malook and the Babusar route.",
    image: DESTINATION_DETAILS.naran.heroImage,
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

export function HomeLanding({ tours, blogPosts, whatsappUrl }: Props) {
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
                  <span className="font-semibold text-white">
                    4.8/5 on Google
                  </span>
                </div>
                <p className="font-medium text-slate-100">500+ happy travelers</p>
                <p className="text-slate-300">Top-rated tours in Pakistan</p>
              </div>
            </div>
          </PageContainer>
        </section>
      </MotionSection>

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
          <ScrollyJourneyReel />
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
                <Card className="h-full border-white/15 bg-white/10 p-8 text-center shadow-lg shadow-black/20">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-sun text-sm font-bold text-brand-primary-dark ring-1 ring-brand-sun/40">
                    {s.step}
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">{s.body}</p>
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
                <div className="flex justify-center text-brand-sun sm:justify-start">
                  <Icon className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <h3 className="mt-4 font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
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
                  <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={d.image}
                      alt={`${d.name} destination`}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      priority={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{d.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted">{d.blurb}</p>
                  <span className="mt-4 text-sm font-semibold text-brand-sun">
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
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Ready to plan your trip?
            </h2>
            <p className="mt-4 text-lg text-muted">
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
