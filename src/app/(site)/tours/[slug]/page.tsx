import { notFound } from "next/navigation";
import { api } from "@convex/_generated/api";
import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { TourJsonLd } from "@/components/TourJsonLd";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { getSiteUrl } from "@/lib/site";
import { getWhatsAppClickUrl } from "@/lib/whatsapp-server";
import type { Id } from "@convex/_generated/dataModel";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageLoadingSpinner } from "@/components/ui/PageLoadingSpinner";
import type { TourCardData } from "@/components/shared/TourCard";
import { Clock, MapPin, Star } from "lucide-react";
import { TourDetailTabs } from "@/components/tours/TourDetailTabs";
import { TourReviews } from "@/components/tours/TourReviews";
import { TourItineraryAccordion } from "@/components/tours/TourItineraryAccordion";
import { loadTourBySlug } from "@/lib/tours-server";
import { getConvexServer } from "@/lib/convex-server";
import { getServerCurrency } from "@/lib/currency-server";
import { formatTourPrice, getTourUnitPrice, tourHasPrice } from "@/lib/tourPricing";
import { Users } from "lucide-react";
import Image from "next/image";

function lazyBlock(label: string, minH: string) {
  function LoadingBlock() {
    return (
      <div
        className={`flex ${minH} items-center justify-center rounded-2xl border border-white/10 bg-white/5`}
      >
        <PageLoadingSpinner label={label} variant="dark" size="sm" />
      </div>
    );
  }

  LoadingBlock.displayName = `LoadingBlock(${label})`;
  return LoadingBlock;
}

const TourImageGallery = nextDynamic(
  () =>
    import("@/components/TourImageGallery").then((m) => ({
      default: m.TourImageGallery,
    })),
  { loading: lazyBlock("Loading gallery…", "min-h-[220px]"), ssr: false },
);

const TourStickyBooking = nextDynamic(
  () =>
    import("@/components/TourStickyBooking").then((m) => ({
      default: m.TourStickyBooking,
    })),
  { loading: lazyBlock("Loading booking…", "min-h-[200px]"), ssr: false },
);

const TourLocationMap = nextDynamic(
  () =>
    import("@/components/tours/TourLocationMap").then((m) => ({
      default: m.TourLocationMap,
    })),
  { loading: lazyBlock("Loading map…", "min-h-[200px]"), ssr: false },
);

const TourDetailRelatedCarousel = nextDynamic(
  () =>
    import("@/components/tours/TourDetailRelatedCarousel").then((m) => ({
      default: m.TourDetailRelatedCarousel,
    })),
  {
    loading: lazyBlock("Loading related tours…", "min-h-[160px]"),
    ssr: false,
  },
);

export const dynamic = "force-dynamic";

type TourDetail = {
  _id: Id<"tours">;
  title: string;
  slug: string;
  description: string;
  price: number;
  pricePkr?: number;
  priceUsd?: number;
  durationDays: number;
  location: string;
  maxPeople?: number;
  minAge?: number;
  ratingAvg?: number;
  reviewsCount?: number;
  highlights?: string[];
  included?: string[];
  excluded?: string[];
  images: string[];
  itinerary: Array<{ day: number; title: string; description: string }>;
  isActive: boolean;
};

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const tour = await loadTourBySlug(params.slug);
    if (!tour || !tour.isActive) {
      return { title: "Tour" };
    }
    const base = getSiteUrl();
    return {
      title: tour.title,
      description: tour.description.slice(0, 160),
      openGraph: {
        title: tour.title,
        description: tour.description.slice(0, 160),
        url: `${base}/tours/${tour.slug}`,
      },
    };
  } catch {
    return { title: "Tour" };
  }
}

function tourBadge(slug: string): "Popular" | "Limited slots" | "Guest favorite" {
  const h = slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  if (h % 3 === 0) return "Popular";
  if (h % 3 === 1) return "Limited slots";
  return "Guest favorite";
}

export default async function TourDetailPage({ params }: Props) {
  let tour: TourDetail | null = null;
  let relatedRaw: TourDetail[] = [];
  try {
    const client = getConvexServer();
    tour = (await loadTourBySlug(params.slug)) as TourDetail | null;
    if (tour?.isActive) {
      relatedRaw = (await client.query(api.tours.listRelatedTours, {
        excludeTourId: tour._id,
        limit: 24,
      })) as TourDetail[];
    }
  } catch {
    tour = null;
  }
  if (!tour || !tour.isActive) notFound();

  const whatsappUrl = await getWhatsAppClickUrl(
    `Hi JunketTours — I'm interested in: ${tour.title}`,
  );

  const relatedCards: TourCardData[] = relatedRaw.map((t) => ({
    slug: t.slug,
    title: t.title,
    description: t.description,
    price: t.price,
    pricePkr: t.pricePkr,
    priceUsd: t.priceUsd,
    durationDays: t.durationDays,
    location: t.location,
    images: t.images,
  }));

  const badge = tourBadge(tour.slug);
  const currency = getServerCurrency();
  const bookable = tourHasPrice(tour);
  const priceLabel = formatTourPrice(tour, currency);
  const unitPrice = getTourUnitPrice(tour, currency) || undefined;
  const hasRating =
    typeof tour.ratingAvg === "number" &&
    tour.ratingAvg > 0 &&
    typeof tour.reviewsCount === "number" &&
    tour.reviewsCount > 0;

  const highlights =
    tour.highlights && tour.highlights.length > 0
      ? tour.highlights
      : [
          "Handpicked viewpoints and photo stops",
          "Comfortable private transport",
          "Flexible pacing with local guidance",
        ];
  const included =
    tour.included && tour.included.length > 0
      ? tour.included
      : [
          "24/7 Expert assistance",
          "Professional driver",
          "Fuel, tolls & road taxes",
          "Hotel pickup & drop off",
        ];

  return (
    <main className="min-h-screen pb-28 lg:pb-20">
      <TourJsonLd tour={tour} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Tours", path: "/tours" },
          { name: tour.title, path: `/tours/${tour.slug}` },
        ]}
      />
      <PageContainer className="py-8 md:py-12">
        {/* Header — full width */}
        <header className="mb-8 md:mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-havezic-background-light px-3 py-1 text-xs font-bold uppercase tracking-wide text-havezic-primary ring-1 ring-border">
              {badge}
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {tour.title}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-muted md:text-lg">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <MapPin
                className="h-5 w-5 shrink-0 text-havezic-primary"
                aria-hidden
              />
              {tour.location}
            </span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
              <Clock className="h-4 w-4 text-havezic-primary" aria-hidden />
              {tour.durationDays} days
            </span>
            {typeof tour.maxPeople === "number" && tour.maxPeople > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
                <Users className="h-4 w-4 text-havezic-primary" aria-hidden />
                Up to {tour.maxPeople} guests
              </span>
            ) : null}
            {hasRating ? (
              <a
                href="#reviews"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm hover:border-border-strong"
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                {tour.ratingAvg!.toFixed(1)} · {tour.reviewsCount} review
                {tour.reviewsCount === 1 ? "" : "s"}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                Highly rated experiences
              </span>
            )}
            {bookable && priceLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-havezic-primary/30 bg-havezic-primary/10 px-3 py-1.5 text-sm font-semibold text-havezic-primary backdrop-blur-sm">
                From {priceLabel} / person
              </span>
            ) : null}
          </div>
        </header>

        {/* Gallery — full width */}
        <TourImageGallery images={tour.images} title={tour.title} />

        <div className="mt-6 md:mt-8">
          <TourDetailTabs />
        </div>

        {/* Main: booking appears before content on mobile (single-column grid flow) */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-10 lg:gap-12">
          <aside className="lg:order-2 lg:col-span-3">
            <TourStickyBooking
              tourId={tour._id}
              tourTitle={tour.title}
              durationDays={tour.durationDays}
              location={tour.location}
              whatsappUrl={whatsappUrl}
              bookable={bookable}
              priceLabel={priceLabel}
              unitPrice={unitPrice}
              currency={currency}
            />

            {relatedCards.length > 0 ? (
              <section className="mt-6 rounded-2xl border border-border bg-panel p-5 shadow-sm">
                <h3 className="text-base font-bold text-foreground">Related tours</h3>
                <div className="mt-4 space-y-3">
                  {relatedCards.slice(0, 3).map((t) => (
                    <a
                      key={t.slug}
                      href={`/tours/${t.slug}`}
                      className="group flex items-center gap-3 rounded-2xl border border-border bg-panel-elevated p-3 transition hover:bg-panel"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-200 ring-1 ring-border">
                        <Image
                          src={t.images?.[0] || "/placeholder.jpg"}
                          alt=""
                          width={48}
                          height={48}
                          sizes="48px"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground group-hover:text-havezic-primary">
                          {t.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {t.durationDays} days · {t.location}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>

          <article className="min-w-0 lg:order-1 lg:col-span-7">
            <section
              id="overview"
              className="scroll-mt-28 rounded-2xl border border-border bg-panel p-6 shadow-sm md:p-8"
            >
              <h2 className="text-lg font-bold text-foreground">About this tour</h2>
              <p className="mt-4 whitespace-pre-wrap leading-relaxed text-muted">
                {tour.description}
              </p>

              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="text-base font-bold text-foreground">Highlights</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {highlights.map((x) => (
                      <li key={x} className="flex gap-2">
                        <span
                          className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-havezic-primary/15 text-havezic-primary"
                          aria-hidden
                        >
                          ✓
                        </span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">What’s Included</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {included.map((x) => (
                      <li key={x} className="flex gap-2">
                        <span
                          className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600"
                          aria-hidden
                        >
                          ✓
                        </span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {tour.excluded && tour.excluded.length > 0 ? (
                <div className="mt-8">
                  <h3 className="text-base font-bold text-foreground">Not included</h3>
                  <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
                    {tour.excluded.map((x) => (
                      <li key={x} className="flex gap-2">
                        <span
                          className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600"
                          aria-hidden
                        >
                          ✕
                        </span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section id="tour-plan" className="mt-10 scroll-mt-28 md:mt-12">
              <h2 className="text-2xl font-bold text-foreground">Itinerary</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Day-by-day flow — timings may shift slightly with weather and road
                conditions.
              </p>
              <TourItineraryAccordion itinerary={tour.itinerary} />
            </section>

            <div id="location" className="mt-10 scroll-mt-28 md:mt-12">
              <TourLocationMap location={tour.location} title={tour.title} />
            </div>

            <TourReviews tourId={tour._id} />

            <TourDetailRelatedCarousel
              tours={relatedCards}
              currentSlug={tour.slug}
            />
          </article>
        </div>
      </PageContainer>
    </main>
  );
}
