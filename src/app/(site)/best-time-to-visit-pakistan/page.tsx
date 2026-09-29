import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { JsonLdScript } from "@/components/JsonLdScript";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Best Time to Visit Pakistan: Month-by-Month Guide",
  description:
    "The best time to visit Pakistan depends on where you go: April to October for Hunza, Skardu and the northern valleys, October to March for Lahore, Islamabad and the heritage cities.",
  path: "/best-time-to-visit-pakistan",
  type: "article",
});

const regions = [
  {
    name: "Northern valleys — Hunza, Skardu, Fairy Meadows, Swat",
    best: "April to October",
    detail:
      "Roads and passes are open and the weather is mild to warm. April brings blossom in Hunza, May to September is the main trekking and high-altitude season (including Deosai plateau), and October is known for autumn colour. Winter snow can close mountain roads and passes, and the monsoon months (July to September) can cause landslides on some routes, so build slack into the itinerary.",
  },
  {
    name: "Lahore, Islamabad, Taxila and the Punjab heritage cities",
    best: "October to March",
    detail:
      "Days are pleasant for walking forts, old cities and museums. From May to August it is very hot, and the monsoon adds humidity in July and August. December and January are cool, with fog on some mornings.",
  },
  {
    name: "Karachi and the south (Sindh)",
    best: "November to February",
    detail:
      "Cooler and drier months make sightseeing on the coast and at inland heritage sites more comfortable. Summers are hot and humid.",
  },
];

const faqs = [
  {
    q: "What is the best month to visit Pakistan?",
    a: "There is no single best month, because Pakistan spans mountains, plains and coast. October is a strong all-round choice: autumn colour in the northern valleys and pleasant temperatures in Lahore and Islamabad. April is also good, with blossom in Hunza and mild weather in the cities.",
  },
  {
    q: "When is the best time to visit Hunza and Skardu?",
    a: "Generally April to October. Blossom is in April, the high-altitude season runs from about May to September, and autumn colour peaks in October. Roads and passes can close in winter, so confirm conditions with your operator before travelling.",
  },
  {
    q: "Is the monsoon a bad time to visit?",
    a: "The monsoon (roughly July to September) brings heat and humidity to the plains and can cause landslides and delays on mountain roads. Many travellers avoid the mountain routes then, or allow extra days. A local operator can adjust your route when conditions change.",
  },
  {
    q: "When should I visit for heritage and culture (Lahore, Taxila, Peshawar)?",
    a: "October to March, when it is cool enough to spend full days outdoors at forts, mosques and archaeological sites.",
  },
];

export default function BestTimeToVisitPakistanPage() {
  return (
    <main className="min-h-screen py-14 md:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Best time to visit Pakistan", path: "/best-time-to-visit-pakistan" },
        ]}
      />
      <PageContainer className="max-w-4xl">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-havezic-primary">
            Planning your trip
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Best time to visit Pakistan
          </h1>
          <p className="mt-4 rounded-xl bg-havezic-background-light px-4 py-3 text-base leading-relaxed text-foreground md:text-lg">
            <span className="font-semibold">Quick answer:</span> April to October for Hunza, Skardu
            and the northern valleys; October to March for Lahore, Islamabad and the heritage
            cities. October works well for both.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Pakistan covers high mountains, river plains and a coastline, so the right season
            depends on where you are going. Use this guide to match your dates to the regions on
            your route, then check current road and weather conditions with your operator.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/tours" variant="primary" className="py-3">
              Browse tours
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" className="py-3">
              Ask us about your dates
            </ButtonLink>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            Best season by region
          </h2>
          <div className="mt-6 grid gap-4">
            {regions.map((r) => (
              <Card key={r.name} className="p-6 md:p-8">
                <h3 className="text-base font-bold text-foreground">{r.name}</h3>
                <p className="mt-1 text-sm font-semibold text-havezic-primary">Best: {r.best}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{r.detail}</p>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Seasons are typical patterns, not guarantees. Weather, road closures and government
            travel advisories change, so check before you book and again before you fly. See our{" "}
            <Link href="/is-pakistan-safe-for-tourists" className="font-semibold text-havezic-primary underline">
              safety guide
            </Link>{" "}
            and{" "}
            <Link href="/pakistan-tourist-visa-guide" className="font-semibold text-havezic-primary underline">
              visa guide
            </Link>
            .
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            Compare two popular mountain bases
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Not sure where to start? Read{" "}
            <Link href="/hunza-vs-skardu" className="font-semibold text-havezic-primary underline">
              Hunza vs Skardu
            </Link>{" "}
            or explore the{" "}
            <Link href="/destinations" className="font-semibold text-havezic-primary underline">
              destination guides
            </Link>
            .
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">FAQ</h2>
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

      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
    </main>
  );
}
