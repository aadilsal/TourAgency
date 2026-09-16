import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  mutation,
  query,
  internalQuery,
  type QueryCtx,
} from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import {
  requireAdminFromSession,
  requireUserFromSession,
  normalizePhone,
} from "./lib/authHelpers.js";
import type { Doc, Id } from "./_generated/dataModel.js";

type CurrencyCode = "PKR" | "USD";

function normalizeCurrency(raw: unknown): CurrencyCode {
  return raw === "USD" ? "USD" : "PKR";
}

export const getGuestBookingDoc = internalQuery({
  args: { id: v.id("guestBookings") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getTourDoc = internalQuery({
  args: { id: v.id("tours") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getUserBookingDoc = internalQuery({
  args: { id: v.id("bookings") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const createGuestBooking = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    tourId: v.id("tours"),
    peopleCount: v.number(),
    currency: v.optional(v.union(v.literal("PKR"), v.literal("USD"))),
    /** Per-person price when booking a priced tour (intent = book). */
    unitPrice: v.optional(v.number()),
    notes: v.optional(v.string()),
    preferredStart: v.optional(v.string()),
    preferredEnd: v.optional(v.string()),
    departureCity: v.optional(v.string()),
    adults: v.optional(v.number()),
    children: v.optional(v.number()),
    specialNeeds: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!Number.isFinite(args.peopleCount) || args.peopleCount < 1) {
      throw new Error("At least one traveler is required");
    }
    const tour = await ctx.db.get(args.tourId);
    if (!tour || !tour.isActive) throw new Error("Tour not available");
    const now = Date.now();
    const phoneNormalized = normalizePhone(args.phone);
    const currency = normalizeCurrency(args.currency);
    const unitPrice =
      typeof args.unitPrice === "number" && args.unitPrice > 0
        ? args.unitPrice
        : undefined;
    const isBooking = unitPrice !== undefined;
    const guestBookingId = await ctx.db.insert("guestBookings", {
      name: args.name.trim(),
      phone: args.phone.trim(),
      phoneNormalized,
      email: args.email?.trim().toLowerCase() || undefined,
      tourId: args.tourId,
      peopleCount: args.peopleCount,
      currency,
      unitPrice,
      notes: args.notes,
      preferredStart: args.preferredStart?.trim() || undefined,
      preferredEnd: args.preferredEnd?.trim() || undefined,
      departureCity: args.departureCity?.trim() || undefined,
      adults: args.adults,
      children: args.children,
      specialNeeds: args.specialNeeds?.trim() || undefined,
      status: "pending",
      tourTitle: tour.title,
      createdAt: now,
    });
    const start = args.preferredStart?.trim() || "—";
    const window =
      args.preferredStart || args.preferredEnd
        ? `, window ${args.preferredStart ?? "?"}–${args.preferredEnd ?? "?"}`
        : "";
    const city = args.departureCity ? `, from ${args.departureCity}` : "";
    const notes = args.notes?.trim() ? `, notes: ${args.notes.trim()}` : "";
    await ctx.db.insert("leads", {
      name: args.name.trim(),
      phone: args.phone.trim(),
      source: "Tour customisation",
      message: `${isBooking ? "Booking request" : "Customisation request"} for ${tour.title} — ${args.peopleCount} travelers, start ${start}${window}${city}${notes}`,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(
      0,
      internal.email.sendGuestBookingNotification,
      { guestBookingId },
    );
    return guestBookingId;
  },
});

export const createBooking = mutation({
  args: {
    sessionToken: v.string(),
    tourId: v.id("tours"),
    peopleCount: v.number(),
    currency: v.optional(v.union(v.literal("PKR"), v.literal("USD"))),
    notes: v.optional(v.string()),
    preferredStart: v.optional(v.string()),
    preferredEnd: v.optional(v.string()),
    departureCity: v.optional(v.string()),
    adults: v.optional(v.number()),
    children: v.optional(v.number()),
    specialNeeds: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sessionToken, tourId, peopleCount, notes } = args;
    const user = await requireUserFromSession(ctx, sessionToken);
    if (user.role === "admin" || user.role === "super_admin") {
      // admins can still book as themselves for testing
    }
    const tour = await ctx.db.get(tourId);
    if (!tour || !tour.isActive) throw new Error("Tour not available");
    const currency = normalizeCurrency(args.currency);
    const now = Date.now();
    const bookingId = await ctx.db.insert("bookings", {
      userId: user._id,
      tourId,
      peopleCount,
      currency,
      unitPrice: undefined,
      totalPrice: 0,
      status: "pending",
      notes,
      preferredStart: args.preferredStart?.trim() || undefined,
      preferredEnd: args.preferredEnd?.trim() || undefined,
      departureCity: args.departureCity?.trim() || undefined,
      adults: args.adults,
      children: args.children,
      specialNeeds: args.specialNeeds?.trim() || undefined,
      tourTitle: tour.title,
      createdAt: now,
    });
    const start = args.preferredStart?.trim() || "—";
    const window =
      args.preferredStart || args.preferredEnd
        ? `, window ${args.preferredStart ?? "?"}–${args.preferredEnd ?? "?"}`
        : "";
    const city = args.departureCity ? `, from ${args.departureCity}` : "";
    const noteLine = notes?.trim() ? `, notes: ${notes.trim()}` : "";
    await ctx.db.insert("leads", {
      name: user.name,
      phone: user.phone?.trim() || "—",
      source: "Tour customisation",
      message: `Member customisation for ${tour.title} — ${peopleCount} travelers, start ${start}${window}${city}${noteLine}`,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.email.sendUserBookingNotification, {
      bookingId,
    });
    return bookingId;
  },
});

export const getUserBookings = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    const list = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const linkedGuests = await ctx.db
      .query("guestBookings")
      .withIndex("by_linked_user", (q) => q.eq("linkedUserId", user._id))
      .collect();

    const memberRows = await Promise.all(
      list.map(async (b) => {
        const tour = await ctx.db.get(b.tourId);
        return {
          source: "member" as const,
          _id: b._id,
          peopleCount: b.peopleCount,
          currency: normalizeCurrency(b.currency),
          unitPrice: Number.isFinite(b.unitPrice) ? b.unitPrice : undefined,
          totalPrice: b.totalPrice,
          status: b.status,
          createdAt: b.createdAt,
          preferredStart: b.preferredStart,
          preferredEnd: b.preferredEnd,
          departureCity: b.departureCity,
          tour,
        };
      }),
    );

    const guestRows = await Promise.all(
      linkedGuests.map(async (g) => {
        const tour = await ctx.db.get(g.tourId);
        const currency = normalizeCurrency(g.currency);
        const unitPrice = Number.isFinite(g.unitPrice)
          ? g.unitPrice
          : undefined;
        const totalPrice =
          unitPrice != null ? unitPrice * g.peopleCount : 0;
        return {
          source: "guest" as const,
          _id: g._id,
          peopleCount: g.peopleCount,
          currency,
          unitPrice,
          totalPrice,
          status: g.status,
          createdAt: g.createdAt,
          preferredStart: g.preferredStart,
          preferredEnd: g.preferredEnd,
          departureCity: g.departureCity,
          tour,
        };
      }),
    );

    return [...memberRows, ...guestRows].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  },
});

export type UnifiedBooking =
  | {
      kind: "guest";
      id: Id<"guestBookings">;
      tourId: Id<"tours">;
      name: string;
      phone: string;
      email?: string;
      tourTitle: string;
      peopleCount: number;
      status: "pending" | "confirmed" | "cancelled";
      currency?: CurrencyCode;
      unitPrice?: number;
      totalPrice: number;
      createdAt: number;
      preferredStart?: string;
      preferredEnd?: string;
      departureCity?: string;
      adults?: number;
      children?: number;
      specialNeeds?: string;
      notes?: string;
      itineraryId?: Id<"itineraries">;
      itineraryTitle?: string;
      adminNote?: string;
      /** True when the tour document no longer exists. */
      tourDeleted?: boolean;
    }
  | {
      kind: "user";
      id: Id<"bookings">;
      tourId: Id<"tours">;
      name: string;
      email: string;
      phone?: string;
      tourTitle: string;
      peopleCount: number;
      status: "pending" | "confirmed" | "cancelled";
      currency?: CurrencyCode;
      unitPrice?: number;
      totalPrice: number;
      createdAt: number;
      preferredStart?: string;
      preferredEnd?: string;
      departureCity?: string;
      adults?: number;
      children?: number;
      specialNeeds?: string;
      notes?: string;
      itineraryId?: Id<"itineraries">;
      itineraryTitle?: string;
      adminNote?: string;
      /** True when the tour document no longer exists. */
      tourDeleted?: boolean;
    };

const DELETED_TOUR_LABEL = "Deleted tour";

async function toGuestRow(
  ctx: QueryCtx,
  g: Doc<"guestBookings">,
): Promise<UnifiedBooking> {
  const tour = await ctx.db.get(g.tourId);
  const currency = normalizeCurrency(g.currency);
  const unitPrice = Number.isFinite(g.unitPrice)
    ? g.unitPrice
    : undefined;
  const itinerary = await ctx.db
    .query("itineraries")
    .withIndex("by_source_guest_booking", (q) =>
      q.eq("sourceGuestBookingId", g._id),
    )
    .first();
  return {
    kind: "guest" as const,
    id: g._id,
    tourId: g.tourId,
    name: g.name,
    phone: g.phone,
    email: g.email,
    tourTitle: g.tourTitle ?? tour?.title ?? DELETED_TOUR_LABEL,
    tourDeleted: tour === null,
    peopleCount: g.peopleCount,
    status: g.status,
    currency,
    unitPrice,
    totalPrice: unitPrice != null ? unitPrice * g.peopleCount : 0,
    createdAt: g.createdAt,
    preferredStart: g.preferredStart,
    preferredEnd: g.preferredEnd,
    departureCity: g.departureCity,
    adults: g.adults,
    children: g.children,
    specialNeeds: g.specialNeeds,
    notes: g.notes,
    itineraryId: itinerary?._id,
    itineraryTitle: itinerary?.title,
    adminNote: g.adminNote,
  };
}

async function toUserRow(
  ctx: QueryCtx,
  b: Doc<"bookings">,
): Promise<UnifiedBooking> {
  const tour = await ctx.db.get(b.tourId);
  const user = await ctx.db.get(b.userId);
  const itinerary = await ctx.db
    .query("itineraries")
    .withIndex("by_source_booking", (q) => q.eq("sourceBookingId", b._id))
    .first();
  return {
    kind: "user" as const,
    id: b._id,
    tourId: b.tourId,
    name: user?.name ?? "User",
    email: user?.email ?? "",
    phone: user?.phone,
    tourTitle: b.tourTitle ?? tour?.title ?? DELETED_TOUR_LABEL,
    tourDeleted: tour === null,
    peopleCount: b.peopleCount,
    status: b.status,
    currency: normalizeCurrency(b.currency),
    unitPrice: Number.isFinite(b.unitPrice) ? b.unitPrice : undefined,
    totalPrice: b.totalPrice,
    createdAt: b.createdAt,
    preferredStart: b.preferredStart,
    preferredEnd: b.preferredEnd,
    departureCity: b.departureCity,
    adults: b.adults,
    children: b.children,
    specialNeeds: b.specialNeeds,
    notes: b.notes,
    itineraryId: itinerary?._id,
    itineraryTitle: itinerary?.title,
    adminNote: b.adminNote,
  };
}

const bookingKindValidator = v.union(v.literal("guest"), v.literal("user"));

const bookingStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("cancelled"),
);

/**
 * @deprecated Loads bookings plus 2-3 lookups per row; use `listBookingsPage`.
 * Kept (bounded, newest first) for the currently deployed admin UI.
 */
export const getAllBookings = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const guests = await ctx.db.query("guestBookings").order("desc").take(1000);
    const usersB = await ctx.db.query("bookings").order("desc").take(1000);
    const guestRows = await Promise.all(guests.map((g) => toGuestRow(ctx, g)));
    const userRows = await Promise.all(usersB.map((b) => toUserRow(ctx, b)));
    return [...guestRows, ...userRows].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  },
});

/**
 * Paginated admin bookings inbox for ONE source table (guest requests or
 * member bookings), newest first, optional indexed status filter. The admin
 * UI pages both kinds and merges them client-side in creation order.
 */
export const listBookingsPage = query({
  args: {
    sessionToken: v.string(),
    kind: bookingKindValidator,
    status: v.optional(bookingStatusValidator),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { sessionToken, kind, status, paginationOpts }) => {
    await requireAdminFromSession(ctx, sessionToken);
    if (kind === "guest") {
      const result = status
        ? await ctx.db
            .query("guestBookings")
            .withIndex("by_status", (q) => q.eq("status", status))
            .order("desc")
            .paginate(paginationOpts)
        : await ctx.db.query("guestBookings").order("desc").paginate(paginationOpts);
      return {
        ...result,
        page: await Promise.all(result.page.map((g) => toGuestRow(ctx, g))),
      };
    }
    const result = status
      ? await ctx.db
          .query("bookings")
          .withIndex("by_status", (q) => q.eq("status", status))
          .order("desc")
          .paginate(paginationOpts)
      : await ctx.db.query("bookings").order("desc").paginate(paginationOpts);
    return {
      ...result,
      page: await Promise.all(result.page.map((b) => toUserRow(ctx, b))),
    };
  },
});

export const updateBookingStatus = mutation({
  args: {
    sessionToken: v.string(),
    kind: bookingKindValidator,
    id: v.string(),
    status: bookingStatusValidator,
  },
  handler: async (ctx, { sessionToken, kind, id, status }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    if (kind === "guest") {
      const docId = ctx.db.normalizeId("guestBookings", id);
      if (!docId || !(await ctx.db.get(docId))) throw new Error("Booking not found");
      await ctx.db.patch(docId, { status });
    } else {
      const docId = ctx.db.normalizeId("bookings", id);
      if (!docId || !(await ctx.db.get(docId))) throw new Error("Booking not found");
      await ctx.db.patch(docId, { status });
    }
    await ctx.db.insert("adminLogs", {
      action: "update_booking_status",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `${kind}:${id}:${status}`,
    });
  },
});

/** Set the internal admin note on a booking (status untouched). "" clears it. */
export const setBookingAdminNote = mutation({
  args: {
    sessionToken: v.string(),
    kind: bookingKindValidator,
    id: v.string(),
    adminNote: v.string(),
  },
  handler: async (ctx, { sessionToken, kind, id, adminNote }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    const patch = {
      adminNote: adminNote.trim() || undefined,
      adminNoteUpdatedAt: Date.now(),
    };
    if (kind === "guest") {
      const docId = ctx.db.normalizeId("guestBookings", id);
      if (!docId || !(await ctx.db.get(docId))) throw new Error("Booking not found");
      await ctx.db.patch(docId, patch);
    } else {
      const docId = ctx.db.normalizeId("bookings", id);
      if (!docId || !(await ctx.db.get(docId))) throw new Error("Booking not found");
      await ctx.db.patch(docId, patch);
    }
    await ctx.db.insert("adminLogs", {
      action: "update_booking_note",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `${kind}:${id}`,
    });
  },
});
