import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server.js";
import type { Doc, Id } from "./_generated/dataModel.js";
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
      pendingReviews,
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
      // Newest leads, filtered to "new" below (leads has no status index).
      ctx.db.query("leads").order("desc").take(LEAD_SCAN),
      ctx.db
        .query("customItineraryRequests")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .order("desc")
        .take(MAX_ROWS),
      ctx.db
        .query("visaInvitationRequests")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(MAX_ROWS),
      ctx.db
        .query("tourReviews")
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
    const newLeadsRaw = recentLeadsRaw.filter(isNewLead);
    const recentLeads: DashboardLeadRow[] = newLeadsRaw
      .slice(0, 5)
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
        pendingReviews: pendingReviews.length,
        newLeads: newLeadsRaw.length,
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

// ── "Needs your attention" inbox + menu badge counts ───────────────────────

/** Most pending rows read per table. Counts at or above this show as "99+". */
export const INBOX_COUNT_CAP = 100;
/** Recent leads scanned for "new" ones (leads has no status index). */
const LEAD_SCAN = 300;

export type AttentionKind = "booking" | "lead" | "trip" | "visa" | "review";

export type AttentionItem = {
  kind: AttentionKind;
  /** Unique across kinds, for React keys. */
  key: string;
  id: string;
  /** Bookings only: which table the row lives in. */
  bookingKind?: "guest" | "user";
  name: string;
  phone?: string;
  email?: string;
  /** Plain-English "what they asked about". */
  summary: string;
  /** Short subject for the WhatsApp greeting, e.g. "booking request for Skardu". */
  about: string;
  createdAt: number;
  href: string;
};

export type InboxCounts = {
  bookings: number;
  leads: number;
  trips: number;
  visa: number;
  reviews: number;
  total: number;
  cap: number;
};

/** Legacy leads have no status: missing means "new". */
function isNewLead(l: Doc<"leads">) {
  return l.status === undefined || l.status === "new";
}

/** Some lead forms store an email in the `phone` column. */
function splitLeadContact(raw: string): { phone?: string; email?: string } {
  const s = raw.trim();
  if (!s || s === "—") return {};
  if (s.includes("@")) return { email: s };
  return { phone: s };
}

function clip(s: string, max = 140) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

async function loadPendingInbox(ctx: QueryCtx) {
  const cap = INBOX_COUNT_CAP;
  const [guest, member, recentLeads, trips, visa, reviews] = await Promise.all([
    ctx.db
      .query("guestBookings")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(cap),
    ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(cap),
    ctx.db.query("leads").order("desc").take(LEAD_SCAN),
    ctx.db
      .query("customItineraryRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(cap),
    ctx.db
      .query("visaInvitationRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(cap),
    ctx.db
      .query("tourReviews")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(cap),
  ]);
  const leads = recentLeads.filter(isNewLead).slice(0, cap);
  const counts: InboxCounts = {
    bookings: Math.min(cap, guest.length + member.length),
    leads: leads.length,
    trips: trips.length,
    visa: visa.length,
    reviews: reviews.length,
    total: 0,
    cap,
  };
  counts.total =
    counts.bookings + counts.leads + counts.trips + counts.visa + counts.reviews;
  return { guest, member, leads, trips, visa, reviews, counts };
}

/**
 * Cheap counts of new / pending items per inbox, for the red menu badges.
 * Each count is capped at `cap` (the UI shows "99+").
 */
export const getInboxCounts = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }): Promise<InboxCounts> => {
    await requireAdminFromSession(ctx, sessionToken);
    const { counts } = await loadPendingInbox(ctx);
    return counts;
  },
});

/**
 * One combined, newest-first list of everything waiting for a reply: pending
 * bookings, new leads, pending trip requests, visa requests and reviews.
 * Bounded: at most `INBOX_COUNT_CAP` rows per table (leads: a recent scan),
 * and tour / user lookups only for rows that can make the final list.
 */
export const getAttentionInbox = query({
  args: { sessionToken: v.string(), limit: v.optional(v.number()) },
  handler: async (
    ctx,
    { sessionToken, limit },
  ): Promise<{ items: AttentionItem[]; counts: InboxCounts }> => {
    await requireAdminFromSession(ctx, sessionToken);
    const max = Math.max(1, Math.min(60, Math.floor(limit ?? 30)));
    const { guest, member, leads, trips, visa, reviews, counts } =
      await loadPendingInbox(ctx);

    const tourTitle = async (tourId: Id<"tours">, snapshot?: string) => {
      if (snapshot) return snapshot;
      const tour = await ctx.db.get(tourId);
      return tour?.title ?? "a tour";
    };
    const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

    const items: AttentionItem[] = [];
    for (const g of guest.slice(0, max)) {
      const title = await tourTitle(g.tourId, g.tourTitle);
      items.push({
        kind: "booking",
        key: `guest-${g._id}`,
        id: g._id,
        bookingKind: "guest",
        name: g.name,
        phone: g.phone || undefined,
        email: g.email || undefined,
        summary: [title, people(g.peopleCount), g.preferredStart]
          .filter(Boolean)
          .join(" · "),
        about: `booking request for ${title}`,
        createdAt: g.createdAt,
        href: "/admin/bookings",
      });
    }
    for (const b of member.slice(0, max)) {
      const [title, user] = await Promise.all([
        tourTitle(b.tourId, b.tourTitle),
        ctx.db.get(b.userId),
      ]);
      items.push({
        kind: "booking",
        key: `user-${b._id}`,
        id: b._id,
        bookingKind: "user",
        name: user?.name ?? "Customer",
        phone: user?.phone || undefined,
        email: user?.email || undefined,
        summary: [title, people(b.peopleCount), b.preferredStart]
          .filter(Boolean)
          .join(" · "),
        about: `booking request for ${title}`,
        createdAt: b.createdAt,
        href: "/admin/bookings",
      });
    }
    for (const l of leads.slice(0, max)) {
      items.push({
        kind: "lead",
        key: `lead-${l._id}`,
        id: l._id,
        name: l.name,
        ...splitLeadContact(l.phone),
        summary: l.message?.trim() ? clip(l.message) : `Message via ${l.source}`,
        about: "message",
        createdAt: l.createdAt,
        href: "/admin/contact",
      });
    }
    for (const r of trips.slice(0, max)) {
      items.push({
        kind: "trip",
        key: `trip-${r._id}`,
        id: r._id,
        name: r.name,
        phone: r.phone || undefined,
        email: r.email || undefined,
        summary: clip(r.summary),
        about: "custom trip request",
        createdAt: r.createdAt,
        href: "/admin/custom-itineraries",
      });
    }
    for (const r of visa.slice(0, max)) {
      const n = r.travelers.length;
      items.push({
        kind: "visa",
        key: `visa-${r._id}`,
        id: r._id,
        name: r.contactName,
        phone: r.contactPhone || undefined,
        email: r.contactEmail || undefined,
        summary: `Visa invitation letter for ${n} ${n === 1 ? "traveller" : "travellers"}`,
        about: "visa invitation request",
        createdAt: r.createdAt,
        href: "/admin/visa-invitations",
      });
    }
    for (const r of reviews.slice(0, max)) {
      const title = await tourTitle(r.tourId);
      items.push({
        kind: "review",
        key: `review-${r._id}`,
        id: r._id,
        name: r.authorName,
        email: r.authorEmail || undefined,
        summary: `${r.rating}★ review of ${title}${r.title ? ` — “${clip(r.title, 60)}”` : ""}`,
        about: `review of ${title}`,
        createdAt: r.createdAt,
        href: "/admin/reviews",
      });
    }

    items.sort((a, b) => b.createdAt - a.createdAt);
    return { items: items.slice(0, max), counts };
  },
});
