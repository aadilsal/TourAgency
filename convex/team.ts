import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import type { Id } from "./_generated/dataModel.js";
import { requireUserFromSession } from "./lib/authHelpers.js";

function assertAdminFromSession(
  user: { role: string },
): asserts user is { role: "admin" | "super_admin" } {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
}

export const generateTeamMemberImageUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    return await ctx.storage.generateUploadUrl();
  },
});

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("teamMembers")
      .withIndex("by_active_and_sort_order", (q) => q.eq("isActive", true))
      .order("asc")
      .take(60);

    const out: Array<{
      _id: Id<"teamMembers">;
      name: string;
      role: string;
      imageUrl: string | null;
    }> = [];

    for (const r of rows) {
      out.push({
        _id: r._id,
        name: r.name,
        role: r.role,
        imageUrl: r.imageStorageId ? await ctx.storage.getUrl(r.imageStorageId) : null,
      });
    }
    return out;
  },
});

export const listForAdmin = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    return await ctx.db
      .query("teamMembers")
      .withIndex("by_sort_order", (q) => q)
      .order("asc")
      .take(200);
  },
});

export const resolveTeamMemberImageUrlsForAdmin = query({
  args: { sessionToken: v.string(), ids: v.array(v.id("teamMembers")) },
  handler: async (ctx, { sessionToken, ids }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const urls: (string | null)[] = [];
    for (const id of ids) {
      const row = await ctx.db.get(id);
      if (!row?.imageStorageId) {
        urls.push(null);
      } else {
        urls.push(await ctx.storage.getUrl(row.imageStorageId));
      }
    }
    return urls;
  },
});

export const create = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    role: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionToken, name, role, imageStorageId, isActive }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const n = name.trim();
    const r = role.trim();
    if (!n) throw new Error("Name is required");
    if (!r) throw new Error("Role is required");

    const last = await ctx.db
      .query("teamMembers")
      .withIndex("by_sort_order", (q) => q)
      .order("desc")
      .take(1);
    const nextOrder = (last[0]?.sortOrder ?? 0) + 10;
    const now = Date.now();

    return await ctx.db.insert("teamMembers", {
      name: n,
      role: r,
      imageStorageId,
      sortOrder: nextOrder,
      isActive: isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("teamMembers"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionToken, id, name, role, imageStorageId, isActive }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const patch: {
      name?: string;
      role?: string;
      imageStorageId?: Id<"_storage"> | undefined;
      isActive?: boolean;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (name !== undefined) {
      const n = name.trim();
      if (!n) throw new Error("Name is required");
      patch.name = n;
    }
    if (role !== undefined) {
      const r = role.trim();
      if (!r) throw new Error("Role is required");
      patch.role = r;
    }
    if (imageStorageId !== undefined) {
      patch.imageStorageId = imageStorageId === null ? undefined : imageStorageId;
    }
    if (isActive !== undefined) patch.isActive = isActive;

    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), id: v.id("teamMembers") },
  handler: async (ctx, { sessionToken, id }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    await ctx.db.delete(id);
  },
});

export const move = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("teamMembers"),
    direction: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, { sessionToken, id, direction }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const rows = await ctx.db
      .query("teamMembers")
      .withIndex("by_sort_order", (q) => q)
      .order("asc")
      .take(200);

    const idx = rows.findIndex((r) => r._id === id);
    if (idx < 0) throw new Error("Not found");

    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= rows.length) return;

    const a = rows[idx]!;
    const b = rows[swapWith]!;
    const now = Date.now();
    await ctx.db.patch(a._id, { sortOrder: b.sortOrder, updatedAt: now });
    await ctx.db.patch(b._id, { sortOrder: a.sortOrder, updatedAt: now });
  },
});

export const bulkUpsert = mutation({
  args: {
    sessionToken: v.string(),
    rows: v.array(
      v.object({
        id: v.optional(v.id("teamMembers")),
        name: v.string(),
        role: v.string(),
        imageStorageId: v.optional(v.id("_storage")),
        isActive: v.optional(v.boolean()),
        sortOrder: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, { sessionToken, rows }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const now = Date.now();
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_sort_order", (q) => q)
      .order("asc")
      .take(200);

    const keyToId = new Map<string, Id<"teamMembers">>();
    for (const r of existing) {
      keyToId.set(`${r.name}::${r.role}`.toLowerCase(), r._id);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ index: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      try {
        const name = row.name.trim();
        const role = row.role.trim();
        if (!name) throw new Error("name is required");
        if (!role) throw new Error("role is required");

        const key = `${name}::${role}`.toLowerCase();
        const targetId = row.id ?? keyToId.get(key);

        const patch: Record<string, unknown> = {
          name,
          role,
          updatedAt: now + i,
        };
        if (row.imageStorageId !== undefined) patch.imageStorageId = row.imageStorageId;
        if (row.isActive !== undefined) patch.isActive = row.isActive;
        if (row.sortOrder !== undefined) patch.sortOrder = row.sortOrder;

        if (targetId) {
          await ctx.db.patch(targetId, patch);
          updated++;
        } else {
          const last = await ctx.db
            .query("teamMembers")
            .withIndex("by_sort_order", (q) => q)
            .order("desc")
            .take(1);
          const nextOrder = (last[0]?.sortOrder ?? 0) + 10;
          await ctx.db.insert("teamMembers", {
            name,
            role,
            imageStorageId: row.imageStorageId,
            sortOrder: row.sortOrder ?? nextOrder,
            isActive: row.isActive ?? true,
            createdAt: now + i,
            updatedAt: now + i,
          });
          created++;
        }
      } catch (e) {
        errors.push({ index: i, message: e instanceof Error ? e.message : String(e) });
        skipped++;
      }
    }

    return { processed: rows.length, created, updated, skipped, errors };
  },
});

