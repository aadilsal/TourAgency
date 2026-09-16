import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server.js";
import type { MutationCtx, QueryCtx } from "./_generated/server.js";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api.js";
import { resolveUserFromSessionToken, requireAdminFromSession } from "./lib/authHelpers.js";
import type { Doc, Id } from "./_generated/dataModel.js";
import { resolveTourImageUrls } from "./lib/resolveTourImages.js";
import {
  deleteTourImageAssetsForTour,
  syncTourImageAssetIndex,
} from "./lib/syncTourImageAssets.js";

const MAX_TOURS_RETURNED = 500;

type PerHeadPrice = NonNullable<Doc<"tours">["perHeadPrices"]>[number];

/** Per-head (per person) rate for a given group size. */
const perHeadPriceValidator = v.object({
  persons: v.number(),
  pricePkr: v.optional(v.number()),
  priceUsd: v.optional(v.number()),
});

export const TOUR_CONFLICT_MESSAGE =
  "This tour was changed by someone else since you opened it. Copy your changes, reload, and try again.";
export const TOUR_SLUG_TAKEN_MESSAGE = "That URL slug is already used by another tour";

export function normalizeTourSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Revision token for optimistic concurrency. Tours written before `updatedAt`
 * existed fall back to `createdAt`, so the first editor save still works.
 */
function tourRevision(tour: Doc<"tours">): number {
  return tour.updatedAt ?? tour.createdAt;
}

/** Reads a tour by slug without `.unique()`, so a duplicate row can't crash a page. */
async function findTourBySlug(
  ctx: QueryCtx | MutationCtx,
  slug: string,
): Promise<Doc<"tours"> | null> {
  return await ctx.db
    .query("tours")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first();
}

async function assertTourSlugAvailable(
  ctx: MutationCtx,
  slug: string,
  selfId?: Id<"tours">,
): Promise<void> {
  if (!slug) throw new Error("A URL slug is required");
  const rows = await ctx.db
    .query("tours")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .take(2);
  if (rows.some((r) => r._id !== selfId)) {
    throw new Error(TOUR_SLUG_TAKEN_MESSAGE);
  }
}

export const getTours = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, { includeInactive, sessionToken }) => {
    const user = await resolveUserFromSessionToken(ctx, sessionToken);
    const isAdmin =
      user?.role === "admin" || user?.role === "super_admin";

    const wantsAll = Boolean(includeInactive) && isAdmin;
    const list = wantsAll
      ? // Newest first so the cap drops the oldest tours, not arbitrary ones.
        await ctx.db.query("tours").order("desc").take(MAX_TOURS_RETURNED)
      : await ctx.db
          .query("tours")
          .withIndex("by_isActive", (q) => q.eq("isActive", true))
          .take(MAX_TOURS_RETURNED);

    if (wantsAll) {
      return list;
    }

    return Promise.all(
      list.map(async (t) => ({
        ...t,
        images: await resolveTourImageUrls(ctx, t.images),
      })),
    );
  },
});

/**
 * Admin tours table: newest first, paginated, optional title search. Unlike
 * `getTours` it has no hard cap, so the list keeps working as the catalog grows.
 */
export const listToursForAdmin = query({
  args: {
    sessionToken: v.string(),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, paginationOpts, search }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const term = search?.trim();
    const result = term
      ? await ctx.db
          .query("tours")
          .withSearchIndex("search_title", (q) => q.search("title", term))
          .paginate(paginationOpts)
      : await ctx.db.query("tours").order("desc").paginate(paginationOpts);
    return {
      ...result,
      page: result.page.map((t) => ({
        _id: t._id,
        title: t.title,
        slug: t.slug,
        location: t.location,
        destinationIds: t.destinationIds,
        destinationId: t.destinationId,
        types: t.types,
        durationDays: t.durationDays,
        isActive: t.isActive,
        createdAt: t.createdAt,
        updatedAt: tourRevision(t),
      })),
    };
  },
});

export const listActiveToursForExplore = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("tours")
      .withIndex("by_isActive_and_createdAt", (q) => q.eq("isActive", true))
      .order("desc")
      .take(MAX_TOURS_RETURNED);

    return Promise.all(
      rows.map(async (t) => ({
        _id: t._id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        types: t.types ?? [],
        price: t.price,
        pricePkr: (t as { pricePkr?: number }).pricePkr,
        priceUsd: (t as { priceUsd?: number }).priceUsd,
        perHeadPrices: (t as { perHeadPrices?: PerHeadPrice[] }).perHeadPrices ?? [],
        durationDays: t.durationDays,
        location: t.location,
        isActive: t.isActive,
        images: await resolveTourImageUrls(ctx, t.images),
      })),
    );
  },
});

export const listActiveToursPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db
      .query("tours")
      .withIndex("by_isActive_and_createdAt", (q) => q.eq("isActive", true))
      .order("desc")
      .paginate(paginationOpts);
  },
});

export const listRelatedTours = query({
  args: {
    excludeTourId: v.id("tours"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { excludeTourId, limit }) => {
    const rows = await ctx.db
      .query("tours")
      .withIndex("by_isActive_and_createdAt", (q) => q.eq("isActive", true))
      .order("desc")
      .take(Math.min(MAX_TOURS_RETURNED, Math.max(1, limit ?? 12)));

    const filtered = rows.filter((t) => t._id !== excludeTourId);
    return Promise.all(
      filtered.map(async (t) => ({
        ...t,
        images: await resolveTourImageUrls(ctx, t.images),
      })),
    );
  },
});

export const listSlugsActive = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("tours")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(MAX_TOURS_RETURNED);
    return Array.from(new Set(rows.map((t) => t.slug)));
  },
});

export const listToursForAi = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tours = await ctx.db
      .query("tours")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(MAX_TOURS_RETURNED);
    return tours
      .map((t) => ({
        title: t.title,
        slug: t.slug,
        types: t.types ?? [],
        location: t.location,
        durationDays: t.durationDays,
        pricePkr: (t as { pricePkr?: number }).pricePkr ?? t.price,
        priceUsd: (t as { priceUsd?: number }).priceUsd ?? null,
        description: t.description,
      }));
  },
});

export const getTourBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const tour = await findTourBySlug(ctx, slug);
    if (!tour) return null;
    return {
      ...tour,
      images: await resolveTourImageUrls(ctx, tour.images),
    };
  },
});

/**
 * Price fields only, for the tour detail page's live price subscription.
 *
 * The detail page is server-rendered, so its HTML (and the RSC payload Next
 * caches on the client) can lag behind an admin price edit while the tour cards
 * — which subscribe to Convex — update instantly. This keeps both in sync
 * without paying for image URL resolution on every subscription update.
 */
export const getTourPricingBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const tour = await findTourBySlug(ctx, slug);
    if (!tour || !tour.isActive) return null;
    return {
      price: tour.price,
      pricePkr: tour.pricePkr,
      priceUsd: tour.priceUsd,
      perHeadPrices: tour.perHeadPrices ?? [],
    };
  },
});

/**
 * Fetch a single tour by id for the admin editor. Returns the RAW row (storage
 * IDs, not resolved URLs) so the edit form can round-trip images unchanged.
 *
 * Throws "Not authenticated" / "Admin access required" on auth failure. It used
 * to return `null` (same as "not found"), which made the editor replace a form
 * full of unsaved edits with "Tour not found" whenever a session lapsed.
 * `updatedAt` is always set: pass it back to `updateTour` as `expectedUpdatedAt`.
 */
export const getTourForAdmin = query({
  args: { tourId: v.id("tours"), sessionToken: v.optional(v.string()) },
  handler: async (ctx, { tourId, sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken ?? "");
    const tour = await ctx.db.get(tourId);
    if (!tour) return null;
    return { ...tour, updatedAt: tourRevision(tour) };
  },
});

export const createTour = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    types: v.optional(v.array(v.string())),
    destinationIds: v.optional(v.array(v.id("destinations"))),
    destinationId: v.optional(v.id("destinations")),
    provinceIds: v.optional(v.array(v.id("provinces"))),
    pricePkr: v.optional(v.number()),
    priceUsd: v.optional(v.number()),
    perHeadPrices: v.optional(v.array(perHeadPriceValidator)),
    durationDays: v.number(),
    location: v.string(),
    maxPeople: v.optional(v.number()),
    minAge: v.optional(v.number()),
    tourTypeLabel: v.optional(v.string()),
    ratingAvg: v.optional(v.number()),
    reviewsCount: v.optional(v.number()),
    office: v.optional(v.string()),
    email: v.optional(v.string()),
    images: v.array(v.string()),
    itinerary: v.array(
      v.object({
        day: v.number(),
        title: v.string(),
        description: v.string(),
      }),
    ),
    highlights: v.optional(v.array(v.string())),
    included: v.optional(v.array(v.string())),
    excluded: v.optional(v.array(v.string())),
    timeSlots: v.optional(v.array(v.string())),
    ticketGroups: v.optional(
      v.array(
        v.object({
          label: v.string(),
          ageRange: v.optional(v.string()),
        }),
      ),
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, { sessionToken, ...args }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    const now = Date.now();
    const normalizedSlug = normalizeTourSlug(args.slug);
    await assertTourSlugAvailable(ctx, normalizedSlug);
    const imageFolderKey = `tours/${normalizedSlug}`;
    const id = await ctx.db.insert("tours", {
      ...args,
      types: args.types ?? [],
      slug: normalizedSlug,
      imageFolderKey,
      createdAt: now,
      updatedAt: now,
      // Keep legacy `price` in sync with PKR for older read paths.
      price: typeof args.pricePkr === "number" ? args.pricePkr : 0,
      destinationIds:
        args.destinationIds ?? (args.destinationId ? [args.destinationId] : undefined),
    });
    await syncTourImageAssetIndex(ctx, id, imageFolderKey, args.images);
    await ctx.db.insert("adminLogs", {
      action: "create_tour",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `Tour ${id}`,
    });
    await ctx.runMutation(internal.destinations.syncFromTour, {
      tourId: id,
      allowCreate: true,
    });
    return id;
  },
});

export const updateTour = mutation({
  args: {
    sessionToken: v.string(),
    tourId: v.id("tours"),
    /**
     * `updatedAt` from `getTourForAdmin` when the editor was opened. When sent
     * and the tour has changed since, the save is rejected instead of silently
     * overwriting someone else's edits.
     */
    expectedUpdatedAt: v.optional(v.number()),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    types: v.optional(v.array(v.string())),
    destinationIds: v.optional(v.array(v.id("destinations"))),
    /** `null` clears the legacy single destination. */
    destinationId: v.optional(v.union(v.id("destinations"), v.null())),
    provinceIds: v.optional(v.array(v.id("provinces"))),
    // Optional scalars accept `null` as an explicit "clear this field" signal so
    // an admin can blank out a value that was previously set. (Convex drops
    // `undefined` args on the wire, so `undefined` can only ever mean "leave as-is".)
    pricePkr: v.optional(v.union(v.number(), v.null())),
    priceUsd: v.optional(v.union(v.number(), v.null())),
    /** Send `[]` to remove all per-head options. */
    perHeadPrices: v.optional(v.array(perHeadPriceValidator)),
    durationDays: v.optional(v.number()),
    location: v.optional(v.string()),
    maxPeople: v.optional(v.union(v.number(), v.null())),
    minAge: v.optional(v.union(v.number(), v.null())),
    tourTypeLabel: v.optional(v.union(v.string(), v.null())),
    ratingAvg: v.optional(v.union(v.number(), v.null())),
    reviewsCount: v.optional(v.union(v.number(), v.null())),
    office: v.optional(v.union(v.string(), v.null())),
    email: v.optional(v.union(v.string(), v.null())),
    images: v.optional(v.array(v.string())),
    itinerary: v.optional(
      v.array(
        v.object({
          day: v.number(),
          title: v.string(),
          description: v.string(),
        }),
      ),
    ),
    highlights: v.optional(v.array(v.string())),
    included: v.optional(v.array(v.string())),
    excluded: v.optional(v.array(v.string())),
    timeSlots: v.optional(v.array(v.string())),
    ticketGroups: v.optional(
      v.array(
        v.object({
          label: v.string(),
          ageRange: v.optional(v.string()),
        }),
      ),
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionToken, tourId, expectedUpdatedAt, ...patch }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    const tour = await ctx.db.get(tourId);
    if (!tour) throw new Error("Tour not found");
    if (expectedUpdatedAt !== undefined && expectedUpdatedAt !== tourRevision(tour)) {
      throw new Error(TOUR_CONFLICT_MESSAGE);
    }
    if (patch.title !== undefined && !patch.title.trim()) {
      throw new Error("Title can't be empty");
    }

    const next: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      // `undefined` = field omitted → leave unchanged.
      // `null` = explicit clear → set to `undefined` so `ctx.db.patch` removes it.
      if (val === undefined) continue;
      next[k] = val === null ? undefined : val;
    }
    // Keep legacy `price` in sync with PKR for older code paths (including clears).
    if (patch.pricePkr !== undefined) {
      next.price = patch.pricePkr === null ? 0 : patch.pricePkr;
    }
    // Unticking the legacy destination in an editor that only sends
    // `destinationIds` must also drop the legacy single field, or the tour stays
    // attached to a destination the admin removed.
    if (
      patch.destinationIds !== undefined &&
      patch.destinationId === undefined &&
      tour.destinationId &&
      !patch.destinationIds.includes(tour.destinationId)
    ) {
      next.destinationId = undefined;
    }
    if (typeof next.slug === "string") {
      next.slug = normalizeTourSlug(next.slug);
      if (next.slug !== tour.slug) {
        await assertTourSlugAvailable(ctx, next.slug as string, tourId);
      }
    }
    const finalSlug =
      typeof next.slug === "string" ? next.slug : tour.slug;
    const finalImages = Array.isArray(next.images) ? next.images : tour.images;
    const imageFolderKey = `tours/${finalSlug}`;
    next.imageFolderKey = imageFolderKey;
    // Strictly increasing so two saves in the same millisecond still conflict.
    next.updatedAt = Math.max(Date.now(), tourRevision(tour) + 1);
    await ctx.db.patch(
      tourId,
      next as Partial<Omit<Doc<"tours">, "_id" | "_creationTime">>,
    );
    await syncTourImageAssetIndex(
      ctx,
      tourId,
      imageFolderKey,
      finalImages,
    );
    await ctx.db.insert("adminLogs", {
      action: "update_tour",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: String(tourId),
    });
    // Updates only refresh existing destinations; they never auto-create one
    // (that used to resurrect destinations an admin had deleted).
    await ctx.runMutation(internal.destinations.syncFromTour, {
      tourId,
      allowCreate: false,
    });
    return { updatedAt: next.updatedAt as number };
  },
});

/** Records that would be orphaned if the tour were hard-deleted. */
async function describeTourReferences(
  ctx: MutationCtx,
  tourId: Id<"tours">,
): Promise<string[]> {
  const found: string[] = [];
  const bookings = await ctx.db
    .query("bookings")
    .withIndex("by_tour", (q) => q.eq("tourId", tourId))
    .take(100);
  const guestBookings = await ctx.db
    .query("guestBookings")
    .withIndex("by_tour", (q) => q.eq("tourId", tourId))
    .take(100);
  const bookingCount = bookings.length + guestBookings.length;
  if (bookingCount > 0) {
    found.push(`${bookingCount >= 200 ? "200+" : bookingCount} booking${bookingCount === 1 ? "" : "s"}`);
  }
  const reviews = await ctx.db
    .query("tourReviews")
    .withIndex("by_tour", (q) => q.eq("tourId", tourId))
    .take(100);
  if (reviews.length > 0) {
    found.push(`${reviews.length >= 100 ? "100+" : reviews.length} review${reviews.length === 1 ? "" : "s"}`);
  }
  const linkedItinerary = await ctx.db
    .query("itineraries")
    .withIndex("by_source_tour", (q) => q.eq("sourceTourId", tourId))
    .first();
  if (linkedItinerary) {
    found.push("itineraries");
  }
  return found;
}

export const deleteTour = mutation({
  args: { sessionToken: v.string(), tourId: v.id("tours") },
  handler: async (ctx, { sessionToken, tourId }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    const tour = await ctx.db.get(tourId);
    if (!tour) return;
    const references = await describeTourReferences(ctx, tourId);
    if (references.length > 0) {
      throw new Error(
        `This tour can't be deleted because ${references.join(", ")} still point to it. Deactivate it instead (switch Active off) to hide it from the site without losing those records.`,
      );
    }
    await deleteTourImageAssetsForTour(ctx, tourId);
    await ctx.db.delete(tourId);
    await ctx.db.insert("adminLogs", {
      action: "delete_tour",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `${String(tourId)} (${tour.slug})`,
    });
  },
});

const itineraryDayValidator = v.object({
  day: v.number(),
  title: v.string(),
  description: v.string(),
});

export const bulkUpsert = mutation({
  args: {
    sessionToken: v.string(),
    rows: v.array(
      v.object({
        title: v.string(),
        slug: v.string(),
        description: v.string(),
        types: v.optional(v.array(v.string())),
        destinationIds: v.optional(v.array(v.id("destinations"))),
        destinationId: v.optional(v.id("destinations")),
        /** Legacy PKR price column; `pricePkr` wins when both are present. */
        price: v.optional(v.number()),
        pricePkr: v.optional(v.number()),
        priceUsd: v.optional(v.number()),
        durationDays: v.number(),
        location: v.string(),
        maxPeople: v.optional(v.number()),
        minAge: v.optional(v.number()),
        tourTypeLabel: v.optional(v.string()),
        ratingAvg: v.optional(v.number()),
        reviewsCount: v.optional(v.number()),
        office: v.optional(v.string()),
        email: v.optional(v.string()),
        /** Optional on update: an empty/missing column keeps the tour's images. */
        images: v.optional(v.array(v.string())),
        /** Required for new tours; optional (kept) when updating. */
        itinerary: v.optional(v.array(itineraryDayValidator)),
        highlights: v.optional(v.array(v.string())),
        included: v.optional(v.array(v.string())),
        excluded: v.optional(v.array(v.string())),
        timeSlots: v.optional(v.array(v.string())),
        ticketGroups: v.optional(
          v.array(
            v.object({
              label: v.string(),
              ageRange: v.optional(v.string()),
            }),
          ),
        ),
        isActive: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, { sessionToken, rows }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    const now = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ index: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      try {
        const normalizedSlug = normalizeTourSlug(row.slug);
        if (!normalizedSlug) throw new Error("slug is required");
        const title = row.title.trim();
        const description = row.description.trim();
        const location = row.location.trim();
        if (!title) throw new Error("title is required");
        if (!description) throw new Error("description is required");
        if (!location) throw new Error("location is required");

        const matches = await ctx.db
          .query("tours")
          .withIndex("by_slug", (q) => q.eq("slug", normalizedSlug))
          .take(2);
        if (matches.length > 1) {
          throw new Error(
            `More than one tour uses the slug "${normalizedSlug}" — fix the duplicate in the editor first`,
          );
        }
        const existing = matches[0] ?? null;
        // Older importers send `price: 0` for a blank cell; on UPDATE that must
        // not wipe a real price, so a zero legacy price counts as "not provided".
        const legacyPrice = existing && row.price === 0 ? undefined : row.price;
        const pricePkr = row.pricePkr ?? legacyPrice;
        const destinationIds =
          row.destinationIds && row.destinationIds.length > 0
            ? row.destinationIds
            : row.destinationId
              ? [row.destinationId]
              : undefined;

        if (existing) {
          // UPDATE: only columns that are present and non-empty are written, so
          // a partial spreadsheet never wipes images, prices or assignments.
          const patch: Partial<Doc<"tours">> = {
            title,
            description,
            location,
            durationDays: row.durationDays,
            isActive: row.isActive,
            updatedAt: Math.max(now + i, tourRevision(existing) + 1),
          };
          if (row.types && row.types.length > 0) patch.types = row.types;
          if (destinationIds) patch.destinationIds = destinationIds;
          if (pricePkr !== undefined) {
            patch.pricePkr = pricePkr;
            patch.price = pricePkr;
          }
          if (row.priceUsd !== undefined) patch.priceUsd = row.priceUsd;
          if (row.maxPeople !== undefined) patch.maxPeople = row.maxPeople;
          if (row.minAge !== undefined) patch.minAge = row.minAge;
          if (row.ratingAvg !== undefined) patch.ratingAvg = row.ratingAvg;
          if (row.reviewsCount !== undefined) patch.reviewsCount = row.reviewsCount;
          if (row.tourTypeLabel?.trim()) patch.tourTypeLabel = row.tourTypeLabel.trim();
          if (row.office?.trim()) patch.office = row.office.trim();
          if (row.email?.trim()) patch.email = row.email.trim();
          if (row.images && row.images.length > 0) patch.images = row.images;
          if (row.itinerary && row.itinerary.length > 0) patch.itinerary = row.itinerary;
          if (row.highlights && row.highlights.length > 0) patch.highlights = row.highlights;
          if (row.included && row.included.length > 0) patch.included = row.included;
          if (row.excluded && row.excluded.length > 0) patch.excluded = row.excluded;
          if (row.timeSlots && row.timeSlots.length > 0) patch.timeSlots = row.timeSlots;
          if (row.ticketGroups && row.ticketGroups.length > 0) {
            patch.ticketGroups = row.ticketGroups;
          }

          await ctx.db.patch(existing._id, patch);
          if (patch.images) {
            await syncTourImageAssetIndex(
              ctx,
              existing._id,
              existing.imageFolderKey ?? `tours/${normalizedSlug}`,
              patch.images,
            );
          }
          await ctx.runMutation(internal.destinations.syncFromTour, {
            tourId: existing._id,
            allowCreate: false,
          });
          updated++;
        } else {
          if (!row.itinerary || row.itinerary.length === 0) {
            throw new Error("itinerary is required for new tours");
          }
          const imageFolderKey = `tours/${normalizedSlug}`;
          const images = row.images ?? [];
          const id = await ctx.db.insert("tours", {
            ...row,
            title,
            slug: normalizedSlug,
            description,
            location,
            types: row.types ?? [],
            images,
            itinerary: row.itinerary,
            imageFolderKey,
            price: pricePkr ?? 0,
            pricePkr,
            destinationIds,
            createdAt: now + i,
            updatedAt: now + i,
          });
          await syncTourImageAssetIndex(ctx, id, imageFolderKey, images);
          await ctx.runMutation(internal.destinations.syncFromTour, {
            tourId: id,
            allowCreate: true,
          });
          created++;
        }
      } catch (e) {
        errors.push({ index: i, message: e instanceof Error ? e.message : String(e) });
        skipped++;
      }
    }

    await ctx.db.insert("adminLogs", {
      action: "bulk_upsert_tours",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `processed=${rows.length} created=${created} updated=${updated} skipped=${skipped}`,
    });

    return { processed: rows.length, created, updated, skipped, errors };
  },
});
