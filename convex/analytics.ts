import { v } from "convex/values";
import { query } from "./_generated/server.js";
import type { QueryCtx } from "./_generated/server.js";
import type { Doc, TableNames } from "./_generated/dataModel.js";
import { requireAdminFromSession } from "./lib/authHelpers.js";

/**
 * Upper bound on rows read per metric. Convex has no count operator, so this
 * snapshot counts up to a cap and reports `capped` instead of reading whole
 * tables (which fails once tables grow past transaction read limits).
 * If the business outgrows these caps, move to @convex-dev/aggregate counters.
 */
const COUNT_CAP = 5000;
/** AI request rows carry large prompt/response text — keep this bound small. */
const AI_COUNT_CAP = 1000;

type Counted = { count: number; capped: boolean };

async function countUpTo(iter: AsyncIterable<unknown>, cap: number): Promise<Counted> {
  let count = 0;
  const it = iter[Symbol.asyncIterator]();
  while (!(await it.next()).done) {
    count++;
    if (count >= cap) return { count, capped: true };
  }
  return { count, capped: false };
}

function countTable(ctx: QueryCtx, table: TableNames, cap = COUNT_CAP) {
  return countUpTo(ctx.db.query(table), cap);
}

export const getAnalyticsSnapshot = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken);

    const [
      guestBookings,
      userBookings,
      leads,
      aiRequests,
      tours,
      users,
      pendingGuests,
      pendingUser,
      confirmedGuests,
      confirmedUser,
    ] = await Promise.all([
      countTable(ctx, "guestBookings"),
      countTable(ctx, "bookings"),
      countTable(ctx, "leads"),
      countTable(ctx, "aiRequests", AI_COUNT_CAP),
      countTable(ctx, "tours"),
      countTable(ctx, "users"),
      countUpTo(
        ctx.db.query("guestBookings").withIndex("by_status", (q) => q.eq("status", "pending")),
        COUNT_CAP,
      ),
      countUpTo(
        ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "pending")),
        COUNT_CAP,
      ),
      ctx.db
        .query("guestBookings")
        .withIndex("by_status", (q) => q.eq("status", "confirmed"))
        .take(COUNT_CAP),
      ctx.db
        .query("bookings")
        .withIndex("by_status", (q) => q.eq("status", "confirmed"))
        .take(COUNT_CAP),
    ]);

    let revenuePkr = 0;
    for (const b of confirmedUser) revenuePkr += b.totalPrice;

    const tourCache = new Map<string, Doc<"tours"> | null>();
    for (const g of confirmedGuests) {
      if (!tourCache.has(g.tourId)) tourCache.set(g.tourId, await ctx.db.get(g.tourId));
      const t = tourCache.get(g.tourId);
      if (t) revenuePkr += (t.pricePkr ?? t.price ?? 0) * g.peopleCount;
    }

    return {
      headline: {
        totalBookings: guestBookings.count + userBookings.count,
        leads: leads.count,
        revenuePkr,
      },
      counts: {
        guestBookings: guestBookings.count,
        userBookings: userBookings.count,
        leads: leads.count,
        aiRequests: aiRequests.count,
        tours: tours.count,
        users: users.count,
      },
      pending: {
        guestBookings: pendingGuests.count,
        userBookings: pendingUser.count,
      },
      /** true = the real number is at least this value (count stopped at the cap). */
      capped: {
        guestBookings: guestBookings.capped,
        userBookings: userBookings.capped,
        leads: leads.capped,
        aiRequests: aiRequests.capped,
        tours: tours.capped,
        users: users.capped,
        revenue: confirmedGuests.length >= COUNT_CAP || confirmedUser.length >= COUNT_CAP,
      },
    };
  },
});
