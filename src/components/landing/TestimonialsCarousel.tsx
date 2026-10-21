"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ArrowRight } from "lucide-react";
import { EmblaRow } from "@/components/ui/EmblaRow";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { parseReviewsWidget, parseStarRating } from "@/lib/reviewsWidget";
import { GoogleReviewsWidget } from "./GoogleReviewsWidget";

// No API key required for this — it's a plain deep link to the business's
// real Google Maps listing, so it always shows every review Google has
// (the Places API only ever returns up to 5, by Google's own design).
function googleReviewsUrl(placeId?: string, mapsEmbedUrl?: string): string {
  if (!placeId) {
    // The Settings map embed names the exact listing (…!1s0x…%3A0x<cid>…);
    // its CID opens that listing directly.
    const m = mapsEmbedUrl?.match(/!1s0x[0-9a-f]+(?:%3A|:)0x([0-9a-f]+)/i);
    if (m) return `https://www.google.com/maps?cid=${BigInt(`0x${m[1]}`).toString()}`;
  }
  const params = new URLSearchParams({
    api: "1",
    query: "Junket Tours Johar Town Lahore",
  });
  if (placeId) params.set("query_place_id", placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/** Shown when the admin hasn't entered numbers (true as of Oct 2026: 4.9★, 101 reviews). */
const DEFAULT_GOOGLE_RATING = 4.9;
const DEFAULT_GOOGLE_REVIEW_COUNT = "100+";

type Item = {
  name: string;
  text: string;
  rating: number;
  image?: string;
  source?: string;
};

// Curated fallback shown until Google reviews are configured.
const CURATED: Item[] = [
  {
    name: "Ayesha K.",
    text: "Itinerary was spot-on for our family — Hunza in 6 days without the usual stress.",
    rating: 5,
    image: "/images/marketing/testimonial-ayesha.jpg",
  },
  {
    name: "Bilal R.",
    text: "Booked through WhatsApp, quick confirmation. Skardu trip exceeded expectations.",
    rating: 5,
    image: "/images/marketing/testimonial-bilal.jpg",
  },
  {
    name: "Sara & Omar",
    text: "AI planner matched us to a tour that fit our budget. Support was responsive.",
    rating: 5,
    image: "/images/marketing/testimonial-sara-omar.jpg",
  },
];

export function TestimonialsCarousel() {
  const google = useQuery(api.googleReviews.getGoogleReviews, {});
  const settings = useQuery(api.siteSettings.getPublicSiteSettings, {});
  const isGoogle = Boolean(google?.configured && google.reviews.length > 0);
  // Fallbacks when the Places API isn't set up: a free reviews widget, else a
  // Google rating badge that links to the real listing.
  const widget = isGoogle ? null : parseReviewsWidget(settings?.reviewsWidgetCode);
  const listingUrl = googleReviewsUrl(google?.placeId, settings?.mapsEmbedUrl);
  const badgeRating = parseStarRating(settings?.googleRating) ?? DEFAULT_GOOGLE_RATING;
  const badgeCount = settings?.googleReviewCount?.trim() || DEFAULT_GOOGLE_REVIEW_COUNT;

  if (widget) {
    return (
      <section className="py-10 md:py-14">
        <PageContainer>
          <SectionHeader
            align="center"
            eyebrow={`${badgeRating.toFixed(1)}★ on Google · ${badgeCount} reviews`}
            title="Travelers love the experience"
            description="Real reviews from guests on our Google listing."
          />
          <div className="mt-8 md:mt-12">
            <GoogleReviewsWidget
              widget={widget}
              fallback={
                <p className="text-center text-sm text-muted">
                  Our reviews are taking a while to load — read them on Google below.
                </p>
              }
            />
          </div>
          <div className="mt-8 flex justify-center">
            <a
              href={listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary")}
            >
              See all our reviews on Google
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </PageContainer>
      </section>
    );
  }

  const items: Item[] = isGoogle
    ? google!.reviews.map((r) => ({
        name: r.author,
        text: r.text,
        rating: Math.round(r.rating),
        image: r.profilePhotoUrl,
        source: "Google",
      }))
    : CURATED;

  const eyebrow = isGoogle
    ? google?.rating
      ? `${google.rating.toFixed(1)}★ on Google · ${google.userRatingsTotal ?? google.reviews.length} reviews`
      : "Verified Google reviews"
    : "Traveller stories";

  return (
    <section className="py-10 md:py-14">
      <PageContainer>
        <SectionHeader
          align="center"
          eyebrow={eyebrow}
          title="Travelers love the experience"
          description="Real feedback from guests who planned and booked with JunketTours."
        />
        {!isGoogle ? (
          <a
            href={listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-full border border-border bg-panel px-5 py-2.5 shadow-sm transition hover:border-havezic-primary/40"
          >
            <span className="text-2xl font-bold text-foreground">{badgeRating.toFixed(1)}</span>
            <span className="text-lg text-amber-400" aria-hidden>
              ★★★★★
            </span>
            <span className="text-sm text-muted">
              {badgeCount} reviews on <span className="font-semibold text-foreground">Google</span>
            </span>
          </a>
        ) : null}
        <div className="mt-8 md:mt-16">
          <EmblaRow itemLabel="review" slideClassName="min-w-0 flex-[0_0_92%] sm:flex-[0_0_70%] lg:flex-[0_0_42%]">
            {items.map((t, i) => (
              <Card
                key={`${t.name}-${i}`}
                className="relative h-full min-h-[280px] overflow-hidden p-0"
              >
                {t.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.image}
                    alt={`Portrait of ${t.name}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/20" />
                <blockquote className="relative flex h-full min-h-[280px] flex-col justify-end p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-havezic-primary text-base font-bold text-white"
                      aria-hidden
                    >
                      {t.name.slice(0, 1)}
                    </div>
                    <div>
                      <cite className="not-italic text-lg font-semibold text-white">
                        {t.name}
                      </cite>
                      <p className="text-sm text-amber-300">
                        {"★".repeat(Math.max(1, Math.min(5, t.rating)))}
                        {t.source ? ` ${t.source}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-white/95">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </blockquote>
              </Card>
            ))}
          </EmblaRow>
        </div>
        <div className="mt-8 flex justify-center">
          <a
            href={listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary")}
          >
            See all our reviews on Google
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </PageContainer>
    </section>
  );
}
