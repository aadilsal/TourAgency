import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Pakistan tourist visa guide for foreigners (2026)",
  description:
    "What foreign travellers need to know about a Pakistan tourist visa — the e-Visa process, typical documents required, invitation letters, and how JunketTours can help.",
  alternates: { canonical: "/pakistan-tourist-visa-guide" },
  openGraph: {
    title: "Pakistan tourist visa guide for foreigners (2026) | JunketTours",
    description:
      "The Pakistan tourist visa process explained for foreign travellers — documents, invitation letters, and next steps.",
    url: `${getSiteUrl()}/pakistan-tourist-visa-guide`,
    type: "article",
  },
};

const faqs = [
  {
    q: "Do I need a visa to visit Pakistan as a tourist?",
    a: "Most foreign nationalities need a visa to visit Pakistan. Pakistan operates an online e-Visa system for tourists from many countries, and a small number of nationalities are visa-exempt or eligible for visa-on-arrival. Requirements change by nationality and over time, so always confirm current requirements on Pakistan's official government e-Visa portal or with your nearest Pakistani embassy/consulate before you apply.",
  },
  {
    q: "What documents does a Pakistan tourist e-Visa usually need?",
    a: "Typically: a passport valid for at least 6 months beyond your travel dates, a recent passport-style photo, proof of accommodation or an itinerary, proof of onward/return travel, and sometimes proof of sufficient funds. An invitation letter from a licensed local tour operator can also support your application and is often requested by immigration authorities.",
  },
  {
    q: "Can JunketTours provide a visa invitation letter?",
    a: "Yes. Submit each traveller's passport details through our visa invitation request, and our licensed team prepares an official invitation letter to support your Pakistan tourist visa application.",
  },
  {
    q: "How long does a Pakistan tourist visa take to process?",
    a: "Processing times vary by nationality, season, and application volume, and can range from a few days to a few weeks. Apply well ahead of your travel dates and check current processing estimates on the official visa portal rather than relying on a fixed number.",
  },
];

export default function PakistanTouristVisaGuidePage() {
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
          { name: "Pakistan tourist visa guide", path: "/pakistan-tourist-visa-guide" },
        ]}
      />
      <PageContainer className="max-w-4xl">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-havezic-primary">
            Visa &amp; entry requirements
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Pakistan tourist visa guide for foreigners
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
            Sorting out a visa is usually the first real step in planning a Pakistan trip.
            Here&apos;s what most foreign travellers need to know, plus how we help with the
            invitation letter part of the process.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/visa-invitation" variant="primary" className="py-3">
              Request an invitation letter
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
            <h2 className="text-lg font-bold text-foreground">The e-Visa system</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Pakistan issues tourist visas online through its official government
              e-Visa portal for most nationalities. A few nationalities are visa-exempt or
              qualify for visa-on-arrival. Because these lists and requirements change,
              always confirm your specific nationality&apos;s requirements on the official
              portal or with your nearest Pakistani embassy/consulate — don&apos;t rely solely
              on general guides like this one.
            </p>
          </Card>
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">What you&apos;ll typically need</h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
              <li>A passport valid at least 6 months beyond your travel dates</li>
              <li>A recent passport-style photo</li>
              <li>Proof of accommodation or a day-by-day itinerary</li>
              <li>Proof of onward or return travel</li>
              <li>Sometimes, proof of sufficient funds for your stay</li>
            </ul>
          </Card>
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
            How an invitation letter helps
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Immigration authorities often ask for a letter from a licensed local operator
            confirming your itinerary and purpose of visit. Submit each traveller&apos;s
            passport details and we&apos;ll prepare an official invitation letter to support
            your application — it&apos;s a service we provide directly, not a third-party
            reseller step.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/visa-invitation" variant="primary" className="py-3">
              Start your invitation letter request
            </ButtonLink>
            <ButtonLink
              href="/tours"
              variant="secondary"
              className="border-white/35 bg-white/10 py-3 text-white hover:bg-white/20"
            >
              Browse tours first
            </ButtonLink>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
            Also wondering if Pakistan is safe to visit?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Read our{" "}
            <Link href="/is-pakistan-safe-for-tourists" className="font-semibold text-havezic-primary hover:underline">
              honest safety guide for foreign tourists
            </Link>{" "}
            covering established routes and practical precautions.
          </p>
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
