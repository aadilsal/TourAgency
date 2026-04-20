import { notFound } from "next/navigation";
import Link from "next/link";
import { landingPages } from "@/config/programmatic-seo";
import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

type Props = { params: { slug: string } };

function heroForSlug(slug: string) {
  const s = slug.toLowerCase();
  if (s.includes("hunza")) {
    return "https://images.unsplash.com/photo-ONximI_s85U?auto=format&fit=crop&w=2400&q=80";
  }
  if (s.includes("skardu")) {
    return "https://images.unsplash.com/photo-bXaT_8cXTWM?auto=format&fit=crop&w=2400&q=80";
  }
  if (s.includes("swat")) {
    return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80";
  }
  if (s.includes("naran") || s.includes("kaghan")) {
    return "https://images.unsplash.com/photo-3vMZ8TV7aIU?auto=format&fit=crop&w=2400&q=80";
  }
  return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80";
}

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

  const plainTitle = page.title.replace(/\s*\|\s*JunketTours\s*$/, "");
  const topic = page.slug.replace(/-/g, " ");
  const heroImage = heroForSlug(page.slug);

  return (
    <main className="min-h-screen">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-slate-900/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        <PageContainer className="relative py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-accent">
              {topic}
            </p>
            <h1 className="mt-4 text-balance font-display text-3xl font-semibold text-white md:text-5xl">
              {plainTitle}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/80">{page.description}</p>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/tours" variant="primary" className="py-3.5">
                View packages
              </ButtonLink>
              <ButtonLink href="/ai-planner" variant="secondary" className="py-3.5">
                Get my itinerary
              </ButtonLink>
              <ButtonLink href="/contact" variant="ghost" className="py-3.5 text-white hover:bg-white/10">
                WhatsApp us →
              </ButtonLink>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="max-w-5xl py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <article>
            <div className="grid gap-6">
              <Card className="p-6 md:p-8">
                <h2 className="text-lg font-bold text-brand-ink">Quick overview</h2>
                <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-brand-muted">
                  <li>What this covers: {topic}</li>
                  <li>Options: private or group · budget to luxury</li>
                  <li>Next step: compare packages or request a custom quote</li>
                </ul>
              </Card>

              <Card className="p-6 md:p-8">
                <h2 className="text-lg font-bold text-brand-ink">Costs (what changes the price)</h2>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                  Prices usually shift with seasonality, transport (road vs flight where applicable),
                  hotel category, and group size. Always confirm inclusions/exclusions and the exact
                  day-by-day route before you pay.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/tours" variant="primary" className="py-3">
                    View tours
                  </ButtonLink>
                  <ButtonLink href="/contact" variant="secondary" className="py-3">
                    Ask on WhatsApp
                  </ButtonLink>
                </div>
              </Card>

              <Card className="p-6 md:p-8">
                <h2 className="text-lg font-bold text-brand-ink">Suggested trip structure</h2>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                  A strong itinerary balances drive times, rest days, and must-see viewpoints. If you
                  want a plan fast, use our AI planner, then we’ll match it to tours from our catalog.
                </p>
                <ButtonLink href="/ai-planner" variant="secondary" className="mt-6 py-3">
                  Open AI planner
                </ButtonLink>
              </Card>
            </div>
          </article>

          <aside className="lg:pt-2">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                heroImage,
                "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1511732351157-1865efcb7b7b?auto=format&fit=crop&w=1200&q=80",
              ].map((src) => (
                <div
                  key={src}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/10"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${src})` }}
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/10" />
                </div>
              ))}
            </div>

            <Card className="mt-6 p-6 md:p-7">
              <h2 className="text-lg font-bold text-brand-ink">Pick your style</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                Luxury or budget. Private or group. Same routes — tuned to your comfort and dates.
              </p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-bold text-brand-ink">Luxury</p>
                  <p className="mt-1 text-sm text-brand-muted">
                    Boutique stays, private transfers, slow mornings.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-bold text-brand-ink">Budget</p>
                  <p className="mt-1 text-sm text-brand-muted">
                    Great value, smart routes, comfort-first planning.
                  </p>
                </div>
              </div>
              <ButtonLink href="/tours" variant="primary" className="mt-6 w-full py-3">
                See options
              </ButtonLink>
            </Card>
          </aside>
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
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
                name: `What is covered in ${topic}?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: page.description,
                },
              },
              {
                "@type": "Question",
                name: "How can I book a tour?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Browse tours on JunketTours and book, or message us on WhatsApp via the contact page to match dates and budget.",
                },
              },
            ],
          }),
        }}
      />
    </main>
  );
}
