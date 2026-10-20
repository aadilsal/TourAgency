import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server.js";
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
  "clientPhone",
  "clientEmail",
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
    if (k === "clientPhone" || k === "clientEmail") {
      // `null` clears the contact; strings are trimmed.
      next[k] = typeof val === "string" ? val.trim() : undefined;
      continue;
    }
    if (k === "adults" || k === "children") {
      // `null` clears the count.
      next[k] =
        typeof val === "number" && Number.isFinite(val) ? Math.max(0, Math.floor(val)) : undefined;
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

type AtGlanceRow = { dayNumber: number; title: string; detail: string; overnight?: string };
type TierArg = {
  name: string;
  pricePkr?: number;
  vehicle?: string;
  note?: string;
  stays?: Array<{ location: string; hotel: string; nights: number }>;
  hotels: Array<{ hotel: string; nights: number }>;
};

/** True when no day row has any text (what a fresh builder sends). */
export function isBlankDayList(days: AtGlanceRow[] | undefined): boolean {
  return (
    !days ||
    days.every((d) => !d.title.trim() && !d.detail.trim() && !(d.overnight ?? "").trim())
  );
}

/** Auto-generated stay label ("Stop 1") the builder sends for an untouched row. */
const AUTO_STOP_LABEL = /^stop \d+$/i;

/** True when no package has a price, vehicle, note or hotel (a fresh builder's blank tier). */
export function isBlankTierList(tiers: TierArg[] | undefined): boolean {
  return (
    !tiers ||
    tiers.every(
      (t) =>
        typeof t.pricePkr !== "number" &&
        !(t.vehicle ?? "").trim() &&
        !(t.note ?? "").trim() &&
        (t.stays ?? []).every(
          (st) =>
            !st.hotel.trim() && (!st.location.trim() || AUTO_STOP_LABEL.test(st.location.trim())),
        ) &&
        t.hotels.every((h) => !h.hotel.trim()),
    )
  );
}

/** YYYY-MM-DD + n days (calendar math in UTC), or undefined for a bad date. */
function addDaysYmd(ymd: string, n: number): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return undefined;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n));
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : undefined;
}

type TourPrefillResult = {
  days: number;
  atGlanceDays?: AtGlanceRow[];
  packageTiers?: TierArg[];
  included?: string[];
  notIncluded?: string[];
};

/**
 * Content copied from the source tour into a NEW itinerary. Only fills what
 * the caller left blank — anything the admin typed or passed always wins.
 */
export function tourPrefill(
  tour: Pick<
    Doc<"tours">,
    "durationDays" | "itinerary" | "included" | "excluded" | "pricePkr" | "priceUsd" | "price"
  >,
  args: {
    days: number;
    atGlanceDays?: AtGlanceRow[];
    packageTiers?: TierArg[];
    included?: string[];
    notIncluded?: string[];
  },
  siteDefaults: { included?: string[]; notIncluded?: string[] } = {},
): TourPrefillResult {
  const out: TourPrefillResult = { days: args.days };
  const plan = [...(tour.itinerary ?? [])]
    .sort((a, b) => a.day - b.day)
    .filter((d) => d.title.trim() || d.description.trim());
  if (isBlankDayList(args.atGlanceDays) && plan.length > 0) {
    const count = Math.max(
      1,
      Math.min(60, Math.max(plan.length, Math.floor(tour.durationDays || 0))),
    );
    out.days = count;
    out.atGlanceDays = Array.from({ length: count }, (_, i) => ({
      dayNumber: i + 1,
      title: plan[i]?.title.trim() ?? "",
      detail: plan[i]?.description.trim() ?? "",
    }));
  }
  const hasItems = (list: string[] | undefined) => (list ?? []).some((x) => x.trim());
  if (!hasItems(args.included)) {
    if (hasItems(tour.included)) out.included = tour.included;
    else if (args.included === undefined && hasItems(siteDefaults.included)) {
      out.included = siteDefaults.included;
    }
  }
  if (!hasItems(args.notIncluded)) {
    if (hasItems(tour.excluded)) out.notIncluded = tour.excluded;
    else if (args.notIncluded === undefined && hasItems(siteDefaults.notIncluded)) {
      out.notIncluded = siteDefaults.notIncluded;
    }
  }
  const pkr =
    typeof tour.pricePkr === "number" && tour.pricePkr > 0
      ? tour.pricePkr
      : typeof tour.price === "number" && tour.price > 0
        ? tour.price
        : undefined;
  const usd = typeof tour.priceUsd === "number" && tour.priceUsd > 0 ? tour.priceUsd : undefined;
  if (isBlankTierList(args.packageTiers) && (pkr !== undefined || usd !== undefined)) {
    const nights = Math.max(1, out.days - 1);
    out.packageTiers = [
      {
        name: args.packageTiers?.[0]?.name?.trim() || "Standard",
        pricePkr: pkr,
        // Package prices are PKR-only; a USD-only tour keeps its price visible as a note.
        note:
          pkr === undefined && usd !== undefined
            ? `Price: USD ${usd.toLocaleString("en-US")}`
            : undefined,
        stays: [{ location: "", hotel: "", nights }],
        hotels: [{ hotel: "", nights }],
      },
    ];
  }
  return out;
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

    clientPhone: v.optional(v.string()),
    clientEmail: v.optional(v.string()),
    adults: v.optional(v.number()),
    children: v.optional(v.number()),

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
    let safeDays = Math.max(1, Math.min(60, Math.floor(args.days)));

    // Starting from a tour: copy its day plan, inclusions and price into the
    // fields the admin left blank. Insert path only — an existing draft is
    // never touched.
    const tour = args.sourceTourId ? await ctx.db.get(args.sourceTourId) : null;
    let fromTour: Record<string, unknown> = {};
    if (tour) {
      const settings = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", "global"))
        .unique();
      const { days, ...rest } = tourPrefill(
        tour,
        {
          days: safeDays,
          atGlanceDays: args.atGlanceDays,
          packageTiers: args.packageTiers,
          included: args.included,
          notIncluded: args.notIncluded,
        },
        { included: settings?.defaultIncluded, notIncluded: settings?.defaultNotIncluded },
      );
      safeDays = days;
      fromTour = normalizeItineraryPatch(rest);
    }

    const atGlanceDays = Array.from({ length: safeDays }, (_, i) => ({
      dayNumber: i + 1,
      title: "",
      detail: "",
    }));

    const startDate = args.startDate?.trim() || undefined;
    const endDate =
      args.endDate?.trim() ||
      (tour && startDate ? addDaysYmd(startDate, safeDays - 1) : undefined);

    const initial = normalizeItineraryPatch({
      clientPhone: args.clientPhone,
      clientEmail: args.clientEmail,
      adults: args.adults,
      children: args.children,
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

      title: args.title.trim() || tour?.title || "",
      clientName: args.clientName.trim(),
      startDate,
      endDate,
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
      ...(fromTour as Partial<Doc<"itineraries">>),
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
    /** Pass `null` to clear. */
    clientPhone: v.optional(v.union(v.string(), v.null())),
    clientEmail: v.optional(v.union(v.string(), v.null())),
    adults: v.optional(v.union(v.number(), v.null())),
    children: v.optional(v.union(v.number(), v.null())),
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

/** Active tours for the "Start from a tour" picker on a new itinerary. */
export const listTourOptionsForAdmin = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const rows = await ctx.db
      .query("tours")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(300);
    return rows
      .map((t) => ({
        _id: t._id,
        title: t.title,
        location: t.location,
        durationDays: t.durationDays,
        pricePkr: t.pricePkr ?? t.price,
        priceUsd: t.priceUsd,
        dayPlanCount: t.itinerary.length,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  },
});

/** The source tour's real day plan, used as the base for AI day drafting. */
export const getTourPlanForAi = internalQuery({
  args: { tourId: v.id("tours") },
  handler: async (ctx, { tourId }) => {
    const tour = await ctx.db.get(tourId);
    if (!tour) return null;
    return {
      title: tour.title,
      location: tour.location,
      durationDays: tour.durationDays,
      itinerary: [...tour.itinerary]
        .sort((a, b) => a.day - b.day)
        .map((d) => ({ day: d.day, title: d.title, description: d.description })),
    };
  },
});
