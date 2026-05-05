import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hunza tour operator",
  description:
    "Choose a Hunza tour operator with clear itineraries, transparent costs, and responsive support. Book Hunza tours with JunketTours or request a custom plan.",
  alternates: { canonical: "/hunza-tour-operator" },
  openGraph: {
    title: "Hunza tour operator | JunketTours",
    description:
      "How to choose a Hunza tour operator (itinerary, pricing, hotels, routing) + how JunketTours helps you book Hunza trips confidently.",
    url: `${getSiteUrl()}/hunza-tour-operator`,
    type: "article",
  },
};

const faqs = [
  {
    q: "What does a Hunza tour operator handle?",
    a: "Typically transport, hotel coordination, day-by-day routing, and on-trip support. Always confirm inclusions/exclusions and what happens if weather or road conditions change.",
  },
  {
    q: "Is Hunza better as a private tour or group tour?",
    a: "Private tours are flexible for timing and stops. Group tours can be more cost-effective. The best choice depends on budget, dates, and pace.",
  },
  {
    q: "Can I plan Hunza with AI and then book?",
    a: "Yes. You can use the JunketTours AI planner to generate an outline, then we match it to tours from our catalog or advise a custom plan.",
  },
];

export default function HunzaTourOperatorPage() {
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
          { name: "Hunza tour operator", path: "/hunza-tour-operator" },
        ]}
      />
      <PageContainer className="max-w-4xl">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-havezic-primary">
            Hunza Valley
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Hunza tour operator (how to choose + book with JunketTours)
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
            A good Hunza tour operator gives you a realistic route, clear costs, dependable hotels,
            and support when conditions change. Use this guide to compare options, then browse Hunza
            tours or message us to plan your dates.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/tours" variant="primary" className="py-3">
              Browse tours
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="secondary"
              className="border-white/35 bg-white/10 py-3 text-white hover:bg-white/20"
            >
              WhatsApp / call support
            </ButtonLink>
          </div>
        </header>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">What to ask before booking</h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
              <li>Exact day-by-day itinerary and drive-time expectations</li>
              <li>Hotel category and location (central vs remote)</li>
              <li>Transport type and contingency plans for road conditions</li>
              <li>Inclusions/exclusions and optional activities</li>
              <li>Support channel during the trip (WhatsApp + escalation)</li>
            </ul>
          </Card>
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Start with a destination guide</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              If you’re still deciding, begin with the Hunza destination overview and then choose a
              tour package that matches your days and budget.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink
                href="/destinations/hunza"
                variant="secondary"
                className="border-border bg-white py-2.5 text-foreground hover:bg-havezic-background-light"
              >
                Hunza destination guide
              </ButtonLink>
              <ButtonLink
                href="/ai-planner"
                variant="secondary"
                className="border-white/35 bg-white/10 py-2.5 text-white hover:bg-white/20"
              >
                Use AI planner
              </ButtonLink>
            </div>
          </Card>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
            Packages vs custom trips
          </h2>
          <div className="mt-6 grid gap-4">
            <Card className="p-6 md:p-8">
              <h3 className="text-base font-bold text-foreground">Tour packages</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Best when you want predictable pricing and a proven route. Browse our tours and pick
                the duration that fits your schedule.
              </p>
              <p className="mt-4 text-sm">
                <Link href="/tours" className="font-semibold text-havezic-primary underline">
                  Browse all tours
                </Link>
              </p>
            </Card>
            <Card className="p-6 md:p-8">
              <h3 className="text-base font-bold text-foreground">Custom planning</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Best when you have specific dates, hotel preferences, or want to adjust pace. Use
                the AI planner for an outline, then send it to us for refinement.
              </p>
              <p className="mt-4 text-sm">
                <Link href="/contact" className="font-semibold text-havezic-primary underline">
                  Contact JunketTours
                </Link>
              </p>
            </Card>
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

