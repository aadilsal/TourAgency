import { notFound } from "next/navigation";
import Link from "next/link";
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
import {
  Clock,
  Users,
  Star,
  ChevronRight,
  Check,
  X as XIcon,
  MapPin,
  Utensils,
} from "lucide-react";
import { TourDetailTabs } from "@/components/tours/TourDetailTabs";
import { TourReviews } from "@/components/tours/TourReviews";
import { TourItineraryAccordion } from "@/components/tours/TourItineraryAccordion";
import { TourHeroGallery } from "@/components/tours/TourHeroGallery";
import { loadTourBySlug } from "@/lib/tours-server";
import { getConvexServer } from "@/lib/convex-server";
import { getServerCurrency } from "@/lib/currency-server";
import { formatTourPrice, getTourUnitPrice, tourHasPrice } from "@/lib/tourPricing";

function lazyBlock(label: string, minH: string) {
  function LoadingBlock() {
    return (
      <div
        className={`flex ${minH} items-center justify-center rounded-2xl border border-border bg-panel`}
      >
        <PageLoadingSpinner label={label} size="sm" />
      </div>
    );
  }
  LoadingBlock.displayName = `LoadingBlock(${label})`;
  return LoadingBlock;
}

const TourStickyBooking = nextDynamic(
  () =>
    import("@/components/TourStickyBooking").then((m) => ({
      default: m.TourStickyBooking,
    })),
  { loading: lazyBlock("Loading booking…", "min-h-[200px]"), ssr: false },
);

const TourRouteMap = nextDynamic(
  () =>
    import("@/components/tours/TourRouteMap").then((m) => ({
      default: m.TourRouteMap,
    })),
  { loading: lazyBlock("Loading map…", "min-h-[200px]"), ssr: false },
);

const TourDetailRelatedCarousel = nextDynamic(
  () =>
    import("@/components/tours/TourDetailRelatedCarousel").then((m) => ({
      default: m.TourDetailRelatedCarousel,
    })),
  { loading: lazyBlock("Loading related tours…", "min-h-[160px]"), ssr: false },
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
  tourTypeLabel?: string;
  types?: string[];
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
    if (!tour || !tour.isActive) return { title: "Tour" };
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

/** Extract a clean place name from a day title, for Start/End facts. */
function cleanPlace(raw: string, takeLast = false): string {
  const base = raw.replace(/^\s*day\s*\d+\s*[:.\-]?\s*/i, "").trim();
  const parts = base
    .split(/\s*(?:-|–|—|→|\bto\b|,|&)\s*/i)
    .map((x) => x.trim())
    .filter(Boolean);
  const pick = takeLast ? parts[parts.length - 1] : parts[0];
  const cleaned = (pick || base)
    .replace(/\b(explore|arrive in|arrive|arrival|departure|depart|drive|travel|visit|day)\b/gi, "")
    .trim();
  return (cleaned || base).slice(0, 32);
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

  const currency = getServerCurrency();
  const bookable = tourHasPrice(tour);
  const priceLabel = formatTourPrice(tour, currency);
  const unitPrice = getTourUnitPrice(tour, currency) || undefined;
  const hasRating =
    typeof tour.ratingAvg === "number" &&
    tour.ratingAvg > 0 &&
    typeof tour.reviewsCount === "number" &&
    tour.reviewsCount > 0;

  const startCity = tour.itinerary[0]
    ? cleanPlace(tour.itinerary[0].title)
    : tour.location;
  const endCity = tour.itinerary.length
    ? cleanPlace(tour.itinerary[tour.itinerary.length - 1]!.title, true)
    : tour.location;

  const highlights =
    tour.highlights && tour.highlights.length > 0 ? tour.highlights : [];
  const included =
    tour.included && tour.included.length > 0 ? tour.included : [];
  const excluded =
    tour.excluded && tour.excluded.length > 0 ? tour.excluded : [];
  const tripCode = tour.slug.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();

  const tabs = [
    { id: "overview", label: "About the trip" },
    { id: "tour-plan", label: "Itinerary" },
    { id: "inclusions", label: "Inclusions" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <main className="min-h-screen pb-28 lg:pb-16">
      <TourJsonLd tour={tour} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Tours", path: "/tours" },
          { name: tour.title, path: `/tours/${tour.slug}` },
        ]}
      />

      <PageContainer className="py-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-havezic-primary">Home</Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
          <Link href="/tours" className="hover:text-havezic-primary">Tours</Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
          <span className="font-semibold text-foreground">{tour.title}</span>
        </nav>

        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {tour.title}
        </h1>

        {/* Hero + facts card */}
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="lg:col-span-2">
            <TourHeroGallery images={tour.images} title={tour.title} />

            <section id="overview" className="mt-8 scroll-mt-28">
              {tour.description.split("\n").filter(Boolean)[0] ? (
                <p className="text-lg font-semibold text-foreground">
                  {tour.description.split("\n").filter(Boolean)[0]}
                </p>
              ) : null}
              <div className="mt-2 whitespace-pre-wrap leading-relaxed text-muted">
                {tour.description.split("\n").filter(Boolean).slice(1).join("\n") ||
                  tour.description}
              </div>
            </section>
          </div>

          {/* Facts card */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-panel p-6 shadow-sm">
              {hasRating ? (
                <a href="#reviews" className="flex items-center gap-2 text-sm">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />
                  <span className="text-lg font-bold text-foreground">
                    {tour.ratingAvg!.toFixed(1)}
                  </span>
                  <span className="text-havezic-primary underline">
                    {tour.reviewsCount} review{tour.reviewsCount === 1 ? "" : "s"}
                  </span>
                </a>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />
                  New — be the first to review
                </p>
              )}

              <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                <p className="text-foreground">
                  <span className="text-muted">Start:</span>{" "}
                  <span className="font-semibold">{startCity}</span>
                </p>
                <p className="text-foreground">
                  <span className="text-muted">End:</span>{" "}
                  <span className="font-semibold">{endCity}</span>
                </p>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-4 text-sm">
                <div>
                  <dt className="text-muted">Duration</dt>
                  <dd className="font-semibold text-foreground">{tour.durationDays} days</dd>
                </div>
                {typeof tour.maxPeople === "number" && tour.maxPeople > 0 ? (
                  <div>
                    <dt className="text-muted">Group size</dt>
                    <dd className="font-semibold text-foreground">1 to {tour.maxPeople}</dd>
                  </div>
                ) : null}
                {typeof tour.minAge === "number" && tour.minAge > 0 ? (
                  <div>
                    <dt className="text-muted">Minimum age</dt>
                    <dd className="font-semibold text-foreground">{tour.minAge} years</dd>
                  </div>
                ) : null}
                {tour.tourTypeLabel ? (
                  <div>
                    <dt className="text-muted">Style</dt>
                    <dd className="font-semibold text-foreground">{tour.tourTypeLabel}</dd>
                  </div>
                ) : null}
                {tour.types && tour.types.length > 0 ? (
                  <div className="col-span-2">
                    <dt className="text-muted">Theme</dt>
                    <dd className="font-semibold capitalize text-foreground">
                      {tour.types.join(", ")}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-5 border-t border-border pt-5">
                {bookable && priceLabel ? (
                  <p className="text-sm text-muted">
                    From{" "}
                    <span className="text-2xl font-extrabold text-foreground">{priceLabel}</span>
                    <span className="text-sm"> / person</span>
                  </p>
                ) : (
                  <p className="text-base font-semibold text-foreground">Tailored quote on request</p>
                )}
                <a
                  href="#book"
                  className="mt-4 flex w-full items-center justify-center rounded-full bg-brand-cta px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
                >
                  {bookable ? "Dates and prices" : "Customise this tour"}
                </a>
              </div>

              <p className="mt-4 text-right text-xs text-muted">Trip code: {tripCode}</p>
            </div>
          </aside>
        </div>

        {/* Why you'll love this trip */}
        {highlights.length > 0 ? (
          <section className="mt-14 grid gap-8 md:mt-20 lg:grid-cols-[1fr_2fr] lg:gap-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Why you&apos;ll love this trip
            </h2>
            <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {highlights.map((h) => (
                <li key={h} className="flex gap-3 text-muted">
                  <span
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-havezic-primary/15 text-havezic-primary"
                    aria-hidden
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Sticky sub-nav */}
        <div className="sticky top-16 z-30 mt-12 md:mt-16 lg:top-[5.5rem]">
          <TourDetailTabs tabs={tabs} />
        </div>

        {/* Itinerary: map + accordion */}
        <section id="tour-plan" className="mt-10 scroll-mt-32 md:mt-14">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Itinerary</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Day-by-day flow — timings may shift slightly with weather and road conditions.
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="lg:self-start">
              <TourRouteMap
                location={tour.location}
                title={tour.title}
                itinerary={tour.itinerary}
              />
            </div>
            <div>
              <TourItineraryAccordion itinerary={tour.itinerary} />
            </div>
          </div>
        </section>

        {/* Inclusions and activities */}
        <section id="inclusions" className="mt-12 scroll-mt-32 md:mt-16">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            Inclusions and activities
          </h2>
          <div className="mt-6 rounded-3xl bg-havezic-background-light p-6 md:p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
                  <div>
                    <p className="font-bold text-foreground">Destinations</p>
                    <p className="mt-1 text-sm text-muted">{tour.location}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
                  <div>
                    <p className="font-bold text-foreground">Duration</p>
                    <p className="mt-1 text-sm text-muted">{tour.durationDays} days</p>
                  </div>
                </div>
                {typeof tour.maxPeople === "number" && tour.maxPeople > 0 ? (
                  <div className="flex gap-3">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
                    <div>
                      <p className="font-bold text-foreground">Group size</p>
                      <p className="mt-1 text-sm text-muted">1 to {tour.maxPeople} travellers</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-6">
                {included.length > 0 ? (
                  <div className="flex gap-3">
                    <Utensils className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
                    <div>
                      <p className="font-bold text-foreground">Included</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-muted">
                        {included.map((x) => (
                          <li key={x} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
                {excluded.length > 0 ? (
                  <div className="flex gap-3">
                    <XIcon className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
                    <div>
                      <p className="font-bold text-foreground">Not included</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-muted">
                        {excluded.map((x) => (
                          <li key={x} className="flex gap-2">
                            <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
                {included.length === 0 && excluded.length === 0 ? (
                  <p className="text-sm text-muted">
                    Full inclusions are confirmed with your tailored quote.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Dates and prices / booking */}
        <section id="book" className="mt-12 scroll-mt-32 md:mt-16">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            {bookable ? "Dates and prices" : "Plan this tour"}
          </h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-panel p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Duration</p>
                  <p className="text-lg font-bold text-foreground">{tour.durationDays} days</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Route</p>
                  <p className="text-lg font-bold text-foreground">
                    {startCity} → {endCity}
                  </p>
                </div>
                {bookable && priceLabel ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">From</p>
                    <p className="text-lg font-bold text-havezic-primary">{priceLabel} / person</p>
                  </div>
                ) : null}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-muted">
                {bookable
                  ? "Pick your preferred start date and group size on the right to request this departure at the listed price. Our team confirms availability and payment details within hours."
                  : "Tell us your preferred dates and group size on the right and we'll tailor a quote and itinerary for you."}
              </p>
            </div>
            <div>
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
            </div>
          </div>
        </section>

        {/* Reviews */}
        <TourReviews tourId={tour._id} />

        {/* Related */}
        <TourDetailRelatedCarousel tours={relatedCards} currentSlug={tour.slug} />
      </PageContainer>
    </main>
  );
}
