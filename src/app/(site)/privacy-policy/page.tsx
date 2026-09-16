import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { CookieSettingsLink } from "@/components/analytics/CookieSettingsLink";
import { BUSINESS, formatBusinessAddress } from "@/config/business";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

const LAST_UPDATED = "16 September 2026";

export const metadata: Metadata = buildMetadata({
  title: "Privacy & Cookie Policy",
  description:
    "How JunketTours collects, uses, shares and protects personal data from travellers worldwide — cookies, analytics, your GDPR/UK GDPR rights and how to contact us.",
  path: "/privacy-policy",
});

const h2 = "text-lg font-bold text-foreground";
const p = "mt-3 text-sm leading-relaxed text-muted";
const ul = "mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted";
const strong = "font-semibold text-foreground";

export default async function PrivacyPolicyPage() {
  let settings: {
    officeAddress?: string;
    contactEmail?: string;
    whatsappPhone?: string;
  } | null = null;
  try {
    const client = getConvexServer();
    settings = await client.query(api.siteSettings.getPublicSiteSettings, {});
  } catch {
    settings = null;
  }
  const contactEmail = settings?.contactEmail?.trim() || BUSINESS.email;
  const officeAddress = settings?.officeAddress?.trim() || formatBusinessAddress();
  const phone = settings?.whatsappPhone?.trim() || BUSINESS.phoneDisplay;
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
          title="Privacy & Cookie Policy"
          description={`Last updated ${LAST_UPDATED}. This explains what personal data JunketTours collects, why, who we share it with, how long we keep it, and the rights you have — wherever in the world you are travelling from.`}
        />

        <div className="mt-10 space-y-6">
          <Card className="p-6 md:p-8">
            <h2 className={h2}>1. Who we are (data controller)</h2>
            <p className={p}>
              <span className={strong}>{BUSINESS.legalName}</span> is a licensed tour
              operator based in Lahore, Pakistan, and is the controller of the personal data
              described in this policy for the website {base}.
            </p>
            <ul className={ul}>
              <li>Address: {officeAddress}</li>
              <li>
                Email:{" "}
                <a href={`mailto:${contactEmail}`} className="font-semibold text-havezic-primary hover:underline">
                  {contactEmail}
                </a>
              </li>
              <li>Phone / WhatsApp: {phone}</li>
            </ul>
            <p className={p}>
              We are not established in the EU or UK and have not appointed an EU/UK
              representative. You can contact us directly about any privacy matter using the
              details above.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>2. Data we collect</h2>
            <ul className={ul}>
              <li><span className={strong}>Enquiry details</span> — name, email, phone/WhatsApp number, country, and the message you send via our contact form, booking request, or WhatsApp.</li>
              <li><span className={strong}>Trip preferences</span> — destinations, dates, budget, group size, departure city and special requirements (e.g. accessibility or dietary needs you choose to tell us).</li>
              <li><span className={strong}>Account data</span> — if you register: name, email, phone and a securely hashed password.</li>
              <li><span className={strong}>Visa invitation data</span> — passport details, nationality, date of birth and travel dates you submit specifically for a visa invitation letter.</li>
              <li><span className={strong}>Booking records</span> — confirmed itineraries, invoices and payment references. We do not take or store card details on this website.</li>
              <li><span className={strong}>Technical data</span> — IP-derived country (to choose a display currency), device and browser type, pages viewed and performance metrics (see Cookies &amp; analytics).</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>3. Why we use it, and our legal basis</h2>
            <ul className={ul}>
              <li><span className={strong}>Answering enquiries, preparing quotes and delivering booked trips</span> — necessary to take steps at your request before entering into, and to perform, a contract with you.</li>
              <li><span className={strong}>Preparing visa invitation letters</span> — performance of the service you request.</li>
              <li><span className={strong}>Keeping booking and accounting records</span> — compliance with legal obligations (e.g. tax and tourism licensing rules in Pakistan).</li>
              <li><span className={strong}>AI-assisted itinerary drafts</span> — performance of the service you request; your trip preferences (never passport or payment details) are sent to our AI provider to generate a draft.</li>
              <li><span className={strong}>Site security, fraud prevention and aggregated, cookieless performance statistics</span> — our legitimate interests in running a safe, fast website.</li>
              <li><span className={strong}>Google Analytics</span> — only with your consent, which you can withdraw at any time.</li>
            </ul>
            <p className={p}>We do not use your data for automated decisions with legal effects, and we do not sell personal data.</p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 id="cookies" className={`${h2} scroll-mt-28`}>4. Cookies &amp; analytics</h2>
            <p className={p}>
              We ask for your choice with a cookie banner on your first visit. Non-essential
              analytics cookies are only set if you click &ldquo;Accept all&rdquo;.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm text-muted">
                <thead>
                  <tr className="border-b border-border text-foreground">
                    <th className="py-2 pr-4 font-semibold">Name</th>
                    <th className="py-2 pr-4 font-semibold">Purpose</th>
                    <th className="py-2 pr-4 font-semibold">Type</th>
                    <th className="py-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="[&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_tr]:border-b [&_tr]:border-border">
                  <tr><td>junket_session</td><td>Keeps you signed in to your account</td><td>Essential</td><td>Up to 14 days</td></tr>
                  <tr><td>jt_currency</td><td>Remembers your display currency (USD or PKR)</td><td>Essential</td><td>30 days</td></tr>
                  <tr><td>jt_cookie_consent (local storage)</td><td>Remembers your cookie choice</td><td>Essential</td><td>Until you clear it</td></tr>
                  <tr><td>_ga, _ga_*</td><td>Google Analytics 4 — how visitors use the site</td><td>Analytics (consent)</td><td>Up to 2 years</td></tr>
                </tbody>
              </table>
            </div>
            <p className={p}>
              We also use <span className={strong}>Vercel Web Analytics and Speed Insights</span>,
              which measure page views and page speed without cookies and without identifying
              individual visitors. Our AI planner and forms may keep an unsent draft in your
              browser&apos;s local storage so you don&apos;t lose your progress.
            </p>
            <p className={p}>
              Change or withdraw your choice at any time:{" "}
              <CookieSettingsLink className="font-semibold text-havezic-primary underline-offset-2 hover:underline" />
              .
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>5. Who we share data with</h2>
            <p className={p}>We share only what each party needs, with service providers acting on our instructions:</p>
            <ul className={ul}>
              <li><span className={strong}>Vercel</span> — website hosting, cookieless analytics and performance monitoring.</li>
              <li><span className={strong}>Convex</span> — secure cloud database for enquiries, accounts and bookings.</li>
              <li><span className={strong}>Resend</span> — sending confirmation and notification emails.</li>
              <li><span className={strong}>Groq</span> (AI language-model provider) — generating draft itineraries from the trip details you enter.</li>
              <li><span className={strong}>Google</span> — Analytics (with consent) and Maps (embedded office location; Google may set its own cookies when you interact with the map).</li>
              <li><span className={strong}>WhatsApp / Meta</span> — when you choose to message us on WhatsApp.</li>
              <li><span className={strong}>Hotels, transport operators, guides and permit authorities in Pakistan</span> — only for a trip you book, and Pakistani authorities where required for visas or by law.</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>6. International transfers</h2>
            <p className={p}>
              We operate from Pakistan and our technology providers may process data in the
              United States and other countries. These countries may not have data-protection
              laws equivalent to those in your home country (for example the EEA or UK). Where
              required, we rely on our providers&apos; standard contractual clauses or equivalent
              safeguards, and transfers necessary to arrange the trip you requested.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>7. How long we keep data</h2>
            <ul className={ul}>
              <li><span className={strong}>Enquiries that don&apos;t become bookings</span> — up to 24 months, then deleted or anonymised.</li>
              <li><span className={strong}>Booking and invoice records</span> — as long as required by Pakistani tax and licensing law (typically up to 6 years).</li>
              <li><span className={strong}>Passport details for visa invitations</span> — only as long as needed to issue the letter and handle follow-up questions from authorities, then deleted.</li>
              <li><span className={strong}>Accounts</span> — until you ask us to delete your account.</li>
              <li><span className={strong}>Analytics data</span> — Google Analytics retention is set to 14 months.</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>8. Security</h2>
            <p className={p}>
              Data is encrypted in transit (HTTPS), passwords are stored as one-way hashes,
              and access to enquiry and passport data is restricted to authorised staff. No
              system is perfectly secure; if a breach affects your data we will notify you
              where the law requires.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>9. Your rights</h2>
            <p className={p}>
              Wherever you live, you can ask us to:
            </p>
            <ul className={ul}>
              <li>access a copy of your personal data;</li>
              <li>correct inaccurate data or delete data we no longer need;</li>
              <li>restrict or object to processing based on legitimate interests;</li>
              <li>receive your data in a portable format;</li>
              <li>withdraw consent (e.g. analytics cookies) at any time, without affecting earlier processing.</li>
            </ul>
            <p className={p}>
              Email{" "}
              <a href={`mailto:${contactEmail}`} className="font-semibold text-havezic-primary hover:underline">
                {contactEmail}
              </a>{" "}
              with your request. We may ask you to verify your identity and will reply within
              one month. If you are in the EEA or UK and are unhappy with our response, you
              can complain to your local data protection authority (for example the ICO in
              the UK). Residents of California and other US states have similar rights to
              know, delete and correct their data — we do not sell or &ldquo;share&rdquo;
              personal data for cross-context behavioural advertising.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>10. Children</h2>
            <p className={p}>
              This site is not directed at children. We don&apos;t knowingly collect data from
              anyone under 16 except as part of a family booking made by a parent or guardian.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>11. Changes to this policy</h2>
            <p className={p}>
              We may update this policy as our services change. The date at the top shows the
              latest version; for material changes we will also highlight the update on the
              site.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className={h2}>12. Contact us</h2>
            <p className={p}>
              {BUSINESS.legalName}, {officeAddress}. Email{" "}
              <a href={`mailto:${contactEmail}`} className="font-semibold text-havezic-primary hover:underline">
                {contactEmail}
              </a>{" "}
              or use our{" "}
              <Link href="/contact" className="font-semibold text-havezic-primary hover:underline">
                contact page
              </Link>
              . See also our{" "}
              <Link href="/terms-of-service" className="font-semibold text-havezic-primary hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
