import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import type { MutationCtx } from "./_generated/server.js";
import type { Id } from "./_generated/dataModel.js";
import {
  requireUserFromSession,
  resolveUserFromSessionToken,
} from "./lib/authHelpers.js";

function assertAdmin(user: { role: string }) {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
}

/** Recompute a tour's cached rating average + count from its approved reviews. */
async function recomputeTourRating(ctx: MutationCtx, tourId: Id<"tours">) {
  const approved = await ctx.db
    .query("tourReviews")
    .withIndex("by_tour_and_status", (q) =>
      q.eq("tourId", tourId).eq("status", "approved"),
    )
    .collect();
  const count = approved.length;
  const avg =
    count > 0
      ? Math.round((approved.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : undefined;
  const tour = await ctx.db.get(tourId);
  if (!tour) return;
  await ctx.db.patch(tourId, {
    reviewsCount: count,
    ratingAvg: avg,
  });
}

export const submitReview = mutation({
  args: {
    tourId: v.id("tours"),
    authorName: v.string(),
    authorEmail: v.optional(v.string()),
    rating: v.number(),
    title: v.optional(v.string()),
    body: v.string(),
    travelDate: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tour = await ctx.db.get(args.tourId);
    if (!tour) throw new Error("Tour not found");

    const name = args.authorName.trim();
    const body = args.body.trim();
    if (name.length < 2) throw new Error("Please enter your name.");
    if (body.length < 10) throw new Error("Please write a little more about your experience.");
    const rating = Math.round(args.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5.");
    }

    const user = await resolveUserFromSessionToken(ctx, args.sessionToken);

    await ctx.db.insert("tourReviews", {
      tourId: args.tourId,
      userId: user?._id,
      authorName: name.slice(0, 80),
      authorEmail: args.authorEmail?.trim().toLowerCase() || undefined,
      rating,
      title: args.title?.trim().slice(0, 120) || undefined,
      body: body.slice(0, 2000),
      status: "pending",
      travelDate: args.travelDate?.trim().slice(0, 40) || undefined,
      createdAt: Date.now(),
    });

    return { ok: true as const };
  },
});

export const listApprovedForTour = query({
  args: { tourId: v.id("tours") },
  handler: async (ctx, { tourId }) => {
    const reviews = await ctx.db
      .query("tourReviews")
      .withIndex("by_tour_and_status", (q) =>
        q.eq("tourId", tourId).eq("status", "approved"),
      )
      .collect();
    reviews.sort((a, b) => b.createdAt - a.createdAt);
    const count = reviews.length;
    const average =
      count > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
        : 0;
    return {
      count,
      average,
      reviews: reviews.map((r) => ({
        _id: r._id,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title,
        body: r.body,
        travelDate: r.travelDate,
        createdAt: r.createdAt,
      })),
    };
  },
});

export const listForAdmin = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    ),
  },
  handler: async (ctx, { sessionToken, status }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdmin(user);

    const rows = status
      ? await ctx.db
          .query("tourReviews")
          .withIndex("by_status", (q) => q.eq("status", status))
          .collect()
      : await ctx.db.query("tourReviews").collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      rows.map(async (r) => {
        const tour = await ctx.db.get(r.tourId);
        return {
          _id: r._id,
          tourId: r.tourId,
          tourTitle: tour?.title ?? "Unknown tour",
          tourSlug: tour?.slug,
          authorName: r.authorName,
          authorEmail: r.authorEmail,
          rating: r.rating,
          title: r.title,
          body: r.body,
          travelDate: r.travelDate,
          status: r.status,
          createdAt: r.createdAt,
        };
      }),
    );
  },
});

export const setReviewStatus = mutation({
  args: {
    sessionToken: v.string(),
    reviewId: v.id("tourReviews"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
  },
  handler: async (ctx, { sessionToken, reviewId, status }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdmin(user);
    const review = await ctx.db.get(reviewId);
    if (!review) throw new Error("Review not found");
    await ctx.db.patch(reviewId, {
      status,
      reviewedAt: Date.now(),
      reviewedBy: user._id,
    });
    await recomputeTourRating(ctx, review.tourId);
  },
});

export const deleteReview = mutation({
  args: { sessionToken: v.string(), reviewId: v.id("tourReviews") },
  handler: async (ctx, { sessionToken, reviewId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdmin(user);
    const review = await ctx.db.get(reviewId);
    if (!review) return;
    const tourId = review.tourId;
    await ctx.db.delete(reviewId);
    await recomputeTourRating(ctx, tourId);
  },
});
