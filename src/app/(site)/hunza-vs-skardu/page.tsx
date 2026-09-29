import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { JsonLdScript } from "@/components/JsonLdScript";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Hunza vs Skardu: Which Should You Visit?",
  description:
    "Hunza or Skardu? Compare scenery, culture, access, best season and trip length for Pakistan's two most popular mountain destinations, and see how to combine them.",
  path: "/hunza-vs-skardu",
  type: "article",
});

const rows = [
  {
    label: "Known for",
    hunza: "Forts, orchards, valley villages and views of Rakaposhi and the Passu cones",
    skardu: "High lakes, the Deosai plateau, Shigar and the gateway to K2 and the Baltoro trek",
  },
  {
    label: "Feel",
    hunza: "Cultural and relaxed, with a lot of sightseeing by road along the Karakoram Highway",
    skardu: "More rugged and expedition-oriented, with wide open high-altitude landscapes",
  },
  {
    label: "Getting there",
    hunza: "Long road journey along the Karakoram Highway from Islamabad (often broken up with an overnight stop)",
    skardu: "Flight from Islamabad when weather allows, or a long road journey",
  },
  {
    label: "Best season",
    hunza: "April to October (blossom in April, autumn colour in October)",
    skardu: "May to September for the high country; Deosai is only accessible in the warmer months",
  },
  {
    label: "Good for",
    hunza: "First-time visitors, culture and photography, families and mixed-ability groups",
    skardu: "Trekkers, lake and plateau scenery, travellers heading toward the big peaks",
  },
];

const faqs = [
  {
    q: "Is Hunza or Skardu better for a first trip to Pakistan?",
    a: "Hunza is usually the easier first choice: it combines forts, villages and mountain views with straightforward sightseeing by road. Skardu suits travellers who want high lakes, the Deosai plateau or a base for trekking.",
  },
  {
    q: "Can I visit both Hunza and Skardu in one trip?",
    a: "Yes. Many itineraries combine them, usually with 10 or more days so travel between the valleys is not rushed. Road and flight conditions vary with weather, so keep some flexibility in the plan.",
  },
  {
    q: "How many days do I need for each?",
    a: "Allow several days for Hunza and its surroundings, and several for Skardu and the nearby lakes and plateau, plus travel days from Islamabad. Your operator can suggest a realistic route for your dates.",
  },
  {
    q: "When is the best time to visit both?",
    a: "Late spring to early autumn, roughly May to September, is the most reliable window for both. See our best-time guide for details.",
  },
];

export default function HunzaVsSkarduPage() {
  return (
    <main className="min-h-screen py-14 md:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Hunza vs Skardu", path: "/hunza-vs-skardu" },
        ]}
      />
      <PageContainer className="max-w-4xl">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-havezic-primary">
            Northern Pakistan
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Hunza vs Skardu: which should you visit?
          </h1>
          <p className="mt-4 rounded-xl bg-havezic-background-light px-4 py-3 text-base leading-relaxed text-foreground md:text-lg">
            <span className="font-semibold">Quick answer:</span> choose Hunza for culture, forts and
            easier sightseeing; choose Skardu for high lakes, Deosai and trekking. With ten or more
            days you can combine both.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/tours" variant="primary" className="py-3">
              Browse tours
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" className="py-3">
              Plan a route with us
            </ButtonLink>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            Side by side
          </h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-havezic-background-light text-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold"> </th>
                  <th className="px-4 py-3 font-semibold">Hunza</th>
                  <th className="px-4 py-3 font-semibold">Skardu</th>
                </tr>
              </thead>
              <tbody className="text-muted [&_td]:align-top [&_td]:px-4 [&_td]:py-3 [&_tr]:border-t [&_tr]:border-border">
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="px-4 py-3 font-semibold text-foreground">
                      {r.label}
                    </th>
                    <td>{r.hunza}</td>
                    <td>{r.skardu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted">
            Conditions on mountain roads, flights and passes change with the weather, so confirm
            current information before you travel. See{" "}
            <Link href="/best-time-to-visit-pakistan" className="font-semibold text-havezic-primary underline">
              the best time to visit Pakistan
            </Link>
            ,{" "}
            <Link href="/destinations/hunza" className="font-semibold text-havezic-primary underline">
              the Hunza guide
            </Link>{" "}
            and{" "}
            <Link href="/destinations/skardu" className="font-semibold text-havezic-primary underline">
              the Skardu guide
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
