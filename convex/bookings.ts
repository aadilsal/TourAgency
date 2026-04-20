import { v } from "convex/values";
import {
  mutation,
  query,
  internalQuery,
} from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import {
  requireAdmin,
  requireUserFromSession,
  normalizePhone,
} from "./lib/authHelpers.js";
import type { Id } from "./_generated/dataModel.js";

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
    const guestBookingId = await ctx.db.insert("guestBookings", {
      name: args.name.trim(),
      phone: args.phone.trim(),
      phoneNormalized,
      email: args.email?.trim().toLowerCase() || undefined,
      tourId: args.tourId,
      peopleCount: args.peopleCount,
      notes: args.notes,
      preferredStart: args.preferredStart?.trim() || undefined,
      preferredEnd: args.preferredEnd?.trim() || undefined,
      departureCity: args.departureCity?.trim() || undefined,
      adults: args.adults,
      children: args.children,
      specialNeeds: args.specialNeeds?.trim() || undefined,
      status: "pending",
      createdAt: now,
    });
    const window =
      args.preferredStart || args.preferredEnd
        ? ` | window ${args.preferredStart ?? "?"}–${args.preferredEnd ?? "?"}`
        : "";
    const city = args.departureCity ? ` | from ${args.departureCity}` : "";
    await ctx.db.insert("leads", {
      name: args.name.trim(),
      phone: args.phone.trim(),
      source: "Booking",
      message: `Guest booking for ${tour.title} (${args.peopleCount} people)${window}${city}`,
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
    const totalPrice = tour.price * peopleCount;
    const now = Date.now();
    const bookingId = await ctx.db.insert("bookings", {
      userId: user._id,
      tourId,
      peopleCount,
      totalPrice,
      status: "pending",
      notes,
      preferredStart: args.preferredStart?.trim() || undefined,
      preferredEnd: args.preferredEnd?.trim() || undefined,
      departureCity: args.departureCity?.trim() || undefined,
      adults: args.adults,
      children: args.children,
      specialNeeds: args.specialNeeds?.trim() || undefined,
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
        const totalPrice =
          tour && Number.isFinite(tour.price)
            ? tour.price * g.peopleCount
            : 0;
        return {
          source: "guest" as const,
          _id: g._id,
          peopleCount: g.peopleCount,
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
      name: string;
      phone: string;
      email?: string;
      tourTitle: string;
      peopleCount: number;
      status: "pending" | "confirmed" | "cancelled";
      totalPrice: number;
      createdAt: number;
      preferredStart?: string;
      preferredEnd?: string;
      departureCity?: string;
      adults?: number;
      children?: number;
      specialNeeds?: string;
    }
  | {
      kind: "user";
      id: Id<"bookings">;
      name: string;
      email: string;
      tourTitle: string;
      peopleCount: number;
      status: "pending" | "confirmed" | "cancelled";
      totalPrice: number;
      createdAt: number;
      preferredStart?: string;
      preferredEnd?: string;
      departureCity?: string;
      adults?: number;
      children?: number;
      specialNeeds?: string;
    };

export const getAllBookings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const guests = await ctx.db.query("guestBookings").collect();
    const usersB = await ctx.db.query("bookings").collect();
    const guestRows: UnifiedBooking[] = await Promise.all(
      guests.map(async (g) => {
        const tour = await ctx.db.get(g.tourId);
        const tourPrice =
          tour && Number.isFinite(tour.price) ? (tour.price as number) : 0;
        return {
          kind: "guest" as const,
          id: g._id,
          name: g.name,
          phone: g.phone,
          email: g.email,
          tourTitle: tour?.title ?? "Unknown",
          peopleCount: g.peopleCount,
          status: g.status,
          totalPrice: tourPrice * g.peopleCount,
          createdAt: g.createdAt,
          preferredStart: g.preferredStart,
          preferredEnd: g.preferredEnd,
          departureCity: g.departureCity,
          adults: g.adults,
          children: g.children,
          specialNeeds: g.specialNeeds,
        };
      }),
    );
    const userRows: UnifiedBooking[] = await Promise.all(
      usersB.map(async (b) => {
        const tour = await ctx.db.get(b.tourId);
        const user = await ctx.db.get(b.userId);
        return {
          kind: "user" as const,
          id: b._id,
          name: user?.name ?? "User",
          email: user?.email ?? "",
          tourTitle: tour?.title ?? "Unknown",
          peopleCount: b.peopleCount,
          status: b.status,
          totalPrice: b.totalPrice,
          createdAt: b.createdAt,
          preferredStart: b.preferredStart,
          preferredEnd: b.preferredEnd,
          departureCity: b.departureCity,
          adults: b.adults,
          children: b.children,
          specialNeeds: b.specialNeeds,
        };
      }),
    );
    return [...guestRows, ...userRows].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  },
});

export const updateBookingStatus = mutation({
  args: {
    kind: v.union(v.literal("guest"), v.literal("user")),
    id: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, { kind, id, status }) => {
    const admin = await requireAdmin(ctx);
    if (kind === "guest") {
      await ctx.db.patch(id as Id<"guestBookings">, { status });
    } else {
      await ctx.db.patch(id as Id<"bookings">, { status });
    }
    await ctx.db.insert("adminLogs", {
      action: "update_booking_status",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `${kind}:${id}:${status}`,
    });
  },
});
