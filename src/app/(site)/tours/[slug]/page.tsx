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
import { Card } from "@/components/ui/Card";
import { PageLoadingSpinner } from "@/components/ui/PageLoadingSpinner";
import type { TourCardData } from "@/components/shared/TourCard";
import { Clock, MapPin, Star, Tag } from "lucide-react";
import { TourDetailTabs } from "@/components/tours/TourDetailTabs";
import { TourCalendarPrices } from "@/components/tours/TourCalendarPrices";
import { cookies } from "next/headers";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { getTourUnitPrice } from "@/lib/tourPricing";
import { loadTourBySlug } from "@/lib/tours-server";
import { getConvexServer } from "@/lib/convex-server";
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
  const currency = ((cookies().get("jt_currency")?.value ?? "USD") === "PKR"
    ? "PKR"
    : "USD") as CurrencyCode;
  const fromPrice = getTourUnitPrice(tour, currency);

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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
              <Tag className="h-4 w-4 text-havezic-primary" aria-hidden />
              From {formatMoney(fromPrice, currency)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
              Highly rated experiences
            </span>
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
              price={tour.price}
              pricePkr={tour.pricePkr}
              priceUsd={tour.priceUsd}
              durationDays={tour.durationDays}
              location={tour.location}
              whatsappUrl={whatsappUrl}
            />

            {relatedCards.length > 0 ? (
              <section className="mt-6 rounded-2xl border border-border bg-panel p-5 shadow-sm">
                <h3 className="text-base font-bold text-foreground">Last Minute Deals</h3>
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
                        <p className="mt-0.5 text-xs font-bold text-havezic-primary">
                          PKR {Number(t.price).toLocaleString()}
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
                    {[
                      "Handpicked viewpoints and photo stops",
                      "Comfortable private transport",
                      "Flexible pacing with local guidance",
                    ].map((x) => (
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
                    {[
                      "24/7 Expert assistance",
                      "Professional driver",
                      "Fuel, tolls & road taxes",
                      "Hotel pickup & drop off",
                    ].map((x) => (
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
            </section>

            <div className="mt-10 md:mt-12">
              <TourCalendarPrices
                price={tour.price}
                pricePkr={tour.pricePkr}
                priceUsd={tour.priceUsd}
              />
            </div>

            <section id="tour-plan" className="mt-10 scroll-mt-28 md:mt-12">
              <h2 className="text-2xl font-bold text-foreground">Itinerary</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Day-by-day flow — timings may shift slightly with weather and road
                conditions.
              </p>
              <ol className="relative mt-8 space-y-0 border-l-2 border-border pl-6 md:pl-8">
                {tour.itinerary.map((d) => (
                  <li key={d.day} className="relative pb-10 last:pb-0">
                    <span
                      className="absolute -left-[calc(0.75rem+2px)] top-1.5 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-havezic-primary shadow-sm ring-2 ring-havezic-primary/20 md:-left-[calc(1rem+2px)]"
                      aria-hidden
                    />
                    <Card className="rounded-2xl p-5 md:p-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-havezic-text">
                        Day {d.day}
                      </p>
                      <p className="mt-1.5 text-lg font-semibold text-foreground">
                        {d.title}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {d.description}
                      </p>
                    </Card>
                  </li>
                ))}
              </ol>
            </section>

            <div id="location" className="mt-10 scroll-mt-28 md:mt-12">
              <TourLocationMap location={tour.location} title={tour.title} />
            </div>

            <section
              id="reviews"
              className="mt-10 scroll-mt-28 rounded-2xl border border-border bg-panel p-6 shadow-sm md:mt-12 md:p-8"
            >
              <h2 className="text-lg font-bold text-foreground">Reviews</h2>
              <p className="mt-3 text-sm text-muted">
                No reviews yet. Book this tour and be the first to share your experience.
              </p>
            </section>

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
