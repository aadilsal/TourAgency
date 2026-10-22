import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarClock, CalendarX, RotateCcw } from "lucide-react";

/**
 * Refund policy summary on every tour page. Mirrors /cancellation-policy —
 * keep both in step when the policy changes.
 */
const TIERS = [
  {
    icon: CalendarCheck,
    when: "30+ days before departure",
    refund: "Full refund",
    note: "of amounts paid, less any bank transfer charges.",
    tone: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: CalendarClock,
    when: "14–29 days before departure",
    refund: "50% refund",
    note: "of amounts paid.",
    tone: "text-amber-600 bg-amber-50",
  },
  {
    icon: CalendarX,
    when: "13 days or less, or no-show",
    refund: "Non-refundable",
    note: "hotels, transport and guides are usually already booked and paid.",
    tone: "text-rose-600 bg-rose-50",
  },
];

export function TourRefundPolicy() {
  return (
    <section id="refund-policy" className="mt-12 scroll-mt-40 md:mt-16">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-havezic-primary/10 text-havezic-primary"
          aria-hidden
        >
          <RotateCcw className="h-5 w-5" />
        </span>
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">Refund policy</h2>
      </div>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {TIERS.map(({ icon: Icon, when, refund, note, tone }) => (
          <li key={when} className="rounded-2xl border border-border bg-panel p-5">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${tone}`} aria-hidden>
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-sm font-semibold text-muted">{when}</p>
            <p className="mt-1 text-lg font-bold text-foreground">{refund}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2 rounded-2xl bg-havezic-background-light p-5 text-sm leading-relaxed text-muted">
        <p>
          <span className="font-semibold text-foreground">If we have to change or cancel</span> because
          of weather, road closures or government restrictions, we offer revised dates, an adjusted
          route, or a full refund of the affected part of your trip.
        </p>
        <p>
          Visa invitation fees, flights, third-party permits and other costs a supplier confirms as
          non-refundable aren&apos;t covered. Approved refunds go back to the account you paid from,
          usually within 7–14 business days.
        </p>
        <Link
          href="/cancellation-policy"
          className="inline-flex items-center gap-1 font-semibold text-havezic-primary hover:underline"
        >
          Read the full cancellation &amp; refund policy
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
