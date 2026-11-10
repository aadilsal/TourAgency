"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ArrowRight } from "lucide-react";
import { EmblaRow } from "@/components/ui/EmblaRow";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { parseStarRating } from "@/lib/reviewsWidget";
import { OUR_GOOGLE_REVIEWS, type OurReview } from "@/lib/ourGoogleReviews";

// No API key required for this — it's a plain deep link to the business's
// real Google Maps listing, so it always shows every review Google has.
function googleReviewsUrl(mapsEmbedUrl?: string): string {
  // The Settings map embed names the exact listing (…!1s0x…%3A0x<cid>…);
  // its CID opens that listing directly.
  const m = mapsEmbedUrl?.match(/!1s0x[0-9a-f]+(?:%3A|:)0x([0-9a-f]+)/i);
  if (m) return `https://www.google.com/maps?cid=${BigInt(`0x${m[1]}`).toString()}`;
  return `https://www.google.com/maps/search/?${new URLSearchParams({
    api: "1",
    query: "Junket Tours Johar Town Lahore",
  }).toString()}`;
}

/** Shown when the admin hasn't entered numbers (true as of Oct 2026: 4.9★, 101 reviews). */
const DEFAULT_GOOGLE_RATING = 4.9;
const DEFAULT_GOOGLE_REVIEW_COUNT = "100+";

const AVATAR_COLORS = ["bg-[#1a73e8]", "bg-[#e8710a]", "bg-[#188038]", "bg-[#9334e6]", "bg-[#d01884]", "bg-[#12b5cb]"];

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z" />
    </svg>
  );
}

function ReviewCard({ review, index }: { review: OurReview; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > 260;

  return (
    <Card className="flex h-full flex-col p-6">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold uppercase text-white ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
          aria-hidden
        >
          {review.author.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <cite className="block truncate not-italic font-semibold capitalize text-foreground">{review.author}</cite>
          <p className="truncate text-xs text-muted">{review.meta}</p>
        </div>
        <GoogleG className="h-5 w-5 shrink-0" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-amber-400" role="img" aria-label="5 out of 5 stars">
          ★★★★★
        </span>
        <span className="text-xs text-muted">{review.date}</span>
      </div>

      <p className={`mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80 ${expanded ? "" : "line-clamp-6"}`}>
        {review.text}
      </p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 self-start text-sm font-semibold text-havezic-primary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
      {review.note ? <p className="mt-auto pt-3 text-xs text-muted">{review.note}</p> : null}
    </Card>
  );
}

/** Reviews section (home + About): our own real Google reviews, shown as cards. */
export function TestimonialsCarousel() {
  const settings = useQuery(api.siteSettings.getPublicSiteSettings, {});
  const listingUrl = googleReviewsUrl(settings?.mapsEmbedUrl);
  const rating = parseStarRating(settings?.googleRating) ?? DEFAULT_GOOGLE_RATING;
  const count = settings?.googleReviewCount?.trim() || DEFAULT_GOOGLE_REVIEW_COUNT;

  return (
    <section className="py-10 md:py-14">
      <PageContainer>
        <SectionHeader
          align="center"
          eyebrow={`${rating.toFixed(1)}★ on Google · ${count} reviews`}
          title="Travelers love the experience"
          description="Real reviews from guests on our Google listing."
        />

        <div className="mt-8 md:mt-12">
          <EmblaRow itemLabel="review" slideClassName="min-w-0 flex-[0_0_88%] sm:flex-[0_0_48%] lg:flex-[0_0_32%]">
            {OUR_GOOGLE_REVIEWS.map((r, i) => (
              <ReviewCard key={r.author} review={r} index={i} />
            ))}
          </EmblaRow>
        </div>

        <div className="mt-8 flex justify-center">
          <a href={listingUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
            See all our reviews on Google
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </PageContainer>
    </section>
  );
}
