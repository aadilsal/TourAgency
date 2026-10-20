import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server.js";
import type { Doc } from "./_generated/dataModel.js";
import {
  requireAdminFromSession,
  requireSuperAdminFromSession,
} from "./lib/authHelpers.js";

const roleValidator = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("customer"),
);

/** Public shape of a user row for admin screens (never includes passwordHash). */
function toUserRow(u: Doc<"users">) {
  return {
    _id: u._id,
    _creationTime: u._creationTime,
    name: u.name,
    email: u.email,
    phone: u.phone,
    phoneNormalized: u.phoneNormalized,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
  };
}

/**
 * @deprecated Use `listUsersPage` / `searchUsers`. Kept for the deployed
 * frontend; bounded to the newest 2000 users so it can't hit read limits.
 */
export const getUsers = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const rows = await ctx.db.query("users").order("desc").take(2000);
    return rows.map(toUserRow);
  },
});

/** Paginated users, newest first, optionally filtered by role. */
export const listUsersPage = query({
  args: {
    sessionToken: v.string(),
    paginationOpts: paginationOptsValidator,
    role: v.optional(roleValidator),
  },
  handler: async (ctx, { sessionToken, paginationOpts, role }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const q = role
      ? ctx.db
          .query("users")
          .withIndex("by_role", (i) => i.eq("role", role))
          .order("desc")
      : ctx.db.query("users").order("desc");
    const result = await q.paginate(paginationOpts);
    return { ...result, page: result.page.map(toUserRow) };
  },
});

/** Find users by exact email or by name (full-text), across the whole table. */
export const searchUsers = query({
  args: { sessionToken: v.string(), term: v.string() },
  handler: async (ctx, { sessionToken, term }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const t = term.trim();
    if (!t) return [];
    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (i) => i.eq("email", t.toLowerCase()))
      .take(1);
    const byName = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (s) => s.search("name", t))
      .take(25);
    const seen = new Set<string>();
    return [...byEmail, ...byName]
      .filter((u) => (seen.has(u._id) ? false : (seen.add(u._id), true)))
      .map(toUserRow);
  },
});

/** All admins and super admins (indexed by role). */
export const getAdmins = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const [supers, admins] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_role", (i) => i.eq("role", "super_admin"))
        .take(200),
      ctx.db
        .query("users")
        .withIndex("by_role", (i) => i.eq("role", "admin"))
        .take(500),
    ]);
    return [...supers, ...admins].map(toUserRow);
  },
});

export const promoteUser = mutation({
  args: { sessionToken: v.string(), userId: v.id("users") },
  handler: async (ctx, { sessionToken, userId }) => {
    const admin = await requireSuperAdminFromSession(ctx, sessionToken);
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("User not found");
    if (target.role === "super_admin") throw new Error("Cannot change super admin");
    await ctx.db.patch(userId, { role: "admin" });
    await ctx.db.insert("adminLogs", {
      action: "promote_user",
      performedBy: admin._id,
      targetUser: userId,
      timestamp: Date.now(),
      details: "Promoted to admin",
    });
  },
});

export const demoteAdmin = mutation({
  args: { sessionToken: v.string(), userId: v.id("users") },
  handler: async (ctx, { sessionToken, userId }) => {
    const admin = await requireSuperAdminFromSession(ctx, sessionToken);
    if (admin._id === userId) throw new Error("Cannot demote yourself");
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("User not found");
    if (target.role === "super_admin") throw new Error("Cannot demote super admin");
    await ctx.db.patch(userId, { role: "customer" });
    await ctx.db.insert("adminLogs", {
      action: "demote_admin",
      performedBy: admin._id,
      targetUser: userId,
      timestamp: Date.now(),
      details: "Demoted to customer",
    });
  },
});

// ── Customer search (admin top bar) ───────────────────────────────────────

export type CustomerSearchKind =
  | "booking"
  | "lead"
  | "trip"
  | "visa"
  | "itinerary"
  | "invoice";

export type CustomerSearchResult = {
  kind: CustomerSearchKind;
  key: string;
  id: string;
  name: string;
  /** What the record is about, in plain words. */
  detail: string;
  phone?: string;
  email?: string;
  createdAt: number;
  href: string;
};

/** Recent rows scanned per table. Bounded so search can never hit read limits. */
const SEARCH_SCAN = 300;
/** Trip requests carry AI transcripts and itineraries day plans (big rows). */
const SEARCH_SCAN_LARGE = 120;
const PER_KIND = 8;

/** Digits in one canonical form: "0300…" and "0092 300…" both become "92300…". */
function canonicalPhone(s: string | undefined | null) {
  const d = (s ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) return d.slice(2);
  if (d.startsWith("0")) return `92${d.slice(1)}`;
  return d;
}

/**
 * Case-insensitive substring match on names / emails, and digit match on
 * phone numbers ("0300 1234567", "+92 300-1234567" and "3001234567" all find
 * the same customer).
 */
function makeCustomerMatcher(term: string) {
  const text = term.trim().toLowerCase();
  const digits = canonicalPhone(term);
  return (
    texts: (string | undefined | null)[],
    phones: (string | undefined | null)[],
  ): boolean => {
    if (text.length >= 2 && texts.some((t) => t && t.toLowerCase().includes(text))) {
      return true;
    }
    if (digits.length >= 4 && phones.some((p) => canonicalPhone(p).includes(digits))) {
      return true;
    }
    return false;
  };
}

/** Newest first, de-duplicated by key, capped per type. */
function topRows(rows: CustomerSearchResult[]): CustomerSearchResult[] {
  const seen = new Set<string>();
  const unique = rows.filter((r) => (seen.has(r.key) ? false : (seen.add(r.key), true)));
  unique.sort((a, b) => b.createdAt - a.createdAt);
  return unique.slice(0, PER_KIND);
}

/**
 * Find a customer by name, phone or email across bookings (guest + member),
 * leads, trip requests, visa requests, itineraries and invoices. Scans the
 * newest rows of each table (bounded) plus the itinerary / invoice name search
 * indexes; at most 8 results per type, newest first.
 */
export const searchCustomers = query({
  args: { sessionToken: v.string(), term: v.string() },
  handler: async (ctx, { sessionToken, term }): Promise<CustomerSearchResult[]> => {
    await requireAdminFromSession(ctx, sessionToken);
    const t = term.trim().slice(0, 100);
    if (t.length < 2) return [];
    const matches = makeCustomerMatcher(t);
    const hasLetters = /[a-z]/i.test(t);

    const [guests, members, leads, trips, visas, itinScan, invScan, itinByName, invByName] =
      await Promise.all([
        ctx.db.query("guestBookings").order("desc").take(SEARCH_SCAN),
        ctx.db.query("bookings").order("desc").take(SEARCH_SCAN),
        ctx.db.query("leads").order("desc").take(SEARCH_SCAN),
        ctx.db.query("customItineraryRequests").order("desc").take(SEARCH_SCAN_LARGE),
        ctx.db.query("visaInvitationRequests").order("desc").take(SEARCH_SCAN),
        ctx.db.query("itineraries").order("desc").take(SEARCH_SCAN_LARGE),
        ctx.db.query("invoices").order("desc").take(SEARCH_SCAN),
        hasLetters
          ? ctx.db
              .query("itineraries")
              .withSearchIndex("search_client", (s) => s.search("clientName", t))
              .take(PER_KIND)
          : Promise.resolve([]),
        hasLetters
          ? ctx.db
              .query("invoices")
              .withSearchIndex("search_client", (s) => s.search("clientName", t))
              .take(PER_KIND)
          : Promise.resolve([]),
      ]);

    const out: CustomerSearchResult[] = [];

    // Bookings: guest requests carry contact details; member bookings use the account.
    const bookingRows: CustomerSearchResult[] = [];
    for (const g of guests) {
      if (!matches([g.name, g.email, g.phone], [g.phone])) continue;
      bookingRows.push({
        kind: "booking",
        key: `guest-${g._id}`,
        id: g._id,
        name: g.name,
        detail: `${g.tourTitle ?? "Tour booking"} · ${g.status}`,
        phone: g.phone || undefined,
        email: g.email || undefined,
        createdAt: g.createdAt,
        href: "/admin/bookings?status=all",
      });
    }
    const userIds = Array.from(new Set(members.map((b) => b.userId)));
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userById = new Map<string, Doc<"users">>();
    for (const u of users) if (u) userById.set(u._id, u);
    for (const b of members) {
      const u = userById.get(b.userId);
      if (!u || !matches([u.name, u.email, u.phone], [u.phone])) continue;
      bookingRows.push({
        kind: "booking",
        key: `user-${b._id}`,
        id: b._id,
        name: u.name,
        detail: `${b.tourTitle ?? "Tour booking"} · ${b.status}`,
        phone: u.phone || undefined,
        email: u.email || undefined,
        createdAt: b.createdAt,
        href: "/admin/bookings?status=all",
      });
    }
    out.push(...topRows(bookingRows));

    out.push(
      ...topRows(
        leads
          .filter((l) => matches([l.name, l.phone], [l.phone]))
          .map((l) => {
            const contact = l.phone?.trim() ?? "";
            const isEmail = contact.includes("@");
            const msg = l.message?.trim();
            return {
              kind: "lead" as const,
              key: `lead-${l._id}`,
              id: l._id,
              name: l.name,
              detail: msg ? msg.slice(0, 80) : `Message via ${l.source}`,
              phone: !isEmail && contact && contact !== "—" ? contact : undefined,
              email: isEmail ? contact : undefined,
              createdAt: l.createdAt,
              href: "/admin/contact?status=all",
            };
          }),
      ),
    );

    out.push(
      ...topRows(
        trips
          .filter((r) => matches([r.name, r.email, r.phone], [r.phone]))
          .map((r) => ({
            kind: "trip" as const,
            key: `trip-${r._id}`,
            id: r._id,
            name: r.name,
            detail: r.summary.slice(0, 80),
            phone: r.phone || undefined,
            email: r.email || undefined,
            createdAt: r.createdAt,
            href: "/admin/custom-itineraries?status=all",
          })),
      ),
    );

    out.push(
      ...topRows(
        visas
          .filter((r) =>
            matches(
              [r.contactName, r.contactEmail, ...r.travelers.map((x) => x.name)],
              [r.contactPhone],
            ),
          )
          .map((r) => ({
            kind: "visa" as const,
            key: `visa-${r._id}`,
            id: r._id,
            name: r.contactName,
            detail: `Visa letter for ${r.travelers.length} traveller(s) · ${r.status === "processed" ? "invitation sent" : r.status}`,
            phone: r.contactPhone || undefined,
            email: r.contactEmail || undefined,
            createdAt: r.createdAt,
            href: "/admin/visa-invitations?status=all",
          })),
      ),
    );

    // Newer itineraries may carry client contact fields; read them loosely.
    type ItinContact = { clientPhone?: string; clientEmail?: string };
    out.push(
      ...topRows(
        [...itinByName, ...itinScan]
          .filter((i) => {
            const c = i as typeof i & ItinContact;
            return matches([i.clientName, i.title, c.clientEmail], [c.clientPhone]);
          })
          .map((i) => {
            const c = i as typeof i & ItinContact;
            return {
              kind: "itinerary" as const,
              key: `itinerary-${i._id}`,
              id: i._id,
              name: i.clientName || i.title,
              detail: i.title,
              phone: c.clientPhone || undefined,
              email: c.clientEmail || undefined,
              createdAt: i.createdAt,
              href: `/admin/itineraries/${i._id}`,
            };
          }),
      ),
    );

    out.push(
      ...topRows(
        [...invByName, ...invScan]
          .filter((i) => matches([i.clientName, i.invoiceNumber], []))
          .map((i) => ({
            kind: "invoice" as const,
            key: `invoice-${i._id}`,
            id: i._id,
            name: i.clientName,
            detail: `${i.invoiceNumber ?? "Invoice"} · ${i.status}`,
            createdAt: i.createdAt,
            href: `/admin/invoices/${i._id}`,
          })),
      ),
    );

    return out;
  },
});
