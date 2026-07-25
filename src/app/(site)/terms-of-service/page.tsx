import type { Metadata } from "next";
import Link from "next/link";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply when you use the JunketTours website or book a tour with us.",
  alternates: { canonical: "/terms-of-service" },
};

export default async function TermsOfServicePage() {
  const client = getConvexServer();
  let governmentLicenseNo: string | undefined;
  try {
    const settings = await client.query(api.siteSettings.getPublicSiteSettings, {});
    governmentLicenseNo = settings?.governmentLicenseNo?.trim() || undefined;
  } catch {
    governmentLicenseNo = undefined;
  }

  return (
    <main className="min-h-screen py-14 md:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Terms of Service", path: "/terms-of-service" },
        ]}
      />
      <PageContainer className="max-w-3xl">
        <SectionHeader
          variant="onDark"
          eyebrow="Legal"
          title="Terms of Service"
          description="Last updated 2026. Please read these terms before using this website or booking a tour with JunketTours."
        />

        <div className="mt-10 space-y-6">
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">1. Acceptance</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              By browsing this website or submitting an inquiry, AI planner request, or
              visa invitation request, you agree to these terms.
              {governmentLicenseNo ? ` JunketTours operates under license ${governmentLicenseNo}.` : ""}
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">2. What this website is</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This site is an informational and inquiry platform. Tour prices shown (in USD
              or PKR) are indicative and confirmed at the time of booking. We do not take
              card payments through this website — a trip is only confirmed once you receive
              a written confirmation from our team and, where applicable, pay a deposit by
              bank transfer against an invoice.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">3. Booking process</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
              <li>You submit a request via the contact form, AI planner, or WhatsApp.</li>
              <li>We reply with an itinerary, inclusions/exclusions, and final pricing.</li>
              <li>Your booking is confirmed once you accept in writing and pay any required deposit.</li>
              <li>You are responsible for having a valid passport, visa, travel insurance, and any vaccinations required for your trip.</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">4. Third-party services</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Hotels, transport, guides, and other on-ground services are arranged by
              JunketTours but delivered by independent third parties. We select vendors
              carefully and coordinate on your behalf, but our liability for the acts or
              omissions of an independent third-party vendor is limited to what is legally
              required.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">5. Changes &amp; circumstances beyond our control</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Northern Pakistan routes can be affected by weather, road closures, or
              government restrictions. Where this happens, we will offer the best
              alternative we reasonably can (a revised route, different dates, or a
              refund per our{" "}
              <Link href="/cancellation-policy" className="font-semibold text-havezic-primary hover:underline">
                Cancellation Policy
              </Link>
              ), but we are not liable for delays or changes caused by events outside our
              control.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">6. Intellectual property</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Site content, photography, and itinerary designs belong to JunketTours or are
              used under license, and may not be reproduced commercially without
              permission.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">7. Governing law</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              These terms are governed by the laws of Pakistan, and any dispute is subject
              to the courts of Lahore, Pakistan.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">8. Contact</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Questions about these terms? Use our{" "}
              <Link href="/contact" className="font-semibold text-havezic-primary hover:underline">
                contact page
              </Link>
              .
            </p>
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
