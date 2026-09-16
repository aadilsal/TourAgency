/**
 * Single source of truth for which rating a tour displays.
 *
 * - `approvedReviewAvg` / `approvedReviewCount` are computed by the backend from
 *   approved customer reviews (convex/tourReviews.ts) and win once there is at
 *   least one approved review.
 * - Otherwise the admin-entered `ratingAvg` / `reviewsCount` are shown.
 *
 * Use this everywhere a tour rating is rendered so the two sources never drift
 * or overwrite each other again.
 */
export type TourRatingFields = {
  ratingAvg?: number | null;
  reviewsCount?: number | null;
  approvedReviewAvg?: number | null;
  approvedReviewCount?: number | null;
};

export type TourDisplayRating = {
  average: number;
  count: number;
  source: "reviews" | "manual";
};

function isPositive(n: number | null | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

export function getTourDisplayRating(tour: TourRatingFields): TourDisplayRating | null {
  if (isPositive(tour.approvedReviewCount) && isPositive(tour.approvedReviewAvg)) {
    return {
      average: tour.approvedReviewAvg,
      count: tour.approvedReviewCount,
      source: "reviews",
    };
  }
  if (isPositive(tour.ratingAvg) && isPositive(tour.reviewsCount)) {
    return { average: tour.ratingAvg, count: tour.reviewsCount, source: "manual" };
  }
  return null;
}
