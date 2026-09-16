import { PageContainer } from "@/components/ui/PageContainer";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { AboutPageClient } from "@/components/about/AboutPageClient";
import { FaqSection } from "@/components/about/FaqSection";
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

  return (
    <main className="min-h-screen">
      <AboutPageClient team={team} content={content} />
      <FaqSection faqs={faqs} />
      <PageContainer className="sr-only">About page content</PageContainer>
    </main>
  );
}
