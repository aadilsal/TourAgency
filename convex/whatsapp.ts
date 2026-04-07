import { v } from "convex/values";
import { query } from "./_generated/server.js";

/** Phase 2: click-to-chat. Phase 3: replace with API-driven automation. */
export const getWhatsAppClickLink = query({
  args: { presetMessage: v.optional(v.string()) },
  handler: async (ctx, { presetMessage }) => {
    const settings = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    const raw =
      settings?.whatsappPhone?.trim() ||
      process.env.WHATSAPP_BUSINESS_NUMBER?.trim() ||
      process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() ||
      "+923209973486";
    const digits = raw.replace(/\D/g, "");
    if (!digits) return null;
    const text = encodeURIComponent(
      presetMessage ?? "Hi JunketTours — I have a question about a tour.",
    );
    return `https://wa.me/${digits}?text=${text}`;
  },
});
