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
import { GoogleReviewsWidget, ReviewsSkeleton } from "./GoogleReviewsWidget";

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

/**
 * Reviews section (home + About). Only real Google reviews are shown:
 * 1. Places API reviews when that's configured;
 * 2. else the free reviews widget from Settings (Trustindex / Elfsight);
 * 3. else a Google rating badge linking to the listing.
 * `initialWidgetCode` comes from the server so the widget choice never waits
 * on the live connection (which can be slow or blocked by VPNs/ad-blockers).
 */
export function TestimonialsCarousel({
  initialWidgetCode,
}: {
  initialWidgetCode?: string | null;
}) {
  const google = useQuery(api.googleReviews.getGoogleReviews, {});
  const settings = useQuery(api.siteSettings.getPublicSiteSettings, {});
  const isGoogle = Boolean(google?.configured && google.reviews.length > 0);

  const widgetCode = settings !== undefined ? settings.reviewsWidgetCode : initialWidgetCode;
  // Unknown until the server value or the live settings arrive.
  const widgetUnknown = settings === undefined && initialWidgetCode === undefined;
  const widget = isGoogle ? null : parseReviewsWidget(widgetCode);
  const listingUrl = googleReviewsUrl(google?.placeId, settings?.mapsEmbedUrl);
  const badgeRating = parseStarRating(settings?.googleRating) ?? DEFAULT_GOOGLE_RATING;
  const badgeCount = settings?.googleReviewCount?.trim() || DEFAULT_GOOGLE_REVIEW_COUNT;

  const badge = (
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
  );

  const seeAll = (
    <div className="mt-8 flex justify-center">
      <a href={listingUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
        See all our reviews on Google
        <ArrowRight className="h-4 w-4" aria-hidden />
      </a>
    </div>
  );

  return (
    <section className="py-10 md:py-14">
      <PageContainer>
        <SectionHeader
          align="center"
          eyebrow={
            isGoogle && google?.rating
              ? `${google.rating.toFixed(1)}★ on Google · ${google.userRatingsTotal ?? google.reviews.length} reviews`
              : `${badgeRating.toFixed(1)}★ on Google · ${badgeCount} reviews`
          }
          title="Travelers love the experience"
          description="Real reviews from guests on our Google listing."
        />

        {isGoogle ? (
          <div className="mt-8 md:mt-16">
            <EmblaRow itemLabel="review" slideClassName="min-w-0 flex-[0_0_92%] sm:flex-[0_0_70%] lg:flex-[0_0_42%]">
              {google!.reviews.map((r, i) => (
                <Card key={`${r.author}-${i}`} className="h-full min-h-[220px] p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    {r.profilePhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.profilePhotoUrl}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-havezic-primary text-base font-bold text-white"
                        aria-hidden
                      >
                        {r.author.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <cite className="not-italic text-lg font-semibold text-foreground">{r.author}</cite>
                      <p className="text-sm text-amber-500">
                        {"★".repeat(Math.max(1, Math.min(5, Math.round(r.rating))))} Google
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-6 text-sm leading-relaxed text-muted">&ldquo;{r.text}&rdquo;</p>
                </Card>
              ))}
            </EmblaRow>
          </div>
        ) : widget ? (
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
        ) : widgetUnknown ? (
          <div className="mt-8 md:mt-12">
            <ReviewsSkeleton />
          </div>
        ) : (
          badge
        )}

        {seeAll}
      </PageContainer>
    </section>
  );
}
