import { v } from "convex/values";
import { internalMutation } from "./_generated/server.js";

export const insertUser = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    phoneNormalized: v.optional(v.string()),
    passwordHash: v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("customer"),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("users", {
      ...args,
      createdAt: now,
    });
  },
});

export const linkGuestBookingsForUser = internalMutation({
  args: {
    userId: v.id("users"),
    phoneNormalized: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { userId, phoneNormalized, email }) => {
    if (phoneNormalized) {
      const byPhone = await ctx.db
        .query("guestBookings")
        .withIndex("by_phone_normalized", (q) =>
          q.eq("phoneNormalized", phoneNormalized),
        )
        .collect();
      for (const b of byPhone) {
        if (!b.linkedUserId) {
          await ctx.db.patch(b._id, { linkedUserId: userId });
        }
      }
    }
    if (email) {
      const byEmail = await ctx.db
        .query("guestBookings")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect();
      for (const b of byEmail) {
        if (!b.linkedUserId) {
          await ctx.db.patch(b._id, { linkedUserId: userId });
        }
      }
    }
  },
});
