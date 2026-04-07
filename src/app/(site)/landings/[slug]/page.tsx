import { notFound } from "next/navigation";
import Link from "next/link";
import { landingPages } from "@/config/programmatic-seo";
import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return landingPages.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const page = landingPages.find((p) => p.slug === params.slug);
  if (!page) return { title: "Landing" };
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
  };
}

export default function LandingPage({ params }: Props) {
  const page = landingPages.find((p) => p.slug === params.slug);
  if (!page) notFound();

  return (
    <main className="min-h-screen py-12 md:py-20">
      <PageContainer className="max-w-3xl">
        <article>
          <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
            {page.title}
          </h1>
          <p className="mt-4 text-lg text-slate-300">{page.description}</p>
          <Card className="mt-8 p-6 md:p-8">
            <p className="text-sm text-brand-muted">
              Ready to move from research to a real itinerary? Browse open
              departures and book in minutes — guest checkout supported.
            </p>
            <ButtonLink href="/tours" variant="primary" className="mt-6 py-3">
              View tours
            </ButtonLink>
          </Card>
        </article>
        <p className="mt-8 text-center text-sm text-slate-500">
          <Link href="/" className="text-brand-accent hover:underline">
            ← Back to home
          </Link>
        </p>
      </PageContainer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: `What is covered on ${page.slug.replace(/-/g, " ")}?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: page.description,
                },
              },
            ],
          }),
        }}
      />
    </main>
  );
}
