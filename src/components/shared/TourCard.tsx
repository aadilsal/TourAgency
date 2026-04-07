import Link from "next/link";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export type TourCardData = {
  slug: string;
  title: string;
  description: string;
  types?: string[];
  price: number;
  durationDays: number;
  location: string;
  images: string[];
};

type Props = {
  tour: TourCardData;
  badge?: string;
  className?: string;
};

export function TourCard({ tour, badge, className }: Props) {
  return (
    <Card
      hover
      className={cn(
        "flex h-full min-h-[28rem] flex-col overflow-hidden p-0",
        className,
      )}
    >
      <div className="relative h-56 bg-slate-200">
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
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-primary/25 to-brand-accent/20 text-sm text-brand-muted">
            Photo soon
          </div>
        )}
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-brand-cta px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-semibold text-brand-ink">
          {tour.title}
        </h3>
        <p className="mt-2 text-sm font-semibold text-brand-accent">
          PKR {tour.price.toLocaleString()} · {tour.durationDays} days
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-brand-muted">{tour.location}</p>
        <div className="mt-auto flex gap-2 pt-5">
          <ButtonLink
            href={`/tours/${tour.slug}`}
            variant="secondary"
            className="flex-1 justify-center py-2.5 text-center text-sm"
          >
            View details
          </ButtonLink>
          <ButtonLink
            href={`/tours/${tour.slug}#book`}
            variant="primary"
            className="flex-1 justify-center py-2.5 text-center text-sm"
          >
            Book now
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
      className="block h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition-shadow duration-300 hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] w-full bg-slate-200">
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
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-primary/15 to-brand-accent/20 text-xs text-brand-muted">
            Photo soon
          </div>
        )}
      </div>
      <div className="p-4 text-left">
        <p className="font-semibold text-brand-ink">{tour.title}</p>
        <p className="mt-1 text-sm font-medium text-brand-accent">
          PKR {tour.price.toLocaleString()} · {tour.durationDays}d
        </p>
      </div>
    </Link>
  );
}
