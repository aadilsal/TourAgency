import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Is Pakistan safe for tourists? (2026 guide)",
  description:
    "A practical, honest look at travelling to Pakistan as a foreign tourist in 2026 — which regions are established tourist circuits, what to check before you book, and how guided travel reduces risk.",
  alternates: { canonical: "/is-pakistan-safe-for-tourists" },
  openGraph: {
    title: "Is Pakistan safe for tourists? (2026 guide) | JunketTours",
    description:
      "What foreign travellers should know before visiting Pakistan — established tourist regions, practical precautions, and how guided tours help.",
    url: `${getSiteUrl()}/is-pakistan-safe-for-tourists`,
    type: "article",
  },
};

const faqs = [
  {
    q: "Is Pakistan safe for tourists in 2026?",
    a: "Pakistan's established tourist circuits — Lahore, Islamabad, Taxila, Hunza, Skardu, Swat, and Naran/Kaghan — are visited by a growing number of foreign travellers every year, and guided small-group travel is the norm for first-time visitors. Conditions can vary by region and change over time, so always check your own government's current travel advisory (for example the US State Department or UK FCDO) before booking, and again shortly before departure.",
  },
  {
    q: "Which parts of Pakistan do most foreign tourists visit?",
    a: "Lahore and Taxila for Mughal and Gandhara heritage, Islamabad as a common entry point, and the northern valleys — Hunza, Skardu, Swat, and Naran/Kaghan — for mountain scenery and forts. These are the routes we build itineraries around.",
  },
  {
    q: "Do I need a local guide, or can I travel independently?",
    a: "Independent travel is possible on the main tourist routes, but a licensed local operator handles road conditions, permits, vetted drivers, and last-minute changes (weather, road closures) that are hard to manage from abroad — which is why most first-time visitors to Pakistan choose a guided or semi-guided trip.",
  },
  {
    q: "What precautions should I take as a foreign tourist?",
    a: "Check your government's travel advisory before and during planning, keep copies of your passport and visa, use a local SIM for connectivity in remote valleys, confirm your operator is licensed, share your itinerary with someone at home, and get travel insurance that covers the regions you're visiting.",
  },
];

export default function IsPakistanSafeForTouristsPage() {
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
          { name: "Is Pakistan safe for tourists?", path: "/is-pakistan-safe-for-tourists" },
        ]}
      />
      <PageContainer className="max-w-4xl">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-havezic-primary">
            Planning your trip
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Is Pakistan safe for tourists?
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
            It&apos;s the first question almost every foreign traveller asks before booking a
            trip to Pakistan — and a fair one. Here&apos;s an honest, practical answer: what
            the established tourist routes actually look like, what to check yourself
            before you book, and how a guided small-group trip reduces the unknowns.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/tours" variant="primary" className="py-3">
              Browse guided tours
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="secondary"
              className="border-white/35 bg-white/10 py-3 text-white hover:bg-white/20"
            >
              Ask us a question
            </ButtonLink>
          </div>
        </header>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Start with official sources, not opinions</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Safety conditions vary by region and change over time. Before booking — and
              again close to your departure date — check your own government&apos;s current
              travel advisory (e.g. the US State Department, UK FCDO, or your country&apos;s
              equivalent) for the specific regions on your itinerary. We build our
              itineraries around established tourist circuits, but you should always
              verify current guidance for your nationality.
            </p>
          </Card>
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Where most foreign tourists actually go</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Lahore, Islamabad, and Taxila for heritage, and Hunza, Skardu, Swat, and
              Naran/Kaghan for the north — these routes see steady, growing numbers of
              foreign visitors and have the tourism infrastructure (hotels, registered
              guides, phone/internet coverage) to match.
            </p>
          </Card>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
            How a guided trip reduces the unknowns
          </h2>
          <div className="mt-6 grid gap-6">
            <Card className="p-6 md:p-8">
              <h3 className="text-base font-bold text-foreground">Local, vetted drivers and guides</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Someone who knows the current road conditions, checkpoints, and which
                routes need extra time — especially in the mountains.
              </p>
            </Card>
            <Card className="p-6 md:p-8">
              <h3 className="text-base font-bold text-foreground">Support if plans need to change</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Weather and road closures happen on northern routes. A responsive operator
                adjusts your itinerary instead of leaving you to figure it out alone.
              </p>
            </Card>
            <Card className="p-6 md:p-8">
              <h3 className="text-base font-bold text-foreground">A licensed, accountable operator</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Confirm any operator you book with is registered and check reviews from
                other foreign travellers before you pay a deposit.
              </p>
            </Card>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
            Also planning your visa?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            We prepare invitation letters for Pakistan tourist visa applications — see our{" "}
            <Link href="/pakistan-tourist-visa-guide" className="underline">
              visa guide
            </Link>{" "}
            or start your request directly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/visa-invitation" variant="primary" className="py-3">
              Request a visa invitation letter
            </ButtonLink>
            <ButtonLink
              href="/ai-planner"
              variant="secondary"
              className="border-white/35 bg-white/10 py-3 text-white hover:bg-white/20"
            >
              Get my itinerary
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
