import type { Metadata } from "next";
import Link from "next/link";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { BUSINESS, formatBusinessAddress } from "@/config/business";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

const LAST_UPDATED = "16 September 2026";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "Terms for using the JunketTours website and booking a Pakistan tour: quote-based bookings, USD/PKR pricing, deposits, travel documents, liability and complaints.",
  path: "/terms-of-service",
});

const h2 = "text-lg font-bold text-foreground";
const p = "mt-3 text-sm leading-relaxed text-muted";
const ul = "mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted";
const link = "font-semibold text-havezic-primary hover:underline";

export default async function TermsOfServicePage() {
  let governmentLicenseNo: string | undefined;
  let contactEmail: string = BUSINESS.email;
  let officeAddress = formatBusinessAddress();
  try {
    const client = getConvexServer();
    const settings = (await client.query(api.siteSettings.getPublicSiteSettings, {})) as {
      governmentLicenseNo?: string;
      contactEmail?: string;
      officeAddress?: string;
    } | null;
    governmentLicenseNo = settings?.governmentLicenseNo?.trim() || undefined;
    contactEmail = settings?.contactEmail?.trim() || contactEmail;
    officeAddress = settings?.officeAddress?.trim() || officeAddress;
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
          description={`Last updated ${LAST_UPDATED}. Please read these terms before using this website or booking a tour with JunketTours.`}
        />

        <div className="mt-10 space-y-6">
          <Card className="p-6 md:p-8">
            <h2 className={h2}>1. About us &amp; acceptance</h2>
            <p className={p}>
              This website is operated by {BUSINESS.legalName}, {officeAddress}
              {governmentLicenseNo ? `, a tour operator licensed under licence no. ${governmentLicenseNo}` : ""}.
              By browsing the site or submitting an enquiry, booking request, AI planner
              request or visa invitation request, you agree to these terms. If you book a
              trip, the written confirmation and invoice we send you form part of your
              contract and take precedence where they differ from these terms.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>2. How booking works (no online payment)</h2>
            <ul className={ul}>
              <li>Submitting a form or WhatsApp message is a <strong>request for a quote</strong>, not a confirmed booking.</li>
              <li>We reply with an itinerary, inclusions/exclusions and final price.</li>
              <li>Your trip is confirmed only when you accept in writing (email or WhatsApp) <strong>and</strong> we receive any deposit stated on your invoice.</li>
              <li>We never take card payments on this website and will never ask for card details by WhatsApp or email. Pay only against an invoice from an official JunketTours email address.</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>3. Prices &amp; currency</h2>
            <ul className={ul}>
              <li>Prices are shown in US dollars (USD) for international visitors and Pakistani rupees (PKR) for visitors in Pakistan. Prices on the website are indicative, per the group size shown, until confirmed on your invoice.</li>
              <li>The currency and amount on your invoice are binding. Bank, transfer and currency-conversion charges from your side are your responsibility.</li>
              <li>Once confirmed, we will only change the price for reasons outside our control that we can evidence (e.g. government fees, fuel surcharges or permit costs), and you may cancel without penalty if an increase exceeds 10%.</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>4. Cancellations &amp; changes</h2>
            <p className={p}>
              Cancellations and refunds follow our{" "}
              <Link href="/cancellation-policy" className={link}>
                Cancellation &amp; Refund Policy
              </Link>{" "}
              unless your invoice states otherwise. Northern routes can be affected by
              weather, landslides, flight cancellations or government restrictions; where
              that happens we will offer the best reasonable alternative (a revised route,
              new dates or a refund of the affected services).
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>5. Your responsibilities</h2>
            <ul className={ul}>
              <li><strong>Travel documents:</strong> a passport valid for at least 6 months, a valid Pakistan visa, and any permits we tell you are required. A visa invitation letter supports your application but does not guarantee a visa — the decision rests with the Government of Pakistan.</li>
              <li><strong>Travel insurance:</strong> we strongly recommend comprehensive insurance covering medical care, evacuation (including from high-altitude regions) and cancellation.</li>
              <li><strong>Health &amp; fitness:</strong> tell us about medical conditions, mobility needs or dietary requirements before booking; some northern itineraries involve high altitude and long road journeys.</li>
              <li><strong>Conduct &amp; local laws:</strong> respect Pakistani law, local customs, religious sites and dress codes, and follow your guide&apos;s safety instructions. We may end services for travellers whose behaviour endangers others, without refund.</li>
              <li><strong>Travel advice:</strong> check your own government&apos;s travel advice for Pakistan before booking and travelling.</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>6. Suppliers &amp; our liability</h2>
            <p className={p}>
              Hotels, airlines, transport and other on-ground services are arranged by
              JunketTours but provided by independent suppliers under their own terms. We
              choose suppliers carefully and will help resolve any problem. To the extent
              permitted by law, our total liability to you for any claim relating to a trip is
              limited to the price you paid us for that trip, and we are not liable for
              indirect losses or for events beyond our reasonable control (including natural
              disasters, strikes, epidemics, security incidents or government action).
              Nothing in these terms limits liability for death or personal injury caused by
              our negligence, fraud, or any liability that cannot legally be limited.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>7. Website, AI planner &amp; accounts</h2>
            <ul className={ul}>
              <li>Website content is for general information and may change. Travel conditions, visa rules and prices can change at short notice — always confirm with our team.</li>
              <li>AI planner itineraries are automatically generated drafts. They may contain errors and are not an offer; a human travel expert reviews and confirms any plan before booking.</li>
              <li>You are responsible for keeping your account password secure and for information you submit being accurate.</li>
              <li>Don&apos;t misuse the site (e.g. automated scraping, attempts to breach security or submitting false visa information).</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>8. Photos &amp; intellectual property</h2>
            <p className={p}>
              Site content, photography and itinerary designs belong to JunketTours or are
              used under licence and may not be reproduced commercially without permission.
              Photos on the site illustrate destinations and may not show the exact hotels,
              vehicles or conditions of your trip.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>9. Complaints</h2>
            <p className={p}>
              If something isn&apos;t right during your trip, tell your guide or message us on
              WhatsApp straight away so we can fix it on the spot. If it remains unresolved,
              email{" "}
              <a href={`mailto:${contactEmail}`} className={link}>
                {contactEmail}
              </a>{" "}
              within 30 days of your trip ending, with your invoice number. We acknowledge
              complaints within 3 business days and aim to give a full response within 14
              days.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>10. Privacy</h2>
            <p className={p}>
              How we handle your personal data is explained in our{" "}
              <Link href="/privacy-policy" className={link}>
                Privacy &amp; Cookie Policy
              </Link>
              .
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>11. Governing law</h2>
            <p className={p}>
              These terms are governed by the laws of Pakistan and disputes are subject to the
              courts of Lahore, Pakistan. If you are a consumer living elsewhere, this does not
              remove any mandatory consumer protections you have under the laws of your
              country of residence.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>12. Changes &amp; contact</h2>
            <p className={p}>
              We may update these terms; the version on the date you confirm a booking
              applies to that booking. Questions? Email{" "}
              <a href={`mailto:${contactEmail}`} className={link}>
                {contactEmail}
              </a>
              , WhatsApp {BUSINESS.phoneDisplay}, or use our{" "}
              <Link href="/contact" className={link}>
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
