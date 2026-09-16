import { v } from "convex/values";
import { query } from "./_generated/server.js";
import { requireAdminFromSession } from "./lib/authHelpers.js";

type DashboardBookingRow = {
  kind: "guest" | "user";
  id: string;
  name: string;
  tourTitle: string;
  peopleCount: number;
  status: "pending" | "confirmed" | "cancelled";
  totalPrice: number;
  createdAt: number;
};

type DashboardLeadRow = {
  id: string;
  name: string;
  phone: string;
  source: string;
  message?: string;
  createdAt: number;
};

type DashboardCustomPlanRow = {
  id: string;
  name: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
  summary: string;
  createdAt: number;
};

type DashboardAdminRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: number;
};

/**
 * Safety cap for any single indexed read. The dashboard used to `.collect()`
 * eight whole tables, which fails the entire page once the data outgrows
 * Convex's per-query read limits. Every read below is now either indexed to
 * the rows it needs (pending / in-window) or bounded.
 */
const MAX_ROWS = 4000;

export const getAdminDashboardSnapshot = query({
  args: {
    sessionToken: v.string(),
    windowDays: v.optional(v.number()),
    includeAdmins: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionToken, windowDays, includeAdmins }) => {
    await requireAdminFromSession(ctx, sessionToken);

    const now = Date.now();
    const days = windowDays && Number.isFinite(windowDays) ? windowDays : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    const [
      pendingGuest,
      pendingUser,
      windowGuest,
      windowUser,
      windowLeads,
      recentLeadsRaw,
      pendingPlans,
      pendingVisa,
      tours,
      blogPosts,
      adminUsers,
      superAdminUsers,
    ] = await Promise.all([
      ctx.db
        .query("guestBookings")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .order("desc")
        .take(MAX_ROWS),
      ctx.db
        .query("bookings")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .order("desc")
        .take(MAX_ROWS),
      ctx.db
        .query("guestBookings")
        .withIndex("by_creation_time", (q) => q.gte("_creationTime", cutoff))
        .take(MAX_ROWS),
      ctx.db
        .query("bookings")
        .withIndex("by_creation_time", (q) => q.gte("_creationTime", cutoff))
        .take(MAX_ROWS),
      ctx.db
        .query("leads")
        .withIndex("by_creation_time", (q) => q.gte("_creationTime", cutoff))
        .take(MAX_ROWS),
      ctx.db.query("leads").order("desc").take(5),
      ctx.db
        .query("customItineraryRequests")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .order("desc")
        .take(MAX_ROWS),
      ctx.db
        .query("visaInvitationRequests")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(MAX_ROWS),
      ctx.db.query("tours").take(MAX_ROWS),
      ctx.db.query("blogPosts").take(MAX_ROWS),
      includeAdmins
        ? ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .take(200)
        : Promise.resolve([]),
      includeAdmins
        ? ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "super_admin"))
            .take(50)
        : Promise.resolve([]),
    ]);

    const tourById = new Map(tours.map((t) => [t._id, t]));

    const inWindow = (createdAt?: number) =>
      typeof createdAt === "number" && createdAt >= cutoff;

    // PKR estimate from the tour's legacy PKR price (unchanged semantics).
    const guestUnitPrice = (g: (typeof windowGuest)[number]) => {
      const tour = tourById.get(g.tourId);
      return tour && Number.isFinite(tour.price) ? (tour.price as number) : 0;
    };

    const pendingBookings = pendingGuest.length + pendingUser.length;

    const recentPendingBookings: DashboardBookingRow[] = [];
    for (const g of pendingGuest.slice(0, 5)) {
      const tour = tourById.get(g.tourId);
      recentPendingBookings.push({
        kind: "guest",
        id: g._id,
        name: g.name,
        tourTitle: g.tourTitle ?? tour?.title ?? "Deleted tour",
        peopleCount: g.peopleCount,
        status: g.status,
        totalPrice: guestUnitPrice(g) * g.peopleCount,
        createdAt: g.createdAt,
      });
    }
    for (const b of pendingUser.slice(0, 5)) {
      const tour = tourById.get(b.tourId);
      const user = await ctx.db.get(b.userId);
      recentPendingBookings.push({
        kind: "user",
        id: b._id,
        name: user?.name ?? "User",
        tourTitle: b.tourTitle ?? tour?.title ?? "Deleted tour",
        peopleCount: b.peopleCount,
        status: b.status,
        totalPrice: b.totalPrice,
        createdAt: b.createdAt,
      });
    }
    recentPendingBookings.sort((a, b) => b.createdAt - a.createdAt);
    recentPendingBookings.splice(5);

    let bookings30d = 0;
    let revenue30d = 0;
    for (const g of windowGuest) {
      if (!inWindow(g.createdAt)) continue;
      bookings30d += 1;
      if (g.status === "confirmed") revenue30d += guestUnitPrice(g) * g.peopleCount;
    }
    for (const b of windowUser) {
      if (!inWindow(b.createdAt)) continue;
      bookings30d += 1;
      if (b.status === "confirmed") revenue30d += b.totalPrice;
    }

    const leads30d = windowLeads.filter((l) => inWindow(l.createdAt)).length;
    const recentLeads: DashboardLeadRow[] = recentLeadsRaw
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((l) => ({
        id: l._id,
        name: l.name,
        phone: l.phone,
        source: l.source,
        message: l.message,
        createdAt: l.createdAt,
      }));

    const pendingCustomPlans30d = pendingPlans.filter((r) =>
      inWindow(r.createdAt),
    ).length;
    const recentPendingCustomPlans: DashboardCustomPlanRow[] = pendingPlans
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((r) => ({
        id: r._id,
        name: r.name,
        phone: r.phone,
        status: r.status,
        summary: r.summary,
        createdAt: r.createdAt,
      }));

    const activeTours = tours.filter((t) => t.isActive).length;
    const inactiveTours = tours.length - activeTours;

    const publishedPosts = blogPosts.filter((p) => p.published).length;
    const draftPosts = blogPosts.length - publishedPosts;

    const admins: DashboardAdminRow[] = includeAdmins
      ? [...superAdminUsers, ...adminUsers]
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
          .slice(0, 8)
          .map((u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
          }))
      : [];

    return {
      windowDays: days,
      windowLabel: `Last ${days} days`,
      kpis: {
        bookings: bookings30d,
        leads: leads30d,
        revenuePkr: revenue30d,
        pendingBookings,
        pendingCustomPlans: pendingCustomPlans30d,
        pendingVisaInvitations: pendingVisa.length,
      },
      recent: {
        pendingBookings: recentPendingBookings,
        leads: recentLeads,
        pendingCustomPlans: recentPendingCustomPlans,
      },
      health: {
        tours: { active: activeTours, inactive: inactiveTours },
        blog: { published: publishedPosts, drafts: draftPosts },
      },
      admins,
    };
  },
});
