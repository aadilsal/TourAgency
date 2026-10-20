import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import type { MutationCtx } from "./_generated/server.js";
import type { Doc } from "./_generated/dataModel.js";
import { requireUserFromSession } from "./lib/authHelpers.js";
import { paginationOptsValidator } from "convex/server";
import { invoiceTextDefaults } from "./siteSettings.js";

const invoiceStatusValidator = v.union(
  v.literal("draft"),
  v.literal("advance_paid"),
  v.literal("paid"),
);

/** Auto-generated stay label ("Stop 1") from the itinerary builder. */
const AUTO_STOP_LABEL = /^stop \d+$/i;

type InvoiceLine = { name: string; description?: string; quantity: number; price: number };

/**
 * The line item a new invoice starts with, built from the itinerary's
 * package: the first package with a price (packages are alternatives the
 * customer chooses between, so they are never summed). Falls back to a
 * blank "Trip package" line when the itinerary has no package yet.
 */
export function invoiceItemsFromItinerary(
  itin: Pick<
    Doc<"itineraries">,
    "title" | "days" | "startDate" | "endDate" | "packageTiers" | "packages"
  >,
): InvoiceLine[] {
  const tiers: Array<{
    name: string;
    pricePkr?: number;
    vehicle?: string;
    note?: string;
    stays?: Array<{ location: string; hotel: string; nights: number }>;
  }> = itin.packageTiers?.length ? itin.packageTiers : (itin.packages ?? []);
  const pick =
    tiers.find((t) => typeof t.pricePkr === "number" && t.pricePkr > 0) ??
    tiers.find((t) => t.name.trim());
  const dates =
    itin.startDate && itin.endDate
      ? `${itin.startDate} to ${itin.endDate}`
      : (itin.startDate ?? "");
  const tripLine = [`${itin.days} days`, dates].filter(Boolean).join(" · ");
  if (!pick) {
    return [
      {
        name: `Trip package (${itin.days} days)`,
        description: [itin.title, dates].filter(Boolean).join("\n"),
        quantity: 1,
        price: 0,
      },
    ];
  }
  const stays = (pick.stays ?? [])
    .filter((s) => s.hotel.trim())
    .map((s) => {
      const loc = AUTO_STOP_LABEL.test(s.location.trim()) ? "" : s.location.trim();
      return `${loc ? `${loc}: ` : ""}${s.hotel.trim()} (${s.nights}N)`;
    });
  const title = itin.title.trim() || "Trip package";
  return [
    {
      name: pick.name.trim() ? `${title} (${pick.name.trim()})` : title,
      description: [tripLine, pick.vehicle?.trim() ?? "", ...stays, pick.note?.trim() ?? ""]
        .filter(Boolean)
        .join("\n"),
      quantity: 1,
      price: typeof pick.pricePkr === "number" && pick.pricePkr > 0 ? pick.pricePkr : 0,
    },
  ];
}

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

async function issueInvoiceNumber(ctx: MutationCtx, nowMs: number) {
  const fiscalYearKey = fiscalYearKeyFromMs(nowMs);
  const existing = await ctx.db
    .query("invoiceCounters")
    .withIndex("by_fiscal_year", (q) => q.eq("fiscalYearKey", fiscalYearKey))
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
    clientPhone: v.optional(v.string()),
    clientEmail: v.optional(v.string()),
    /** Omit to start from the default text in the itinerary template. */
    terms: v.optional(v.string()),
    cancellationPolicy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSession(ctx, args.sessionToken);
    assertAdminFromSession(user);

    const now = Date.now();
    const invoiceNumber = await issueInvoiceNumber(ctx, now);
    const defaults = await invoiceTextDefaults(ctx);
    const id = await ctx.db.insert("invoices", {
      invoiceNumber,
      clientName: args.clientName.trim(),
      ...(args.clientPhone?.trim() ? { clientPhone: args.clientPhone.trim() } : {}),
      ...(args.clientEmail?.trim() ? { clientEmail: args.clientEmail.trim() } : {}),
      terms: (args.terms ?? defaults.terms).trim(),
      cancellationPolicy: (args.cancellationPolicy ?? defaults.cancellationPolicy).trim(),
      itineraryId: args.itineraryId,
      invoiceDate: args.invoiceDate.trim(),
      currency: args.currency,
      status: "draft",
      items: [
        { name: "Trip package", description: "", quantity: 1, price: 0 },
      ],
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
    /** Pass `null` to clear. */
    clientPhone: v.optional(v.union(v.string(), v.null())),
    clientEmail: v.optional(v.union(v.string(), v.null())),
    /** Pass `null` to unlink the itinerary. */
    itineraryId: v.optional(v.union(v.id("itineraries"), v.null())),
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
      if (val === null) {
        // `null` = clear the field (patching to undefined removes it).
        next[k] = undefined;
        continue;
      }
      if (k === "advanceAmount" && typeof val === "number") {
        next[k] = Math.max(0, val);
        continue;
      }
      if (
        (k === "invoiceDate" ||
          k === "clientName" ||
          k === "clientPhone" ||
          k === "clientEmail" ||
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
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { sessionToken, paginationOpts }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const paged = await ctx.db
      .query("invoices")
      .withIndex("by_created")
      .order("desc")
      .paginate(paginationOpts);

    return {
      ...paged,
      page: paged.page.map(toAdminListRow),
    };
  },
});

function toAdminListRow(i: Doc<"invoices">) {
  return {
    _id: i._id,
    invoiceNumber: i.invoiceNumber,
    clientName: i.clientName,
    itineraryId: i.itineraryId,
    invoiceDate: i.invoiceDate,
    currency: i.currency,
    status: i.status,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
}

/**
 * Server-side search across ALL invoices (client name or invoice number), so
 * records outside the currently loaded page are never "missing" from search.
 */
export const searchForAdmin = query({
  args: {
    sessionToken: v.string(),
    search: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { sessionToken, search, limit }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const term = search.trim();
    if (!term) return [];
    const max = Math.max(1, Math.min(100, Math.floor(limit ?? 50)));

    const [exactNumber, byNumber, byClient] = await Promise.all([
      ctx.db
        .query("invoices")
        .withIndex("by_invoice_number", (q) => q.eq("invoiceNumber", term.toUpperCase()))
        .take(max),
      ctx.db
        .query("invoices")
        .withSearchIndex("search_number", (q) => q.search("invoiceNumber", term))
        .take(max),
      ctx.db
        .query("invoices")
        .withSearchIndex("search_client", (q) => q.search("clientName", term))
        .take(max),
    ]);

    const seen = new Set<string>();
    const merged: Doc<"invoices">[] = [];
    for (const row of [...exactNumber, ...byClient, ...byNumber]) {
      if (seen.has(row._id)) continue;
      seen.add(row._id);
      merged.push(row);
    }
    return merged.slice(0, max).map(toAdminListRow);
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
  handler: async (ctx, { sessionToken, itineraryId, currency, advanceAmount, tripSummary }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    return await insertInvoiceFromItinerary(ctx, user._id, itineraryId, {
      currency,
      advanceAmount,
      tripSummary,
    });
  },
});

/** Short trip summary printed on the invoice, e.g. "Hunza Escape — 5 days, 2026-11-01 to 2026-11-05. 2 adults, 1 child." */
function defaultTripSummary(itin: Doc<"itineraries">): string {
  const dates =
    itin.startDate && itin.endDate
      ? `${itin.startDate} to ${itin.endDate}`
      : (itin.startDate ?? "");
  const people = [
    typeof itin.adults === "number" && itin.adults > 0
      ? `${itin.adults} adult${itin.adults === 1 ? "" : "s"}`
      : "",
    typeof itin.children === "number" && itin.children > 0
      ? `${itin.children} ${itin.children === 1 ? "child" : "children"}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");
  const head = [itin.title.trim(), [`${itin.days} days`, dates].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" — ");
  return [head ? `${head}.` : "", people ? `${people}.` : ""].filter(Boolean).join(" ");
}

async function insertInvoiceFromItinerary(
  ctx: MutationCtx,
  performedBy: Doc<"users">["_id"],
  itineraryId: Doc<"itineraries">["_id"],
  opts: { currency?: "PKR" | "USD"; advanceAmount?: number; tripSummary?: string },
) {
  const itin = await ctx.db.get(itineraryId);
  if (!itin) throw new Error("Itinerary not found");

  const now = Date.now();
  const invoiceNumber = await issueInvoiceNumber(ctx, now);
  const defaults = await invoiceTextDefaults(ctx);
  const id = await ctx.db.insert("invoices", {
    invoiceNumber,
    clientName: itin.clientName,
    ...(itin.clientPhone?.trim() ? { clientPhone: itin.clientPhone.trim() } : {}),
    ...(itin.clientEmail?.trim() ? { clientEmail: itin.clientEmail.trim() } : {}),
    itineraryId: itin._id,
    invoiceDate: new Date().toISOString().slice(0, 10),
    currency: opts.currency ?? "PKR",
    status: "draft",
    // Package + price from the itinerary, so the admin doesn't retype them.
    items: invoiceItemsFromItinerary(itin),
    discount: 0,
    tax: 0,
    advanceAmount:
      typeof opts.advanceAmount === "number" ? Math.max(0, opts.advanceAmount) : 0,
    tripSummary:
      typeof opts.tripSummary === "string" ? opts.tripSummary.trim() : defaultTripSummary(itin),
    paymentMethod: "bank",
    paymentDetails: "",
    terms: defaults.terms,
    cancellationPolicy: defaults.cancellationPolicy,
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert("adminLogs", {
    action: "invoice_create_from_itinerary",
    performedBy,
    timestamp: now,
    details: `${id} ← ${itineraryId}`,
  });

  return id;
}

/**
 * "Make invoice" in the itinerary builder: opens the invoice already linked
 * to this itinerary, or creates one (pre-filled) when there is none.
 */
export const getOrCreateForItinerary = mutation({
  args: { sessionToken: v.string(), itineraryId: v.id("itineraries") },
  handler: async (ctx, { sessionToken, itineraryId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const existing = await ctx.db
      .query("invoices")
      .withIndex("by_itinerary", (q) => q.eq("itineraryId", itineraryId))
      .first();
    if (existing) return { invoiceId: existing._id, created: false };
    const invoiceId = await insertInvoiceFromItinerary(ctx, user._id, itineraryId, {});
    return { invoiceId, created: true };
  },
});

/** Unpaid ("draft") / Advance paid / Fully paid ("paid"). */
export const setStatus = mutation({
  args: { sessionToken: v.string(), invoiceId: v.id("invoices"), status: invoiceStatusValidator },
  handler: async (ctx, { sessionToken, invoiceId, status }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const row = await ctx.db.get(invoiceId);
    if (!row) throw new Error("Invoice not found");
    if (row.status === status) return;
    const now = Date.now();
    await ctx.db.patch(invoiceId, { status, updatedAt: now });
    await ctx.db.insert("adminLogs", {
      action: "invoice_set_status",
      performedBy: user._id,
      timestamp: now,
      details: `${invoiceId} → ${status}`,
    });
  },
});

