import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import type { QueryCtx } from "./_generated/server.js";
import type { Doc } from "./_generated/dataModel.js";
import { requireUserFromSession } from "./lib/authHelpers.js";
import { paginationOptsValidator } from "convex/server";

function assertAdminFromSession(
  user: { role: string },
): asserts user is { role: "admin" | "super_admin" } {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
}

const activityValidator = v.object({
  title: v.string(),
  description: v.string(),
  icon: v.union(
    v.literal("flight"),
    v.literal("hotel"),
    v.literal("food"),
    v.literal("sightseeing"),
  ),
});

const dayPlanValidator = v.object({
  dayNumber: v.number(),
  title: v.string(),
  imageStorageId: v.optional(v.id("_storage")),
  highlights: v.optional(v.array(v.string())),
  overnight: v.optional(v.string()),
  morning: v.array(activityValidator),
  afternoon: v.array(activityValidator),
  evening: v.array(activityValidator),
});

const packageValidator = v.object({
  name: v.string(),
  pricePkr: v.optional(v.number()),
  vehicle: v.optional(v.string()),
  note: v.optional(v.string()),
  stays: v.optional(
    v.array(
      v.object({
        location: v.string(),
        hotel: v.string(),
        nights: v.number(),
      }),
    ),
  ),
});

const paymentTermValidator = v.object({
  percent: v.number(),
  title: v.string(),
  description: v.optional(v.string()),
});

const bankDetailsValidator = v.object({
  bankName: v.optional(v.string()),
  accountTitle: v.optional(v.string()),
  accountNumber: v.optional(v.string()),
  iban: v.optional(v.string()),
  instruction: v.optional(v.string()),
});

const termsBlockValidator = v.object({
  title: v.string(),
  body: v.string(),
});

const atGlanceDayValidator = v.object({
  dayNumber: v.number(),
  title: v.string(),
  detail: v.string(),
  overnight: v.optional(v.string()),
});

const packageStayRowValidator = v.object({
  location: v.string(),
});

const packageTierValidator = v.object({
  name: v.string(),
  pricePkr: v.optional(v.number()),
  vehicle: v.optional(v.string()),
  note: v.optional(v.string()),
  stays: v.optional(
    v.array(
      v.object({
        location: v.string(),
        hotel: v.string(),
        nights: v.number(),
      }),
    ),
  ),
  hotels: v.array(
    v.object({
      hotel: v.string(),
      nights: v.number(),
    }),
  ),
});

const TRIMMED_STRING_FIELDS = new Set([
  "headline",
  "variantLabel",
  "coverSubtitle",
  "complianceLine",
  "licenceNumber",
  "pickupDropoff",
  "title",
  "clientName",
  "companyDescription",
  "contactPhone",
  "contactEmail",
  "contactWebsite",
  "transportType",
  "accommodationType",
  "mealsIncluded",
  "accommodationDetails",
  "importantNotes",
]);

/**
 * Normalises a partial itinerary update. Patch convention:
 * `undefined` = leave unchanged, `null` = clear the field.
 */
function normalizeItineraryPatch(patch: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(patch)) {
    if (val === undefined) continue;
    if (k === "startDate" || k === "endDate") {
      // `null` or a blank string clears the date.
      next[k] = typeof val === "string" && val.trim() ? val.trim() : undefined;
      continue;
    }
    if (k === "coverImageStorageId") {
      // `null` means "clear it": patching a field to undefined removes it.
      next[k] = val === null ? undefined : val;
      continue;
    }
    if (TRIMMED_STRING_FIELDS.has(k) && typeof val === "string") {
      next[k] = val.trim();
      continue;
    }
    if (
      (k === "destinations" || k === "included" || k === "notIncluded") &&
      Array.isArray(val)
    ) {
      next[k] = val.map((s) => String(s).trim()).filter(Boolean);
      continue;
    }
    if (k === "atGlanceDays" && Array.isArray(val)) {
      next[k] = (val as unknown[]).map((item) => {
        const d = item as Record<string, unknown>;
        return {
          dayNumber:
            typeof d.dayNumber === "number" ? d.dayNumber : Number(d.dayNumber) || 0,
          title: String(d.title ?? "").trim(),
          detail: String(d.detail ?? "").trim(),
          overnight:
            typeof d.overnight === "string" && d.overnight.trim()
              ? d.overnight.trim()
              : undefined,
        };
      });
      continue;
    }
    if (k === "packageStayRows" && Array.isArray(val)) {
      next[k] = (val as unknown[]).map((item) => {
        const r = item as Record<string, unknown>;
        return { location: String(r.location ?? "").trim() };
      });
      continue;
    }
    if (k === "packageTiers" && Array.isArray(val)) {
      next[k] = (val as unknown[]).map((item) => {
        const t = item as Record<string, unknown>;
        const stays = Array.isArray(t.stays) ? t.stays : [];
        const hotels = Array.isArray(t.hotels) ? t.hotels : [];
        return {
          name: String(t.name ?? "").trim(),
          pricePkr:
            typeof t.pricePkr === "number" && Number.isFinite(t.pricePkr)
              ? t.pricePkr
              : undefined,
          vehicle:
            typeof t.vehicle === "string" && t.vehicle.trim() ? t.vehicle.trim() : undefined,
          note: typeof t.note === "string" && t.note.trim() ? t.note.trim() : undefined,
          stays: stays.map((s) => {
            const row = s as Record<string, unknown>;
            return {
              location: String(row.location ?? "").trim(),
              hotel: String(row.hotel ?? "").trim(),
              nights: Math.max(1, Math.floor(Number(row.nights) || 1)),
            };
          }),
          hotels: (hotels as unknown[]).map((h) => {
            const row = h as Record<string, unknown>;
            return {
              hotel: String(row.hotel ?? "").trim(),
              nights: Math.max(1, Math.floor(Number(row.nights) || 1)),
            };
          }),
        };
      });
      continue;
    }
    next[k] = val;
  }
  return next;
}

export const createDraft = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    clientName: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    days: v.number(),
    theme: v.union(
      v.literal("luxury"),
      v.literal("minimal"),
      v.literal("adventure"),
    ),
    coverImageStorageId: v.optional(v.id("_storage")),
    sourceTourId: v.optional(v.id("tours")),
    sourceBookingId: v.optional(v.id("bookings")),
    sourceGuestBookingId: v.optional(v.id("guestBookings")),

    /**
     * Optional content typed before the draft existed. Saved in the same
     * transaction as the insert, so nothing typed on the "new" screen can be
     * lost between creating the draft and a follow-up patch.
     */
    headline: v.optional(v.string()),
    variantLabel: v.optional(v.string()),
    coverSubtitle: v.optional(v.string()),
    complianceLine: v.optional(v.string()),
    pickupDropoff: v.optional(v.string()),
    atGlanceDays: v.optional(v.array(atGlanceDayValidator)),
    packageTiers: v.optional(v.array(packageTierValidator)),
    included: v.optional(v.array(v.string())),
    notIncluded: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSession(ctx, args.sessionToken);
    assertAdminFromSession(user);

    const now = Date.now();
    const safeDays = Math.max(1, Math.min(60, Math.floor(args.days)));
    const atGlanceDays = Array.from({ length: safeDays }, (_, i) => ({
      dayNumber: i + 1,
      title: "",
      detail: "",
    }));

    const initial = normalizeItineraryPatch({
      headline: args.headline,
      variantLabel: args.variantLabel,
      coverSubtitle: args.coverSubtitle,
      complianceLine: args.complianceLine,
      pickupDropoff: args.pickupDropoff,
      atGlanceDays: args.atGlanceDays,
      packageTiers: args.packageTiers,
      included: args.included,
      notIncluded: args.notIncluded,
    });

    const id = await ctx.db.insert("itineraries", {
      headline: "Your Dream Trip Awaits —",
      variantLabel: "Customised",
      coverSubtitle: "",
      complianceLine: "JunketTours — Government Registered Tourism Company | DTS",
      licenceNumber: "",
      pickupDropoff: "",

      title: args.title.trim(),
      clientName: args.clientName.trim(),
      startDate: args.startDate?.trim() || undefined,
      endDate: args.endDate?.trim() || undefined,
      days: safeDays,
      theme: args.theme,
      status: "draft",
      coverImageStorageId: args.coverImageStorageId,
      sourceTourId: args.sourceTourId,
      sourceBookingId: args.sourceBookingId,
      sourceGuestBookingId: args.sourceGuestBookingId,
      affiliationsStorageIds: [],
      destinations: [],
      dayPlans: [],
      layoutVariant: "simple",
      atGlanceDays,
      packageStayRows: [],
      packageTiers: [],
      included: [],
      notIncluded: [],
      packages: [],
      ...(initial as Partial<Doc<"itineraries">>),
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("adminLogs", {
      action: "itinerary_create_draft",
      performedBy: user._id,
      timestamp: now,
      details: `${id}`,
    });

    return id;
  },
});

export const patchDraft = mutation({
  args: {
    sessionToken: v.string(),
    itineraryId: v.id("itineraries"),

    headline: v.optional(v.string()),
    variantLabel: v.optional(v.string()),
    coverSubtitle: v.optional(v.string()),
    complianceLine: v.optional(v.string()),
    licenceNumber: v.optional(v.string()),
    pickupDropoff: v.optional(v.string()),

    title: v.optional(v.string()),
    clientName: v.optional(v.string()),
    /** Pass `null` (or "") to clear the date. */
    startDate: v.optional(v.union(v.string(), v.null())),
    endDate: v.optional(v.union(v.string(), v.null())),
    days: v.optional(v.number()),
    theme: v.optional(
      v.union(v.literal("luxury"), v.literal("minimal"), v.literal("adventure")),
    ),

    /** Pass `null` to clear the cover and fall back to the default map image. */
    coverImageStorageId: v.optional(v.union(v.id("_storage"), v.null())),

    companyDescription: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    affiliationsStorageIds: v.optional(v.array(v.id("_storage"))),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactWebsite: v.optional(v.string()),

    destinations: v.optional(v.array(v.string())),
    transportType: v.optional(v.string()),
    accommodationType: v.optional(v.string()),
    mealsIncluded: v.optional(v.string()),

    dayPlans: v.optional(v.array(dayPlanValidator)),

    accommodationDetails: v.optional(v.string()),
    included: v.optional(v.array(v.string())),
    notIncluded: v.optional(v.array(v.string())),
    importantNotes: v.optional(v.string()),

    packages: v.optional(v.array(packageValidator)),
    paymentTerms: v.optional(v.array(paymentTermValidator)),
    bankDetails: v.optional(bankDetailsValidator),
    termsBlocks: v.optional(v.array(termsBlockValidator)),

    layoutVariant: v.optional(
      v.union(v.literal("simple"), v.literal("advanced")),
    ),
    atGlanceDays: v.optional(v.array(atGlanceDayValidator)),
    packageStayRows: v.optional(v.array(packageStayRowValidator)),
    packageTiers: v.optional(v.array(packageTierValidator)),
  },
  handler: async (ctx, { sessionToken, itineraryId, ...patch }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const existing = await ctx.db.get(itineraryId);
    if (!existing) throw new Error("Itinerary not found");

    const next = normalizeItineraryPatch(patch);
    next.updatedAt = Date.now();
    await ctx.db.patch(itineraryId, next);
    await ctx.db.insert("adminLogs", {
      action: "itinerary_patch",
      performedBy: user._id,
      timestamp: Date.now(),
      details: `${itineraryId}`,
    });
  },
});

export const getForAdmin = query({
  args: { sessionToken: v.string(), itineraryId: v.id("itineraries") },
  handler: async (ctx, { sessionToken, itineraryId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    return await ctx.db.get(itineraryId);
  },
});

export const listForAdmin = query({
  args: {
    sessionToken: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { sessionToken, paginationOpts }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const paged = await ctx.db
      .query("itineraries")
      .withIndex("by_created")
      .order("desc")
      .paginate(paginationOpts);

    const page = await Promise.all(paged.page.map((i) => toAdminListRow(ctx, i)));

    return { ...paged, page };
  },
});

async function toAdminListRow(ctx: QueryCtx, i: Doc<"itineraries">) {
  const invoice = await ctx.db
    .query("invoices")
    .withIndex("by_itinerary", (q) => q.eq("itineraryId", i._id))
    .first();
  return {
    _id: i._id,
    title: i.title,
    clientName: i.clientName,
    startDate: i.startDate,
    endDate: i.endDate,
    days: i.days,
    status: i.status,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    invoiceId: invoice?._id,
  };
}

/**
 * Server-side search across ALL itineraries (title or client name), so records
 * outside the currently loaded page are never "missing" from admin search.
 */
export const searchForAdmin = query({
  args: {
    sessionToken: v.string(),
    search: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { sessionToken, search, limit }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const term = search.trim();
    if (!term) return [];
    const max = Math.max(1, Math.min(100, Math.floor(limit ?? 50)));

    const [byTitle, byClient] = await Promise.all([
      ctx.db
        .query("itineraries")
        .withSearchIndex("search_title", (q) => q.search("title", term))
        .take(max),
      ctx.db
        .query("itineraries")
        .withSearchIndex("search_client", (q) => q.search("clientName", term))
        .take(max),
    ]);

    const seen = new Set<string>();
    const merged: Doc<"itineraries">[] = [];
    for (const row of [...byClient, ...byTitle]) {
      if (seen.has(row._id)) continue;
      seen.add(row._id);
      merged.push(row);
    }
    const rows = merged.slice(0, max);
    return await Promise.all(rows.map((i) => toAdminListRow(ctx, i)));
  },
});

export const markFinal = mutation({
  args: { sessionToken: v.string(), itineraryId: v.id("itineraries") },
  handler: async (ctx, { sessionToken, itineraryId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const row = await ctx.db.get(itineraryId);
    if (!row) throw new Error("Itinerary not found");
    if (row.status === "final") return;

    const now = Date.now();
    await ctx.db.patch(itineraryId, { status: "final", updatedAt: now });
    await ctx.db.insert("adminLogs", {
      action: "itinerary_mark_final",
      performedBy: user._id,
      timestamp: now,
      details: `${itineraryId}`,
    });
  },
});

export const markDraft = mutation({
  args: { sessionToken: v.string(), itineraryId: v.id("itineraries") },
  handler: async (ctx, { sessionToken, itineraryId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const row = await ctx.db.get(itineraryId);
    if (!row) throw new Error("Itinerary not found");
    if (row.status === "draft") return;

    const now = Date.now();
    await ctx.db.patch(itineraryId, { status: "draft", updatedAt: now });
    await ctx.db.insert("adminLogs", {
      action: "itinerary_mark_draft",
      performedBy: user._id,
      timestamp: now,
      details: `${itineraryId}`,
    });
  },
});

export const deleteItinerary = mutation({
  args: { sessionToken: v.string(), itineraryId: v.id("itineraries") },
  handler: async (ctx, { sessionToken, itineraryId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const row = await ctx.db.get(itineraryId);
    if (!row) return;
    await ctx.db.delete(itineraryId);
    await ctx.db.insert("adminLogs", {
      action: "itinerary_delete",
      performedBy: user._id,
      timestamp: Date.now(),
      details: `${itineraryId}`,
    });
  },
});
