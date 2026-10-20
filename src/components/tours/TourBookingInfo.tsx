import Link from "next/link";
import {
  BadgeCheck,
  Check,
  Clock,
  MessageCircle,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";

type PerHead = { persons: number; label: string };

const TRUST = [
  {
    icon: Wallet,
    title: "No payment to request",
    body: "Send your request for free — you only pay once we've confirmed everything.",
  },
  {
    icon: Clock,
    title: "Quick reply",
    body: "Our team confirms availability and details within hours.",
  },
  {
    icon: SlidersHorizontal,
    title: "Tailored to your group",
    body: "Dates, hotels and pace can be adjusted to suit you.",
  },
  {
    icon: BadgeCheck,
    title: "Licensed local operator",
    body: "Run by Junket Tours, a licensed tour operator based in Lahore.",
  },
];

const STEPS = [
  {
    title: "Send a request",
    body: "Pick your dates and group size — no payment needed.",
  },
  {
    title: "We confirm",
    body: "We check hotels and transport and send you the final plan.",
  },
  {
    title: "Pay the advance",
    body: "Pay the advance to secure your trip — we send you the payment details.",
  },
];

/**
 * Left column of the tour page's "Dates and prices" section: trust points,
 * price summary and how booking works — the reassurance big tour sites show
 * next to their booking box. Every claim here matches how Junket Tours works
 * (lead-only booking, no online payment).
 */
export function TourBookingInfo({
  included,
  perHead,
  whatsappUrl,
  bookable,
}: {
  included: string[];
  perHead: PerHead[];
  whatsappUrl: string | null;
  bookable: boolean;
}) {
  const topIncluded = included.slice(0, 5);
  return (
    <div className="space-y-6">
      <ul className="grid gap-4 sm:grid-cols-2">
        {TRUST.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="flex gap-3 rounded-2xl border border-border bg-panel p-4"
          >
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-havezic-primary/10 text-havezic-primary"
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-foreground">
                {title}
              </span>
              <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                {body}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 md:grid-cols-2">
        {topIncluded.length > 0 ? (
          <div className="rounded-2xl border border-border bg-panel p-5">
            <h3 className="font-bold text-foreground">
              {bookable ? "What's in the price" : "What's included"}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {topIncluded.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="#inclusions"
              className="mt-3 inline-block text-sm font-semibold text-havezic-primary hover:underline"
            >
              See everything that&apos;s included
            </a>
          </div>
        ) : null}

        <div className="rounded-2xl border border-border bg-panel p-5">
          <h3 className="font-bold text-foreground">How booking works</h3>
          <ol className="mt-3 space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-havezic-primary text-xs font-bold text-white"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="text-sm">
                  <span className="block font-semibold text-foreground">
                    {s.title}
                  </span>
                  <span className="block leading-relaxed text-muted">
                    {s.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {perHead.length > 0 ? (
        <div className="rounded-2xl border border-border bg-panel p-5">
          <h3 className="font-bold text-foreground">Price per person</h3>
          <p className="mt-1 text-sm text-muted">
            The bigger your group, the less each person pays.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {perHead.map((o) => (
              <div
                key={o.persons}
                className="rounded-xl bg-havezic-background-light px-3 py-2.5"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {o.persons} {o.persons === 1 ? "traveller" : "travellers"}
                </dt>
                <dd className="text-lg font-bold text-foreground">
                  {o.label}{" "}
                  <span className="text-xs font-medium text-muted">each</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-2xl bg-brand-primary p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold">Questions about this trip?</h3>
          <p className="mt-1 text-sm text-white/80">
            Talk to our trip experts — we&apos;ll help you choose dates, hotels
            and the best route.
          </p>
          <p className="mt-2 text-xs text-white/70">
            Read our{" "}
            <Link
              href="/cancellation-policy"
              className="underline hover:text-white"
            >
              cancellation policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-primary hover:bg-white/90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Chat on WhatsApp
            </a>
          ) : null}
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:border-white"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
