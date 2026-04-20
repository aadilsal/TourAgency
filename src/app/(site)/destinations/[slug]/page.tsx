import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadDestinationDetailPageData } from "@/lib/destinations-server";
import { RelatedToursCarousel } from "@/components/destinations/RelatedToursCarousel";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { PageContainer } from "@/components/ui/PageContainer";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await loadDestinationDetailPageData(params.slug);
  if (!d) return { title: "Destination" };
  return {
    title: `${d.name} tours & travel`,
    description: d.description.slice(0, 160),
  };
}

export default async function DestinationPage({ params }: Props) {
  const d = await loadDestinationDetailPageData(params.slug);
  if (!d) notFound();

  const related = d.related;

  return (
    <main className="min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Destinations", path: "/destinations" },
          { name: d.name, path: `/destinations/${params.slug}` },
        ]}
      />
      <div className="relative h-[min(55vh,520px)] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={d.heroUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/95 via-brand-primary/50 to-transparent" />
        <PageContainer className="relative flex h-full flex-col justify-end pb-12 pt-32 text-white md:pb-16 md:pt-40">
          <p className="text-sm font-medium text-brand-accent">
            <Link href="/destinations" className="hover:underline">
              Destinations
            </Link>{" "}
            / {d.name}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
            {d.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/90">
            {d.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/tours" variant="primary" className="py-3">
              Browse tours
            </ButtonLink>
            {params.slug === "hunza" ? (
              <ButtonLink
                href="/hunza-tour-operator"
                variant="secondary"
                className="border-white/40 bg-white/15 py-3 text-white hover:bg-white/25"
              >
                Hunza tour operator
              </ButtonLink>
            ) : null}
            <ButtonLink
              href="/ai-planner"
              variant="secondary"
              className="border-white/40 bg-white/15 py-3 text-white hover:bg-white/25"
            >
              AI planner
            </ButtonLink>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-brand-ink">About {d.name}</h2>
              <p className="mt-4 leading-relaxed text-brand-muted">{d.description}</p>
              <ul className="mt-6 space-y-2">
                {d.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-brand-muted">
                    <span className="text-brand-accent" aria-hidden>
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-brand-ink">Best time to visit</h2>
              <p className="mt-4 text-brand-muted">{d.bestTime}</p>
            </Card>

            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-brand-ink">Travel tips</h2>
              <ul className="mt-4 list-inside list-disc space-y-2 text-brand-muted">
                {d.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-brand-ink">Cost estimate</h2>
              <p className="mt-4 text-sm leading-relaxed text-brand-muted">
                {d.costEstimate}
              </p>
            </Card>
          </div>

          <aside className="lg:col-span-1">
            <Card className="sticky top-28 p-6">
              <h3 className="font-bold text-brand-ink">Plan this trip</h3>
              <p className="mt-2 text-sm text-brand-muted">
                Use AI to match dates, budget, and style — or message us on
                WhatsApp for a custom quote.
              </p>
              <ButtonLink
                href="/ai-planner"
                variant="primary"
                className="mt-6 w-full justify-center py-3"
              >
                Open AI planner
              </ButtonLink>
              <ButtonLink
                href="/tours"
                variant="secondary"
                className="mt-3 w-full justify-center py-3"
              >
                See all tours
              </ButtonLink>
            </Card>
          </aside>
        </div>

        <RelatedToursCarousel tours={related} />
      </PageContainer>
    </main>
  );
}
