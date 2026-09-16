import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { requireUserFromSession } from "./lib/authHelpers.js";
import { normalizeGoogleMapsEmbedUrl } from "./lib/googleMapsEmbed.js";

const GLOBAL_SETTINGS_KEY = "global";

function assertAdminFromSession(
  user: { role: string },
): asserts user is { role: "admin" | "super_admin" } {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
}

/** Real JunketTours business details — used only when a field was never set. */
export const BUSINESS_DEFAULTS = {
  officeAddress:
    "156, M Block, Main Blvd, near Khokhar Chowk, Phase 2 Johar Town, Lahore, Pakistan",
  contactEmail: "info@junkettours.co",
  whatsappPhone: "+92 320 9973486",
  website: "https://www.junkettours.co",
} as const;

function envDefaults() {
  return {
    officeAddress:
      process.env.NEXT_PUBLIC_OFFICE_ADDRESS?.trim() || BUSINESS_DEFAULTS.officeAddress,
    whatsappPhone:
      process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || BUSINESS_DEFAULTS.whatsappPhone,
    contactEmail:
      process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || BUSINESS_DEFAULTS.contactEmail,
    website:
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      BUSINESS_DEFAULTS.website,
    governmentLicenseNo:
      process.env.NEXT_PUBLIC_GOVERNMENT_LICENSE_NO?.trim() ||
      process.env.NEXT_PUBLIC_GOV_LICENSE_NO?.trim() ||
      "",
    governmentLicenseNo2:
      process.env.NEXT_PUBLIC_GOVERNMENT_LICENSE_NO_2?.trim() ||
      process.env.NEXT_PUBLIC_GOV_LICENSE_NO_2?.trim() ||
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
      accountNumber: "0195001010197354",
      iban: "PK65ALFH0195001010197354",
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

const TEXT_FIELDS = [
  "officeAddress",
  "whatsappPhone",
  "contactEmail",
  "website",
  "governmentLicenseNo",
  "governmentLicenseNo2",
  "mapsEmbedUrl",
] as const;
type TextField = (typeof TEXT_FIELDS)[number];

/**
 * Old placeholder fallbacks that an earlier admin form wrote into the database
 * as if they were real data. Treated as "never set" on read so the real
 * business defaults show instead (the stored row itself is left untouched).
 */
const LEGACY_PLACEHOLDERS = new Set(["+92 300 0000000", "hello@junkettours.example"]);

type StoredDoc = SiteDoc & Partial<Record<TextField, string>>;

/** Drop legacy placeholder values so they read as unset. */
function withoutPlaceholders<D extends StoredDoc>(doc: D | null | undefined): D | undefined {
  if (!doc) return undefined;
  const clean = { ...doc };
  for (const f of TEXT_FIELDS) {
    const val = clean[f];
    if (typeof val === "string" && LEGACY_PLACEHOLDERS.has(val.trim())) {
      delete clean[f];
    }
  }
  return clean;
}

/**
 * Raw stored values for the admin form: `null` = never set (the site shows the
 * fallback), "" = explicitly cleared by an admin, otherwise the saved value.
 */
function storedValues(doc: StoredDoc | undefined) {
  const text = Object.fromEntries(
    TEXT_FIELDS.map((f) => [f, doc?.[f] ?? null]),
  ) as Record<TextField, string | null>;
  return {
    ...text,
    bankDetails: doc?.bankDetails ?? null,
    paymentTerms: doc?.paymentTerms ?? null,
    termsBlocks: doc?.termsBlocks ?? null,
    defaultIncluded: doc?.defaultIncluded ?? null,
    defaultNotIncluded: doc?.defaultNotIncluded ?? null,
  };
}

/** Merge stored site settings with env + itinerary template fallbacks (admin PDF builder). */
function mergeAdminSiteSettings(rawDoc: StoredDoc | null | undefined) {
  const doc = withoutPlaceholders(rawDoc);
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
    /** Raw DB values for editing forms (never pre-filled with fallbacks). */
    stored: storedValues(doc),
    /** What the site shows for a field that was never set. */
    fallbacks: {
      ...env,
      paymentTerms: [...tmpl.paymentTerms],
      bankDetails: { ...tmpl.bankDetails },
      termsBlocks: [...tmpl.termsBlocks],
      defaultIncluded: [...tmpl.defaultIncluded],
      defaultNotIncluded: [...tmpl.defaultNotIncluded],
    },
  };
}

export const getPublicSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_SETTINGS_KEY))
      .unique();
    const merged = {
      ...envDefaults(),
      ...withoutPlaceholders(doc),
    };
    const mapsEmbedUrl = normalizeGoogleMapsEmbedUrl(merged.mapsEmbedUrl);
    const tmpl = itineraryTemplateDefaults();
    return {
      ...merged,
      mapsEmbedUrl: mapsEmbedUrl ?? "",
      // Bank details are shown on public-facing invoices; fall back to the
      // constant template defaults when an admin hasn't customised them.
      bankDetails: (merged as SiteDoc).bankDetails ?? { ...tmpl.bankDetails },
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
    governmentLicenseNo2: v.optional(v.string()),
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

    // Several admin screens share this mutation and each sends only its own
    // (changed) fields. Only touch a field when the caller actually sent it —
    // otherwise saving one screen wipes another's data.
    //
    // An explicit blank is stored as "" (not removed): removing the field would
    // make the fallback silently re-appear on the site after an admin cleared it.
    const patch: Record<string, unknown> = {
      updatedAt: now,
      updatedBy: user._id,
    };

    for (const field of TEXT_FIELDS) {
      const raw = args[field];
      if (raw === undefined) continue;
      if (field === "mapsEmbedUrl") {
        const trimmed = raw.trim();
        if (!trimmed) {
          patch.mapsEmbedUrl = "";
          continue;
        }
        const normalized = normalizeGoogleMapsEmbedUrl(trimmed);
        if (!normalized) {
          // Never silently drop what the admin pasted.
          throw new Error(
            "That Google Maps link isn't valid. Paste the embed URL (https://www.google.com/maps/embed?...) or the full <iframe> code.",
          );
        }
        patch.mapsEmbedUrl = normalized;
        continue;
      }
      patch[field] = raw.trim();
    }

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
