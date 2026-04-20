import { v } from "convex/values";
import { query } from "./_generated/server.js";
import { requireAdmin } from "./lib/authHelpers.js";

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

export const getAdminDashboardSnapshot = query({
  args: {
    windowDays: v.optional(v.number()),
    includeAdmins: v.optional(v.boolean()),
  },
  handler: async (ctx, { windowDays, includeAdmins }) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const days = windowDays && Number.isFinite(windowDays) ? windowDays : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    const [
      guestBookings,
      userBookings,
      leads,
      customPlans,
      tours,
      blogPosts,
      users,
    ] = await Promise.all([
      ctx.db.query("guestBookings").collect(),
      ctx.db.query("bookings").collect(),
      ctx.db.query("leads").collect(),
      ctx.db.query("customItineraryRequests").collect(),
      ctx.db.query("tours").collect(),
      ctx.db.query("blogPosts").collect(),
      includeAdmins ? ctx.db.query("users").collect() : Promise.resolve([]),
    ]);

    const tourById = new Map(tours.map((t) => [t._id, t]));

    const inWindow = (createdAt?: number) =>
      typeof createdAt === "number" && createdAt >= cutoff;

    const recentPendingBookings: DashboardBookingRow[] = [];
    let bookings30d = 0;
    let pendingBookings = 0;
    let revenue30d = 0;

    for (const g of guestBookings) {
      const createdAt = g.createdAt;
      if (g.status === "pending") {
        pendingBookings += 1;
        if (recentPendingBookings.length < 5) {
          const tour = tourById.get(g.tourId);
          const price =
            tour && Number.isFinite(tour.price) ? (tour.price as number) : 0;
          recentPendingBookings.push({
            kind: "guest",
            id: g._id,
            name: g.name,
            tourTitle: tour?.title ?? "Unknown",
            peopleCount: g.peopleCount,
            status: g.status,
            totalPrice: price * g.peopleCount,
            createdAt,
          });
        }
      }
      if (inWindow(createdAt)) {
        bookings30d += 1;
        if (g.status === "confirmed") {
          const tour = tourById.get(g.tourId);
          const price =
            tour && Number.isFinite(tour.price) ? (tour.price as number) : 0;
          revenue30d += price * g.peopleCount;
        }
      }
    }

    for (const b of userBookings) {
      const createdAt = b.createdAt;
      if (b.status === "pending") {
        pendingBookings += 1;
        if (recentPendingBookings.length < 5) {
          const tour = tourById.get(b.tourId);
          const user = await ctx.db.get(b.userId);
          recentPendingBookings.push({
            kind: "user",
            id: b._id,
            name: user?.name ?? "User",
            tourTitle: tour?.title ?? "Unknown",
            peopleCount: b.peopleCount,
            status: b.status,
            totalPrice: b.totalPrice,
            createdAt,
          });
        }
      }
      if (inWindow(createdAt)) {
        bookings30d += 1;
        if (b.status === "confirmed") revenue30d += b.totalPrice;
      }
    }

    recentPendingBookings.sort((a, b) => b.createdAt - a.createdAt);

    const leads30d = leads.filter((l) => inWindow(l.createdAt)).length;
    const recentLeads: DashboardLeadRow[] = leads
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((l) => ({
        id: l._id,
        name: l.name,
        phone: l.phone,
        source: l.source,
        message: l.message,
        createdAt: l.createdAt,
      }));

    const pendingCustomPlans = customPlans.filter((r) => r.status === "pending");
    const pendingCustomPlans30d = pendingCustomPlans.filter((r) =>
      inWindow(r.createdAt),
    ).length;
    const recentPendingCustomPlans: DashboardCustomPlanRow[] = pendingCustomPlans
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
      ? (users as any[])
          .filter((u) => u.role === "admin" || u.role === "super_admin")
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

