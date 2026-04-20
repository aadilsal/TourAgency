import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Best travel agency in Pakistan",
  description:
    "A practical guide to choosing a Pakistan travel agency — and how JunketTours plans and runs safe, verified northern Pakistan tours (Hunza, Skardu, Swat and more).",
  alternates: { canonical: "/best-travel-agency-in-pakistan" },
  openGraph: {
    title: "Best travel agency in Pakistan | JunketTours",
    description:
      "How to choose a travel agency in Pakistan: safety, itinerary quality, pricing transparency, and support — plus how JunketTours helps you book confidently.",
    url: `${getSiteUrl()}/best-travel-agency-in-pakistan`,
    type: "article",
  },
};

const faqs = [
  {
    q: "How do I choose the best travel agency in Pakistan?",
    a: "Look for transparent itineraries and pricing, clear inclusions/exclusions, verified operators, written policies, and responsive support before and during the trip. Ask for a day-by-day plan and what happens if weather or road conditions change.",
  },
  {
    q: "Do you arrange Hunza and Skardu tours?",
    a: "Yes. JunketTours offers northern Pakistan tours including Hunza and Skardu, plus other destinations like Swat and Naran. You can browse packages and request a custom plan.",
  },
  {
    q: "Can I book via WhatsApp?",
    a: "Yes. You can message JunketTours on WhatsApp for availability, pricing, and a custom itinerary. We can also help you choose the right tour from our catalog.",
  },
  {
    q: "What should a tour package include?",
    a: "Most packages include transport, accommodation, and a structured itinerary. Always confirm what is included, the hotel category, meal plan, route, and what costs are excluded (tickets, personal expenses, optional activities).",
  },
];

export default function BestTravelAgencyPakistanPage() {
  const base = getSiteUrl();
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
          { name: "Best travel agency in Pakistan", path: "/best-travel-agency-in-pakistan" },
        ]}
      />
      <PageContainer className="max-w-4xl">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent">
            Pakistan travel planning
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Best travel agency in Pakistan (how to choose + why JunketTours)
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300 md:text-lg">
            If you’re comparing travel agencies in Pakistan, you want more than a catchy package
            name — you want a clear itinerary, predictable costs, and a team that stays responsive
            when roads or weather change. This guide shows you what to look for and how we run trips
            at JunketTours.
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
              Talk to an agent
            </ButtonLink>
          </div>
        </header>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-brand-ink">What “best” really means</h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-brand-muted">
              <li>Transparent pricing and clear inclusions/exclusions</li>
              <li>Realistic day-by-day itinerary (not vague bullet points)</li>
              <li>Safety-first routing and flexibility for weather/road closures</li>
              <li>Support before and during the trip (WhatsApp + phone)</li>
              <li>Verified vendors and consistent on-ground coordination</li>
            </ul>
          </Card>
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-brand-ink">Why travelers pick JunketTours</h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-muted">
              We focus on northern Pakistan with a catalog you can browse and book — plus custom
              planning when you want something specific. If you message us, we’ll suggest the right
              tour based on dates, budget, and travel style.
            </p>
            <p className="mt-4 text-sm text-brand-muted">
              Office: Johar Town, Lahore. Phone/WhatsApp support is available through{" "}
              <Link href="/contact" className="font-semibold text-brand-accent underline">
                our contact page
              </Link>
              .
            </p>
          </Card>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
            A simple checklist before you book
          </h2>
          <div className="mt-6 grid gap-6">
            <Card className="p-6 md:p-8">
              <h3 className="text-base font-bold text-brand-ink">1) Ask for the exact itinerary</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                You should receive a day-by-day plan with travel times, stay locations, and what’s
                included. If the plan is vague, you’ll likely face surprises later.
              </p>
            </Card>
            <Card className="p-6 md:p-8">
              <h3 className="text-base font-bold text-brand-ink">2) Confirm inclusions + exclusions</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                Confirm hotel category, transport type, meals, and what’s excluded (entry tickets,
                personal expenses, optional activities). Clear scope prevents conflict.
              </p>
            </Card>
            <Card className="p-6 md:p-8">
              <h3 className="text-base font-bold text-brand-ink">3) Verify support and escalation</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                In northern Pakistan, conditions can change. You want an operator who stays
                responsive and can adjust routes without ruining your trip.
              </p>
            </Card>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
            Start with a proven itinerary
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Browse verified tours or use the AI planner for an outline, then we’ll match tours and
            help you book.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/ai-planner" variant="primary" className="py-3">
              Open AI planner
            </ButtonLink>
            <ButtonLink
              href="/destinations"
              variant="secondary"
              className="border-white/35 bg-white/10 py-3 text-white hover:bg-white/20"
            >
              Explore destinations
            </ButtonLink>
          </div>
          <p className="mt-5 text-xs text-slate-400">
            Website:{" "}
            <a className="underline" href={base}>
              {base}
            </a>
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">FAQ</h2>
          <div className="mt-6 grid gap-4">
            {faqs.map((f) => (
              <Card key={f.q} className="p-6 md:p-8">
                <h3 className="text-base font-bold text-brand-ink">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{f.a}</p>
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

