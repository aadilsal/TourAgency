import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { loadProvinceIndexRows } from "@/lib/provinces-server";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Province guides — explore Pakistan south to north",
  description:
    "Province-by-province travel guides for Pakistan — historical sites, cultural landmarks, natural wonders, and bookable tours from Sindh to Gilgit-Baltistan.",
};

export const dynamic = "force-dynamic";

export default async function GuidesIndexPage() {
  const provinces = await loadProvinceIndexRows();

  return (
    <main className="min-h-screen pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Province guides", path: "/guides" },
        ]}
      />
      <PageContainer className="pt-32 md:pt-40">
        <SectionHeader
          eyebrow="South → north"
          title="Explore Pakistan province by province"
          description="Deep guides with site histories, cultural context, and tours you can book — from Indus civilization in Sindh to Karakoram forts in Gilgit-Baltistan."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {provinces.map((p) => (
            <Link key={p.slug} href={`/guides/${p.slug}`}>
              <Card hover className="h-full overflow-hidden p-0">
                <div className="relative h-48 bg-black/10">
                  <Image
                    src={p.heroUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {p.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{p.tagline}</p>
                  <p className="mt-4 text-xs font-semibold text-muted">
                    {p.siteCount} sites · {p.tourCount} tours
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </PageContainer>
    </main>
  );
}
