import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Best tour operators in Pakistan",
  description:
    "How to evaluate tour operators in Pakistan — what to ask, common red flags, and how JunketTours runs northern Pakistan trips with clear itineraries and support.",
  alternates: { canonical: "/best-tour-operators-in-pakistan" },
  openGraph: {
    title: "Best tour operators in Pakistan | JunketTours",
    description:
      "A buyer’s guide to Pakistan tour operators: pricing clarity, routing, hotels, safety, and support — plus how to book tours with JunketTours.",
    url: `${getSiteUrl()}/best-tour-operators-in-pakistan`,
    type: "article",
  },
};

const faqs = [
  {
    q: "What questions should I ask a tour operator in Pakistan?",
    a: "Ask for a detailed itinerary, hotel category, transport type, cancellation policy, inclusions/exclusions, and how they handle delays due to weather or road closures.",
  },
  {
    q: "What are common red flags?",
    a: "Vague itineraries, unclear pricing, no written policies, unwillingness to share inclusions/exclusions, or slow/unreliable communication before booking.",
  },
  {
    q: "Do you offer northern Pakistan group tours and private tours?",
    a: "JunketTours offers tour packages for northern Pakistan and can help with custom planning. Browse tours or contact us to match dates and style.",
  },
];

export default function BestTourOperatorsPakistanPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="min-h-screen py-14 md:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Best tour operators in Pakistan", path: "/best-tour-operators-in-pakistan" },
        ]}
      />
      <PageContainer className="max-w-4xl">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-havezic-primary">
            Booking guide
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Best tour operators in Pakistan (questions, red flags, and booking tips)
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
            “Best tour operator” should mean you get a realistic itinerary, predictable costs, and
            dependable support during the trip. Use this checklist to compare operators — then
            browse ready-to-book tours on JunketTours.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/tours" variant="primary" className="py-3">
              View tours
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="secondary"
              className="border-white/35 bg-white/10 py-3 text-white hover:bg-white/20"
            >
              Get a custom quote
            </ButtonLink>
          </div>
        </header>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">The 5 things to compare</h2>
            <ol className="mt-4 list-inside list-decimal space-y-2 text-sm leading-relaxed text-muted">
              <li>Itinerary clarity (day-by-day, travel times, stay locations)</li>
              <li>Pricing transparency (what’s included vs extra)</li>
              <li>Accommodation + transport standards</li>
              <li>Safety-first routing and fallback plans</li>
              <li>Responsiveness (WhatsApp/phone) and written policies</li>
            </ol>
          </Card>
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">How JunketTours operates</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              We focus on northern Pakistan tours (Hunza, Skardu, Swat and more) with a catalog you
              can browse and book. If you’re unsure what fits, message us — we’ll recommend the best
              option for your dates and budget.
            </p>
            <p className="mt-4 text-sm text-muted">
              Start with destinations like{" "}
              <Link href="/destinations/hunza" className="font-semibold text-havezic-primary underline">
                Hunza
              </Link>{" "}
              and{" "}
              <Link href="/destinations/skardu" className="font-semibold text-havezic-primary underline">
                Skardu
              </Link>
              .
            </p>
          </Card>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
            Red flags that cost you money (and time)
          </h2>
          <div className="mt-6 grid gap-4">
            <Card className="p-6 md:p-8">
              <h3 className="text-base font-bold text-foreground">Vague itineraries</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                If the plan is just “visit places”, you don’t know what you’re paying for. Ask for
                distances, routes, and where you stay each night.
              </p>
            </Card>
            <Card className="p-6 md:p-8">
              <h3 className="text-base font-bold text-foreground">Unclear inclusions/exclusions</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Many disputes happen because costs weren’t scoped. Make sure meals, tickets, hotel
                type, and transport are clearly listed.
              </p>
            </Card>
            <Card className="p-6 md:p-8">
              <h3 className="text-base font-bold text-foreground">No support plan</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                In mountain regions, delays happen. Good operators communicate and adapt without
                breaking the trip’s core experience.
              </p>
            </Card>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
            Book a northern Pakistan tour
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Browse tours by destination, compare durations and prices, and book — or use the AI
            planner to generate an outline we can match to live packages.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/tours" variant="primary" className="py-3">
              Browse tours
            </ButtonLink>
            <ButtonLink
              href="/ai-planner"
              variant="secondary"
              className="border-white/35 bg-white/10 py-3 text-white hover:bg-white/20"
            >
              Use AI planner
            </ButtonLink>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">FAQ</h2>
          <div className="mt-6 grid gap-4">
            {faqs.map((f) => (
              <Card key={f.q} className="p-6 md:p-8">
                <h3 className="text-base font-bold text-foreground">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
              </Card>
            ))}
          </div>
        </section>
      </PageContainer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}

