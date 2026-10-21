import { PageContainer } from "@/components/ui/PageContainer";
import { getConvexServer } from "@/lib/server/convex-server";
import { api } from "@convex/_generated/api";
import { AboutPageClient } from "@/components/about/AboutPageClient";
import { FaqSection } from "@/components/about/FaqSection";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Us & FAQs",
  description:
    "Meet JunketTours, a licensed Lahore-based tour operator running heritage & culture trips across Pakistan — plus answers on visas, safety, payments and planning.",
  path: "/about",
});

export const revalidate = 0;

export default async function AboutPage() {
  const client = getConvexServer();
  const team = await client.query(api.team.listPublic, {});
  const content = await client.query(api.about.getPublic, {});
  const faqs = await client.query(api.faqs.listPublic, {});
  const settings = await client
    .query(api.siteSettings.getPublicSiteSettings, {})
    .catch(() => null);

  return (
    <main className="min-h-screen">
      <AboutPageClient
        team={team}
        content={content}
        reviewsWidgetCode={settings?.reviewsWidgetCode ?? null}
      />
      <FaqSection faqs={faqs} />
      {/* The FAQs above are server-rendered and visible, as the markup requires. */}
      <FaqJsonLd faqs={faqs} />
      <PageContainer className="sr-only">About page content</PageContainer>
    </main>
  );
}
