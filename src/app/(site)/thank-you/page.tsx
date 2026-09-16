import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Home,
  Mail,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { LeadConversionEvent } from "@/components/analytics/LeadConversionEvent";
import { getWhatsAppClickUrl } from "@/lib/whatsapp-server";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Thank you",
  description:
    "Your request has reached the JunketTours team. Here's what happens next and how to reach us on WhatsApp.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

type ThankYouKind =
  | "booking"
  | "contact"
  | "visa"
  | "itinerary"
  | "newsletter"
  | "review"
  | "generic";

type Step = { icon: LucideIcon; title: string; body: string };

type Content = {
  eyebrow: string;
  heading: string;
  lead: string;
  refLabel: string;
  steps: Step[];
  whatsappMessage: string;
};

const CONTENT: Record<ThankYouKind, Content> = {
  booking: {
    eyebrow: "Booking request received",
    heading: "Your tour request is in",
    lead: "Thank you for choosing JunketTours. A trip specialist is already looking at your dates and group size.",
    refLabel: "Booking reference",
    steps: [
      {
        icon: Clock,
        title: "We check availability",
        body: "We confirm guides, transport, and hotels for your preferred dates — usually the same day.",
      },
      {
        icon: MessageCircle,
        title: "We reply within 24 hours",
        body: "Expect a WhatsApp message or email with your confirmed itinerary and a written quote.",
      },
      {
        icon: ShieldCheck,
        title: "Confirm when you're ready",
        body: "No payment was taken online. You only pay a deposit once you've approved the plan in writing.",
      },
    ],
    whatsappMessage: "Hi JunketTours — I just sent a booking request and have a question.",
  },
  contact: {
    eyebrow: "Message received",
    heading: "Thanks for getting in touch",
    lead: "Your message is with our team. Real people read every inquiry — no bots, no auto-replies.",
    refLabel: "Inquiry reference",
    steps: [
      {
        icon: FileText,
        title: "We read your message",
        body: "Your inquiry is logged so the right specialist can pick it up, even outside office hours.",
      },
      {
        icon: MessageCircle,
        title: "We reply within 24 hours",
        body: "We'll get back to you on WhatsApp, phone, or email — whichever you shared with us.",
      },
      {
        icon: Compass,
        title: "Start planning together",
        body: "Tell us more about your dates and interests and we'll shape a trip around them.",
      },
    ],
    whatsappMessage: "Hi JunketTours — I just sent a message through your contact form.",
  },
  visa: {
    eyebrow: "Visa invitation request received",
    heading: "Your visa request is with our licensed team",
    lead: "Thank you. Your passport details were submitted securely and are used only to prepare your invitation letter.",
    refLabel: "Request reference",
    steps: [
      {
        icon: ShieldCheck,
        title: "We verify your details",
        body: "Our licensed team reviews each traveler's passport information for accuracy.",
      },
      {
        icon: Mail,
        title: "We contact you within 24–48 hours",
        body: "We'll reach you by email or WhatsApp to confirm details and any fees before we prepare the letter.",
      },
      {
        icon: FileText,
        title: "Receive your invitation letter",
        body: "Once confirmed, we issue the official letter you'll need for your Pakistan tourist visa application.",
      },
    ],
    whatsappMessage: "Hi JunketTours — I just submitted a visa invitation request.",
  },
  itinerary: {
    eyebrow: "Custom itinerary request received",
    heading: "We're reviewing your custom plan",
    lead: "Thank you. Your AI-drafted itinerary and preferences have been sent to a trip specialist for review.",
    refLabel: "Request reference",
    steps: [
      {
        icon: Compass,
        title: "A specialist refines your plan",
        body: "We check routes, drive times, seasons, and hotels so the plan works on the ground.",
      },
      {
        icon: MessageCircle,
        title: "We reply within 24 hours",
        body: "You'll get a tailored itinerary and a quote on WhatsApp or email.",
      },
      {
        icon: ShieldCheck,
        title: "Tweak it until it's right",
        body: "Change anything you like before confirming — nothing is booked without your go-ahead.",
      },
    ],
    whatsappMessage: "Hi JunketTours — I just sent a custom itinerary request.",
  },
  newsletter: {
    eyebrow: "You're subscribed",
    heading: "Welcome to the JunketTours list",
    lead: "Thanks for signing up. We only send the good stuff — seasonal routes, subscriber-only deals, and trip ideas.",
    refLabel: "Reference",
    steps: [
      {
        icon: Mail,
        title: "Watch your inbox",
        body: "Our next update will include fresh departures and travel tips for Pakistan.",
      },
      {
        icon: Compass,
        title: "Explore in the meantime",
        body: "Browse heritage tours and destination guides to start shortlisting.",
      },
    ],
    whatsappMessage: "Hi JunketTours — I just subscribed and have a question.",
  },
  review: {
    eyebrow: "Review submitted",
    heading: "Thank you for sharing your trip",
    lead: "Your review helps other travellers plan with confidence. It will appear once our team has approved it.",
    refLabel: "Reference",
    steps: [
      {
        icon: Star,
        title: "We moderate every review",
        body: "Reviews are checked for authenticity, usually within a couple of days.",
      },
      {
        icon: Compass,
        title: "Plan your next adventure",
        body: "Ready for another trip? Browse tours or ask us for something custom.",
      },
    ],
    whatsappMessage: "Hi JunketTours — I just left a review and have a question.",
  },
  generic: {
    eyebrow: "Request received",
    heading: "Thank you",
    lead: "We've received your details and our team will be in touch soon.",
    refLabel: "Reference",
    steps: [
      {
        icon: FileText,
        title: "We review your request",
        body: "A member of our team checks the details you sent us.",
      },
      {
        icon: MessageCircle,
        title: "We reply within 24 hours",
        body: "Expect a message on WhatsApp or email with the next steps.",
      },
    ],
    whatsappMessage: "Hi JunketTours — I have a question about my request.",
  },
};

function resolveKind(raw: string | string[] | undefined): ThankYouKind {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && v in CONTENT && v !== "generic") return v as ThankYouKind;
  return "generic";
}

/** Only short alphanumeric references are echoed back, never arbitrary text. */
function resolveRef(raw: string | string[] | undefined): string | undefined {
  const v = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (!v) return undefined;
  return /^[A-Za-z0-9-]{3,32}$/.test(v) ? v.toUpperCase() : undefined;
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: { type?: string | string[]; ref?: string | string[] };
}) {
  const kind = resolveKind(searchParams.type);
  const ref = resolveRef(searchParams.ref);
  const content = CONTENT[kind];
  const whatsappUrl = await getWhatsAppClickUrl(
    ref ? `${content.whatsappMessage} (Ref: ${ref})` : content.whatsappMessage,
  );

  return (
    <main className="min-h-screen py-16 md:py-24">
      <LeadConversionEvent formType={kind} reference={ref} />
      <PageContainer className="max-w-3xl">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-gradient-to-br from-emerald-50 via-white to-havezic-background-light px-6 py-10 text-center md:px-10 md:py-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden />
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-havezic-primary">
              {content.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {content.heading}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
              {content.lead}
            </p>
            {ref ? (
              <p className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm shadow-sm">
                <span className="text-muted">{content.refLabel}:</span>
                <span className="font-mono font-semibold tracking-wider text-foreground">
                  {ref}
                </span>
              </p>
            ) : null}
          </div>

          <div className="px-6 py-8 md:px-10 md:py-10">
            <h2 className="text-lg font-bold text-foreground">What happens next</h2>
            <ol className="mt-6 space-y-5">
              {content.steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-havezic-primary/10 text-havezic-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">
                        <span className="sr-only">Step {i + 1}: </span>
                        {step.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/tours" variant="primary" className="sm:flex-1">
                <Compass className="h-4 w-4" aria-hidden />
                Browse tours
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonClass("secondary", "sm:flex-1"),
                    "border-emerald-200 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50",
                  )}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  WhatsApp us
                </a>
              ) : null}
              <ButtonLink href="/" variant="ghost" className="sm:flex-1">
                <Home className="h-4 w-4" aria-hidden />
                Back home
              </ButtonLink>
            </div>

            {kind === "booking" ? (
              <p className="mt-6 text-center text-sm text-muted">
                Have an account?{" "}
                <Link
                  href={`/login?next=${encodeURIComponent("/dashboard/bookings")}`}
                  className="font-semibold text-havezic-primary hover:underline"
                >
                  Track your request in your dashboard
                </Link>
                .
              </p>
            ) : null}
          </div>
        </Card>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted">
          <PhoneCall className="h-4 w-4" aria-hidden />
          Something urgent? Message us on WhatsApp{ref ? " and mention your reference" : ""} —
          we&apos;re happy to help.
        </p>
      </PageContainer>
    </main>
  );
}
