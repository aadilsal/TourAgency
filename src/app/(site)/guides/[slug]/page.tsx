import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { loadProvinceGuidePageData, loadProvinceSlugs } from "@/lib/provinces-server";
import { ProvinceGuideHero } from "@/components/guides/ProvinceGuideHero";
import { ProvinceSitesSection } from "@/components/guides/ProvinceSitesSection";
import { ProvinceToursPanel } from "@/components/guides/ProvinceToursPanel";
import { ProvinceCityDestinations } from "@/components/guides/ProvinceCityDestinations";
import { PageContainer } from "@/components/ui/PageContainer";
import { ButtonLink } from "@/components/ui/Button";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateStaticParams() {
  const slugs = await loadProvinceSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await loadProvinceGuidePageData(params.slug);
  if (!data) return { title: "Province guide" };
  return {
    title: `${data.name} travel guide — sites, history & tours`,
    description: data.intro.slice(0, 160),
  };
}

export default async function ProvinceGuidePage({ params }: Props) {
  const data = await loadProvinceGuidePageData(params.slug);
  if (!data) notFound();

  const siteListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${data.name} heritage & travel sites`,
    itemListElement: data.sites.slice(0, 20).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      description: s.summary,
    })),
  };

  return (
    <main className="min-h-screen pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Province guides", path: "/guides" },
          { name: data.name, path: `/guides/${params.slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteListJsonLd) }}
      />
      <ProvinceGuideHero
        name={data.name}
        tagline={data.tagline}
        intro={data.intro}
        heroUrl={data.heroUrl}
        bestTime={data.bestTime}
      />
      <PageContainer className="mt-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-12">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Sites & stories
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
              Historical, cultural, natural, and adventure highlights — with context for
              planning your route.
            </p>
            <div className="mt-8">
              <ProvinceSitesSection sites={data.sites} />
            </div>
          </div>
          <aside className="lg:pt-10">
            <ProvinceToursPanel
              provinceSlug={data.slug}
              provinceName={data.name}
              tours={data.relatedTours}
            />
          </aside>
        </div>

        {data.tips.length > 0 ? (
          <Card className="mt-12 p-6 md:p-8">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Travel tips
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-muted md:text-base">
              {data.tips.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-havezic-primary" aria-hidden>
                    •
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">
              <span className="font-semibold text-foreground">Budget:</span>{" "}
              {data.costEstimate}
            </p>
          </Card>
        ) : null}

        <ProvinceCityDestinations
          destinations={data.cityDestinations}
          provinceName={data.name}
        />

        <div className="mt-16 flex flex-wrap gap-3">
          <ButtonLink href="/tours" variant="primary">
            Browse all tours
          </ButtonLink>
          <ButtonLink href="/destinations" variant="secondary">
            City destinations
          </ButtonLink>
          <ButtonLink href="/ai-planner" variant="secondary">
            AI trip planner
          </ButtonLink>
          <Link
            href="/guides"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-havezic-primary hover:underline"
          >
            ← All provinces
          </Link>
        </div>
      </PageContainer>
    </main>
  );
}
