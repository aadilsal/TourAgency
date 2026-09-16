import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { BUSINESS } from "@/config/business";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = buildMetadata({
  title: "Cancellation & Refund Policy",
  description:
    "How cancellations, date changes and refunds work for JunketTours trips in Pakistan — refund tiers, non-refundable items and how to request a refund.",
  path: "/cancellation-policy",
});

export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen py-14 md:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Cancellation & Refund Policy", path: "/cancellation-policy" },
        ]}
      />
      <PageContainer className="max-w-3xl">
        <SectionHeader
          variant="onDark"
          eyebrow="Legal"
          title="Cancellation & Refund Policy"
          description="Last updated 2026. These are our default cancellation terms — the specific terms for your trip are always confirmed in writing before you pay a deposit."
        />

        <div className="mt-10 space-y-6">
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">How a booking is confirmed</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We don&apos;t take card payments on this website. A booking becomes a confirmed
              trip once you accept an itinerary and price in writing (email or WhatsApp)
              and pay the requested deposit by bank transfer against an invoice.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">If you need to cancel</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
              <li><span className="font-semibold text-foreground">30+ days before departure:</span> full refund of amounts paid, less any bank transfer charges.</li>
              <li><span className="font-semibold text-foreground">14–29 days before departure:</span> 50% of amounts paid is refunded.</li>
              <li><span className="font-semibold text-foreground">13 days or less before departure, or no-show:</span> non-refundable, as hotels, transport, and guides are typically already booked and paid on your behalf.</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              These tiers are our general default — your invoice or booking confirmation
              always states the exact terms for your trip, and those written terms apply.
              Refunds are made in the currency you paid in. We strongly recommend travel
              insurance with cancellation cover, as it can reimburse non-refundable costs
              (for example if illness prevents you travelling).
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Non-refundable items</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Visa invitation letter fees, flights or third-party permits booked on your
              behalf, and any costs a vendor confirms as non-refundable are excluded from
              the refund tiers above and are non-refundable once booked.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">If we need to change or cancel your trip</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              If weather, road closures, or government restrictions force a change —
              common on northern Pakistan routes — we will offer the best available
              alternative: revised dates, an adjusted route, or a full refund of the
              affected portion of your trip.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">How to request a cancellation or refund</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Email {BUSINESS.email}, message us on WhatsApp ({BUSINESS.phoneDisplay}), or use the details on our{" "}
              <Link href="/contact" className="font-semibold text-havezic-primary hover:underline">
                contact page
              </Link>
              , referencing your invoice number. Approved refunds are returned to the same
              bank account the payment was made from, typically within 7–14 business days.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-foreground">Related</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              See also our{" "}
              <Link href="/terms-of-service" className="font-semibold text-havezic-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="font-semibold text-havezic-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
