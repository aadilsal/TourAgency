import { query } from "./_generated/server.js";
import { requireAdmin } from "./lib/authHelpers.js";

export const getAnalyticsSnapshot = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [
      guestBookings,
      userBookings,
      leads,
      aiRequests,
      tours,
      users,
    ] = await Promise.all([
      ctx.db.query("guestBookings").collect(),
      ctx.db.query("bookings").collect(),
      ctx.db.query("leads").collect(),
      ctx.db.query("aiRequests").collect(),
      ctx.db.query("tours").collect(),
      ctx.db.query("users").collect(),
    ]);
    const pendingGuests = guestBookings.filter((b) => b.status === "pending")
      .length;
    const pendingUser = userBookings.filter((b) => b.status === "pending")
      .length;

    const tourById = new Map(tours.map((t) => [t._id, t]));
    let revenuePkr = 0;
    for (const b of userBookings) {
      if (b.status === "confirmed") revenuePkr += b.totalPrice;
    }
    for (const g of guestBookings) {
      if (g.status !== "confirmed") continue;
      const t = tourById.get(g.tourId);
      if (t) revenuePkr += t.price * g.peopleCount;
    }

    const totalBookings = guestBookings.length + userBookings.length;

    return {
      headline: {
        totalBookings,
        leads: leads.length,
        revenuePkr,
      },
      counts: {
        guestBookings: guestBookings.length,
        userBookings: userBookings.length,
        leads: leads.length,
        aiRequests: aiRequests.length,
        tours: tours.length,
        users: users.length,
      },
      pending: {
        guestBookings: pendingGuests,
        userBookings: pendingUser,
      },
    };
  },
});
