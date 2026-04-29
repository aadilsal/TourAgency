import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { requireUserFromSession } from "./lib/authHelpers.js";

const GLOBAL_SETTINGS_KEY = "global";

function assertAdminFromSession(
  user: { role: string },
): asserts user is { role: "admin" | "super_admin" } {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
}

function envDefaults() {
  return {
    officeAddress: process.env.NEXT_PUBLIC_OFFICE_ADDRESS?.trim() || "",
    whatsappPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || "+92 300 0000000",
    contactEmail:
      process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
      process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
      "hello@junkettours.example",
    website:
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      "",
    governmentLicenseNo:
      process.env.NEXT_PUBLIC_GOVERNMENT_LICENSE_NO?.trim() ||
      process.env.NEXT_PUBLIC_GOV_LICENSE_NO?.trim() ||
      "",
    mapsEmbedUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL?.trim() || "",
  };
}

/** Defaults when DB has no itinerary template fields yet (matches legacy itinerary draft defaults). */
export function itineraryTemplateDefaults() {
  return {
    paymentTerms: [
      {
        percent: 50,
        title: "On Registration",
        description: "Advance payment at time of booking",
      },
      {
        percent: 30,
        title: "Before Tour",
        description: "Due before trip commencement",
      },
      {
        percent: 20,
        title: "Cash to Driver",
        description: "Payable on trip day",
      },
    ] as const,
    bankDetails: {
      bankName: "Bank Alfalah",
      accountTitle: "Junket Tours",
      accountNumber: "",
      iban: "",
      instruction: "",
    },
    termsBlocks: [
      {
        title: "ID Requirements",
        body: "Pakistani nationals must carry valid CNIC. Foreign nationals must carry passport + visa.",
      },
      {
        title: "Code of Conduct",
        body: "Guests must maintain respectful behaviour. Misconduct may result in termination of services without refund.",
      },
      {
        title: "Plan Alterations",
        body: "Itinerary may change due to weather, road closures, or other situations. Safety and comfort come first.",
      },
      {
        title: "Liability Disclaimer",
        body: "The company is not liable for losses or delays arising from factors beyond its control. Travel insurance is recommended.",
      },
      {
        title: "Prohibited Items",
        body: "Weapons, firearms, explosives, hazardous materials, and illegal substances are strictly prohibited.",
      },
    ] as const,
    defaultIncluded: [] as string[],
    defaultNotIncluded: [] as string[],
  };
}

type SiteDoc = {
  paymentTerms?: Array<{ percent: number; title: string; description?: string }>;
  bankDetails?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    instruction?: string;
  };
  termsBlocks?: Array<{ title: string; body: string }>;
  defaultIncluded?: string[];
  defaultNotIncluded?: string[];
};

/** Merge stored site settings with env + itinerary template fallbacks (admin PDF builder). */
function mergeAdminSiteSettings(doc: SiteDoc | null | undefined) {
  const env = envDefaults();
  const tmpl = itineraryTemplateDefaults();
  const base = { ...env, ...doc };
  return {
    ...base,
    paymentTerms: base.paymentTerms ?? [...tmpl.paymentTerms],
    bankDetails: base.bankDetails ?? { ...tmpl.bankDetails },
    termsBlocks: base.termsBlocks ?? [...tmpl.termsBlocks],
    defaultIncluded: base.defaultIncluded ?? [...tmpl.defaultIncluded],
    defaultNotIncluded: base.defaultNotIncluded ?? [...tmpl.defaultNotIncluded],
  };
}

export const getPublicSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_SETTINGS_KEY))
      .unique();
    return {
      ...envDefaults(),
      ...doc,
    };
  },
});

export const getAdminSiteSettings = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const doc = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_SETTINGS_KEY))
      .unique();
    return mergeAdminSiteSettings(doc ?? undefined);
  },
});

const paymentTermValidator = v.object({
  percent: v.number(),
  title: v.string(),
  description: v.optional(v.string()),
});

const bankDetailsValidator = v.object({
  bankName: v.optional(v.string()),
  accountTitle: v.optional(v.string()),
  accountNumber: v.optional(v.string()),
  iban: v.optional(v.string()),
  instruction: v.optional(v.string()),
});

const termsBlockValidator = v.object({
  title: v.string(),
  body: v.string(),
});

export const upsertAdminSiteSettings = mutation({
  args: {
    sessionToken: v.string(),
    officeAddress: v.optional(v.string()),
    whatsappPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    website: v.optional(v.string()),
    governmentLicenseNo: v.optional(v.string()),
    mapsEmbedUrl: v.optional(v.string()),
    paymentTerms: v.optional(v.array(paymentTermValidator)),
    bankDetails: v.optional(bankDetailsValidator),
    termsBlocks: v.optional(v.array(termsBlockValidator)),
    defaultIncluded: v.optional(v.array(v.string())),
    defaultNotIncluded: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { sessionToken, ...args }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const now = Date.now();
    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_SETTINGS_KEY))
      .unique();

    const patch: Record<string, unknown> = {
      officeAddress: args.officeAddress?.trim() || undefined,
      whatsappPhone: args.whatsappPhone?.trim() || undefined,
      contactEmail: args.contactEmail?.trim() || undefined,
      website: args.website?.trim() || undefined,
      governmentLicenseNo:
        user.role === "super_admin"
          ? (args.governmentLicenseNo?.trim() || undefined)
          : undefined,
      mapsEmbedUrl: args.mapsEmbedUrl?.trim() || undefined,
      updatedAt: now,
      updatedBy: user._id,
    };

    if (args.paymentTerms !== undefined) {
      patch.paymentTerms = args.paymentTerms;
    }
    if (args.bankDetails !== undefined) {
      patch.bankDetails = args.bankDetails;
    }
    if (args.termsBlocks !== undefined) {
      patch.termsBlocks = args.termsBlocks;
    }
    if (args.defaultIncluded !== undefined) {
      patch.defaultIncluded = args.defaultIncluded.map((s) => s.trim()).filter(Boolean);
    }
    if (args.defaultNotIncluded !== undefined) {
      patch.defaultNotIncluded = args.defaultNotIncluded.map((s) => s.trim()).filter(Boolean);
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("siteSettings", {
      key: GLOBAL_SETTINGS_KEY,
      ...(patch as Record<string, unknown>),
      updatedAt: now,
      updatedBy: user._id,
    });
  },
});
