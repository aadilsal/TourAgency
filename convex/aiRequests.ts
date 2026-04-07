import { v } from "convex/values";
import { internalMutation } from "./_generated/server.js";

export const persist = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    input: v.string(),
    output: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiRequests", {
      userId: args.userId,
      input: args.input,
      output: args.output,
      type: args.type,
      createdAt: Date.now(),
    });
  },
});
