import Link from "next/link";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import type { CurrencyCode } from "@/lib/money";
import {
  formatTourPrice,
  getPerHeadOptions,
  tourHasPrice,
  type PerHeadPrice,
} from "@/lib/tourPricing";

export type TourCardData = {
  slug: string;
  title: string;
  description: string;
  types?: string[];
  price: number; // legacy — not shown publicly
  /** Total price for the whole tour. */
  pricePkr?: number;
  priceUsd?: number;
  perHeadPrices?: PerHeadPrice[];
  durationDays: number;
  location: string;
  images: string[];
};

type Props = {
  tour: TourCardData;
  badge?: string;
  className?: string;
  currency?: CurrencyCode;
};

export function TourCard({ tour, badge, className, currency = "USD" }: Props) {
  const bookable = tourHasPrice(tour);
  const priceLabel = formatTourPrice(tour, currency);
  // Cards only have room for the cheapest per-head rate; the detail page lists
  // every option. Empty when no per-head pricing is set, which hides the line.
  const cheapestPerHead = getPerHeadOptions(tour, currency).reduce<
    ReturnType<typeof getPerHeadOptions>[number] | null
  >((best, o) => (best === null || o.amount < best.amount ? o : best), null);
  return (
    <Card
      hover
      className={cn(
        "flex h-full min-h-[28rem] flex-col overflow-hidden p-0",
        className,
      )}
    >
      <div className="relative h-56 bg-black/20">
        {tour.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tour.images[0]}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-black/20 to-havezic-primary/15 text-sm text-white/70">
            Photo soon
          </div>
        )}
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-havezic-primary px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-semibold text-foreground">
          {tour.title}
        </h3>
        <p className="mt-2 text-sm font-semibold text-havezic-primary">
          {tour.durationDays} days · {tour.location}
        </p>
        {bookable && priceLabel ? (
          <p className="mt-1 text-sm text-muted">
            <span className="text-base font-bold text-foreground">{priceLabel}</span>
            <span className="text-xs"> total tour</span>
          </p>
        ) : null}
        {cheapestPerHead ? (
          <p className={cn("text-sm text-muted", bookable && priceLabel ? "" : "mt-1")}>
            <span className="font-bold text-foreground">{cheapestPerHead.label}</span>
            <span className="text-xs">
              {" "}
              / person for {cheapestPerHead.persons}
              {cheapestPerHead.persons === 1 ? " person" : " persons"}
            </span>
          </p>
        ) : null}
        {!(bookable && priceLabel) && !cheapestPerHead ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            Tailored quote on request
          </p>
        ) : null}
        <div className="mt-auto flex flex-col gap-2 pt-5">
          <ButtonLink
            href={`/tours/${tour.slug}`}
            variant="secondary"
            className="w-full justify-center py-2.5 text-center text-sm"
          >
            View details
          </ButtonLink>
          <ButtonLink
            href={`/tours/${tour.slug}#book`}
            variant="primary"
            className="w-full justify-center whitespace-nowrap py-2.5 text-center text-sm"
          >
            {bookable ? "Book now" : "Customise"}
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

/** Compact card for destination / related tour strips */
export function TourCardCompact({ tour }: { tour: TourCardData }) {
  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="block h-full overflow-hidden rounded-2xl border border-border bg-panel shadow-sm transition-shadow duration-300 hover:border-border-strong"
    >
      <div className="relative aspect-[16/10] w-full bg-black/20">
        {tour.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tour.images[0]}
            alt=""
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-black/15 to-havezic-primary/15 text-xs text-white/70">
            Photo soon
          </div>
        )}
      </div>
      <div className="p-4 text-left">
        <p className="font-semibold text-foreground">{tour.title}</p>
        <p className="mt-1 text-sm font-medium text-havezic-primary">
          {tour.durationDays}d · {tour.location}
        </p>
      </div>
    </Link>
  );
}
