import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { requireUserFromSession } from "./lib/authHelpers.js";

function assertAdminFromSession(
  user: { role: string },
): asserts user is { role: "admin" | "super_admin" } {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
}

const invoiceItemValidator = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  quantity: v.number(),
  price: v.number(),
});

function pad4(n: number) {
  return String(n).padStart(4, "0");
}

function fiscalYearKeyFromMs(ms: number) {
  // Keep consistent with the sample format: INV/24-25/0002
  const d = new Date(ms);
  const yy = d.getUTCFullYear() % 100;
  const next = (yy + 1) % 100;
  return `${String(yy).padStart(2, "0")}-${String(next).padStart(2, "0")}`;
}

async function issueInvoiceNumber(ctx: { db: any }, nowMs: number) {
  const fiscalYearKey = fiscalYearKeyFromMs(nowMs);
  const existing = await ctx.db
    .query("invoiceCounters")
    .withIndex("by_fiscal_year", (q: any) => q.eq("fiscalYearKey", fiscalYearKey))
    .unique();

  const now = Date.now();
  if (!existing) {
    // First invoice in this fiscal year: issue 0001, store nextSeq=2
    await ctx.db.insert("invoiceCounters", {
      fiscalYearKey,
      nextSeq: 2,
      updatedAt: now,
    });
    return `INV/${fiscalYearKey}/${pad4(1)}`;
  }

  const seq = Math.max(1, Number(existing.nextSeq || 1));
  await ctx.db.patch(existing._id, { nextSeq: seq + 1, updatedAt: now });
  return `INV/${fiscalYearKey}/${pad4(seq)}`;
}

export const createDraft = mutation({
  args: {
    sessionToken: v.string(),
    clientName: v.string(),
    itineraryId: v.optional(v.id("itineraries")),
    invoiceDate: v.string(),
    currency: v.union(v.literal("PKR"), v.literal("USD")),
    advanceAmount: v.optional(v.number()),
    tripSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSession(ctx, args.sessionToken);
    assertAdminFromSession(user);

    const now = Date.now();
    const invoiceNumber = await issueInvoiceNumber(ctx, now);
    const id = await ctx.db.insert("invoices", {
      invoiceNumber,
      clientName: args.clientName.trim(),
      itineraryId: args.itineraryId,
      invoiceDate: args.invoiceDate.trim(),
      currency: args.currency,
      status: "draft",
      items: [],
      discount: 0,
      tax: 0,
      advanceAmount: typeof args.advanceAmount === "number" ? Math.max(0, args.advanceAmount) : 0,
      tripSummary: args.tripSummary?.trim() || "",
      paymentMethod: "bank",
      paymentDetails: "",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("adminLogs", {
      action: "invoice_create_draft",
      performedBy: user._id,
      timestamp: now,
      details: `${id}`,
    });

    return id;
  },
});

export const patchDraft = mutation({
  args: {
    sessionToken: v.string(),
    invoiceId: v.id("invoices"),

    clientName: v.optional(v.string()),
    itineraryId: v.optional(v.id("itineraries")),
    invoiceDate: v.optional(v.string()),
    currency: v.optional(v.union(v.literal("PKR"), v.literal("USD"))),

    items: v.optional(v.array(invoiceItemValidator)),
    discount: v.optional(v.number()),
    tax: v.optional(v.number()),
    advanceAmount: v.optional(v.number()),
    tripSummary: v.optional(v.string()),

    paymentMethod: v.optional(
      v.union(v.literal("bank"), v.literal("easypaisa"), v.literal("jazzcash")),
    ),
    paymentDetails: v.optional(v.string()),

    terms: v.optional(v.string()),
    cancellationPolicy: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, invoiceId, ...patch }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const existing = await ctx.db.get(invoiceId);
    if (!existing) throw new Error("Invoice not found");

    const next: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val === undefined) continue;
      if (k === "advanceAmount" && typeof val === "number") {
        next[k] = Math.max(0, val);
        continue;
      }
      if (
        (k === "invoiceDate" ||
          k === "clientName" ||
          k === "paymentDetails" ||
          k === "tripSummary" ||
          k === "terms" ||
          k === "cancellationPolicy") &&
        typeof val === "string"
      ) {
        next[k] = val.trim();
        continue;
      }
      next[k] = val;
    }
    next.updatedAt = Date.now();

    await ctx.db.patch(invoiceId, next);
    await ctx.db.insert("adminLogs", {
      action: "invoice_patch",
      performedBy: user._id,
      timestamp: Date.now(),
      details: `${invoiceId}`,
    });
  },
});

export const listForAdmin = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(v.literal("draft"), v.literal("paid"))),
  },
  handler: async (ctx, { sessionToken, status }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const all = await ctx.db.query("invoices").collect();
    const filtered = status ? all.filter((i) => i.status === status) : all;
    return filtered
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((i) => ({
        _id: i._id,
        clientName: i.clientName,
        itineraryId: i.itineraryId,
        invoiceDate: i.invoiceDate,
        currency: i.currency,
        status: i.status,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      }));
  },
});

export const getForAdmin = query({
  args: { sessionToken: v.string(), invoiceId: v.id("invoices") },
  handler: async (ctx, { sessionToken, invoiceId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    return await ctx.db.get(invoiceId);
  },
});

export const markPaid = mutation({
  args: { sessionToken: v.string(), invoiceId: v.id("invoices") },
  handler: async (ctx, { sessionToken, invoiceId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const row = await ctx.db.get(invoiceId);
    if (!row) throw new Error("Invoice not found");
    if (row.status === "paid") return;
    const now = Date.now();
    await ctx.db.patch(invoiceId, { status: "paid", updatedAt: now });
    await ctx.db.insert("adminLogs", {
      action: "invoice_mark_paid",
      performedBy: user._id,
      timestamp: now,
      details: `${invoiceId}`,
    });
  },
});

export const markDraft = mutation({
  args: { sessionToken: v.string(), invoiceId: v.id("invoices") },
  handler: async (ctx, { sessionToken, invoiceId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const row = await ctx.db.get(invoiceId);
    if (!row) throw new Error("Invoice not found");
    if (row.status === "draft") return;
    const now = Date.now();
    await ctx.db.patch(invoiceId, { status: "draft", updatedAt: now });
    await ctx.db.insert("adminLogs", {
      action: "invoice_mark_draft",
      performedBy: user._id,
      timestamp: now,
      details: `${invoiceId}`,
    });
  },
});

export const deleteInvoice = mutation({
  args: { sessionToken: v.string(), invoiceId: v.id("invoices") },
  handler: async (ctx, { sessionToken, invoiceId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const row = await ctx.db.get(invoiceId);
    if (!row) return;
    await ctx.db.delete(invoiceId);
    await ctx.db.insert("adminLogs", {
      action: "invoice_delete",
      performedBy: user._id,
      timestamp: Date.now(),
      details: `${invoiceId}`,
    });
  },
});

export const createFromItinerary = mutation({
  args: {
    sessionToken: v.string(),
    itineraryId: v.id("itineraries"),
    currency: v.optional(v.union(v.literal("PKR"), v.literal("USD"))),
    advanceAmount: v.optional(v.number()),
    tripSummary: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, itineraryId, currency, tripSummary }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const itin = await ctx.db.get(itineraryId);
    if (!itin) throw new Error("Itinerary not found");

    const now = Date.now();
    const invoiceNumber = await issueInvoiceNumber(ctx, now);
    const id = await ctx.db.insert("invoices", {
      invoiceNumber,
      clientName: itin.clientName,
      itineraryId: itin._id,
      invoiceDate: new Date().toISOString().slice(0, 10),
      currency: currency ?? "PKR",
      status: "draft",
      items: [
        {
          name: `Trip package (${itin.days} days)`,
          description: itin.title,
          quantity: 1,
          price: 0,
        },
      ],
      discount: 0,
      tax: 0,
      advanceAmount: 0,
      tripSummary: typeof tripSummary === "string" ? tripSummary.trim() : "",
      paymentMethod: "bank",
      paymentDetails: "",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("adminLogs", {
      action: "invoice_create_from_itinerary",
      performedBy: user._id,
      timestamp: now,
      details: `${id} ← ${itineraryId}`,
    });

    return id;
  },
});

