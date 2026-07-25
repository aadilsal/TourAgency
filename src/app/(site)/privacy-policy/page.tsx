import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How JunketTours collects, uses, and protects your personal data across our website, AI planner, and booking process.",
  alternates: { canonical: "/privacy-policy" },
};

export default async function PrivacyPolicyPage() {
  const client = getConvexServer();
  let settings: {
    officeAddress?: string;
    contactEmail?: string;
    whatsappPhone?: string;
  } | null = null;
  try {
    settings = await client.query(api.siteSettings.getPublicSiteSettings, {});
  } catch {
    settings = null;
  }
  const contactEmail = settings?.contactEmail?.trim();
  const officeAddress = settings?.officeAddress?.trim();
  const base = getSiteUrl();

  return (
    <main className="min-h-screen py-14 md:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy-policy" },
        ]}
      />
      <PageContainer className="max-w-3xl">
        <SectionHeader
          variant="onDark"
          eyebrow="Legal"
          title="Privacy Policy"
          description="Last updated 2026. This explains what personal data JunketTours collects when you use this website, and how it's used and protected."
        />

        <div className="mt-10 space-y-6">
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Who we are</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              JunketTours is a Pakistan-based tour operator ({base}) offering culture,
              history, and northern heritage tours to travellers worldwide.
              {officeAddress ? ` Our office: ${officeAddress}.` : ""}
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Data we collect</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
              <li>Contact details you give us: name, phone/WhatsApp number, email, and message content via our contact form, visa invitation form, or AI planner.</li>
              <li>Trip preferences: destinations, dates, budget, and group size entered into the AI planner or shared with our team.</li>
              <li>Booking and invoice details for confirmed trips (names, travel dates, payment reference — we do not process card payments on this site).</li>
              <li>Passport details you submit specifically for a visa invitation letter request.</li>
              <li>Technical data: IP-derived country (used only to set a display currency), pages viewed, and device/browser type via analytics cookies (see below).</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">How we use it</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
              <li>To respond to inquiries and prepare itineraries or quotes.</li>
              <li>To confirm bookings, issue invoices, and coordinate your trip with local vendors (hotels, transport, guides).</li>
              <li>To prepare visa invitation letters when you request one.</li>
              <li>To generate AI-assisted itinerary suggestions (your trip preferences are sent to a third-party AI provider to produce a draft plan — passport and payment details are never included in this request).</li>
              <li>To improve the site, only once you accept analytics cookies via the cookie banner.</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Cookies</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We use a small number of cookies: one to remember your preferred display
              currency, and — only if you accept — Google Analytics cookies to understand
              how visitors use the site. You can change your choice at any time by clearing
              your browser&apos;s site data for this domain, which will show the cookie banner
              again.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Third parties we share data with</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
              <li>Google Analytics (site usage analytics, only with consent).</li>
              <li>Google Maps (to embed our office location).</li>
              <li>WhatsApp/Meta, when you choose to message us via WhatsApp.</li>
              <li>An AI language-model provider, to draft itinerary suggestions from the trip details you enter.</li>
              <li>Hotels, transport operators, and guides in Pakistan directly involved in delivering a trip you book.</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We do not sell your personal data to third parties.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Your rights</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Wherever you&apos;re travelling from — including the EU, UK, and elsewhere — you can
              ask us to access, correct, delete, or export the personal data we hold about
              you, or object to how we use it. Contact us using the details below and we&apos;ll
              respond within a reasonable time.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Data retention &amp; security</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We keep inquiry and booking records only as long as needed to deliver your
              trip and meet our accounting/legal obligations, then remove or anonymise them.
              Data is stored with reputable cloud providers using encryption in transit. As
              our operations are based in Pakistan, some data may be processed outside your
              home country, including outside the EEA/UK.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Children</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This site is not directed at children, and we don&apos;t knowingly collect data
              from anyone under 16 except as part of a family booking made by an adult.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Changes to this policy</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We may update this policy as our services change. Material changes will be
              reflected by updating the date at the top of this page.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Contact us about your data</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {contactEmail ? (
                <>
                  Email <span className="font-semibold text-foreground">{contactEmail}</span> or use
                  our{" "}
                </>
              ) : (
                <>Use our{" "}</>
              )}
              <Link href="/contact" className="font-semibold text-havezic-primary hover:underline">
                contact page
              </Link>{" "}
              for any privacy request.
            </p>
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
