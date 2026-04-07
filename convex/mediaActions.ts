"use node";

import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import type { Id } from "./_generated/dataModel.js";

const MAX_BYTES = 12 * 1024 * 1024;

export const ingestImageFromUrl = action({
  args: { sessionToken: v.string(), url: v.string() },
  handler: async (ctx, { sessionToken, url }): Promise<Id<"_storage">> => {
    const ok = await ctx.runQuery(internal.auth.isAdminSession, {
      sessionToken,
    });
    if (!ok) throw new Error("Unauthorized");

    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) {
      throw new Error("Only http(s) image URLs can be ingested");
    }

    const res = await fetch(u, {
      redirect: "follow",
      headers: { Accept: "image/*,*/*" },
    });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);

    const len = res.headers.get("content-length");
    if (len && Number(len) > MAX_BYTES) {
      throw new Error("Image too large (max 12MB)");
    }

    const ct = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (ct && !ct.startsWith("image/")) {
      throw new Error("URL does not point to an image");
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error("Image too large (max 12MB)");

    const blob = new Blob([buf], { type: ct || "image/jpeg" });
    return await ctx.storage.store(blob);
  },
});
