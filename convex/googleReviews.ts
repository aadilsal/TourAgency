import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  query,
} from "./_generated/server.js";
import { internal } from "./_generated/api.js";

const KEY = "global";

const reviewValidator = v.object({
  author: v.string(),
  rating: v.number(),
  text: v.string(),
  relativeTime: v.optional(v.string()),
  profilePhotoUrl: v.optional(v.string()),
  time: v.optional(v.number()),
});

export const getGoogleReviews = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("googleReviewsCache")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();
    return {
      rating: doc?.rating,
      userRatingsTotal: doc?.userRatingsTotal,
      reviews: doc?.reviews ?? [],
      fetchedAt: doc?.fetchedAt ?? 0,
      configured: (doc?.reviews?.length ?? 0) > 0,
    };
  },
});

export const storeGoogleReviews = internalMutation({
  args: {
    rating: v.optional(v.number()),
    userRatingsTotal: v.optional(v.number()),
    reviews: v.array(reviewValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("googleReviewsCache")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, fetchedAt: now });
    } else {
      await ctx.db.insert("googleReviewsCache", { key: KEY, ...args, fetchedAt: now });
    }
  },
});

type GooglePlacesReview = {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  profile_photo_url?: string;
  time?: number;
};
type GooglePlacesResult = {
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: GooglePlacesReview[];
  };
  status?: string;
  error_message?: string;
};

/**
 * Fetches reviews from the Google Places Details API and caches them.
 * No-op (returns not_configured) unless GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID
 * are set — so this ships safely and activates once you add the credentials.
 */
export const refreshGoogleReviews: ReturnType<typeof internalAction> = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID;
    if (!apiKey || !placeId) {
      return { ok: false as const, reason: "not_configured" };
    }
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}` +
      `&fields=rating,user_ratings_total,reviews&reviews_sort=newest&key=${apiKey}`;
    let data: GooglePlacesResult;
    try {
      const res = await fetch(url);
      if (!res.ok) return { ok: false as const, reason: `http_${res.status}` };
      data = (await res.json()) as GooglePlacesResult;
    } catch (e) {
      return { ok: false as const, reason: String(e) };
    }
    if (data.status && data.status !== "OK") {
      return { ok: false as const, reason: data.status };
    }
    const result = data.result ?? {};
    const reviews = (result.reviews ?? [])
      .map((r) => ({
        author: String(r.author_name ?? "Google user"),
        rating: Number.isFinite(r.rating) ? (r.rating as number) : 5,
        text: String(r.text ?? "").trim(),
        relativeTime: r.relative_time_description,
        profilePhotoUrl: r.profile_photo_url,
        time: typeof r.time === "number" ? r.time * 1000 : undefined,
      }))
      .filter((r) => r.text.length > 0)
      .slice(0, 8);

    await ctx.runMutation(internal.googleReviews.storeGoogleReviews, {
      rating: typeof result.rating === "number" ? result.rating : undefined,
      userRatingsTotal:
        typeof result.user_ratings_total === "number"
          ? result.user_ratings_total
          : undefined,
      reviews,
    });
    return { ok: true as const, count: reviews.length };
  },
});

/** Admin-triggered manual refresh. */
export const refreshNow: ReturnType<typeof action> = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const ok = await ctx.runQuery(internal.auth.isAdminSession, { sessionToken });
    if (!ok) throw new Error("Unauthorized");
    return await ctx.runAction(internal.googleReviews.refreshGoogleReviews, {});
  },
});
