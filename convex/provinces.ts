import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server.js";
import type { Doc, Id } from "./_generated/dataModel.js";
import { requireAdmin } from "./lib/authHelpers.js";
import { resolveTourImageUrls } from "./lib/resolveTourImages.js";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80";

function locationMatchesTerms(location: string, terms: string[]): boolean {
  const l = location.toLowerCase();
  return terms.some((t) => t.length >= 2 && l.includes(t.toLowerCase()));
}

export async function resolveProvinceHeroUrl(
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  p: Doc<"provinces">,
): Promise<string> {
  if (p.heroStorageId) {
    const u = await ctx.storage.getUrl(p.heroStorageId);
    if (u) return u;
  }
  if (p.heroExternalUrl) return p.heroExternalUrl;
  return FALLBACK_HERO;
}

function belongsToProvince(tour: Doc<"tours">, province: Doc<"provinces">): boolean {
  if (Array.isArray(tour.provinceIds) && tour.provinceIds.length > 0) {
    return tour.provinceIds.some((id) => id === province._id);
  }
  return locationMatchesTerms(tour.location, province.matchTerms);
}

async function ensureUniqueSlug(ctx: MutationCtx, base: string): Promise<string> {
  let slug = base;
  let n = 0;
  for (;;) {
    const existing = await ctx.db
      .query("provinces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

type ProvinceSeedRow = Omit<
  Doc<"provinces">,
  "_id" | "_creationTime" | "createdAt" | "updatedAt"
>;

const DEFAULT_PROVINCES: ProvinceSeedRow[] = [
  {
    slug: "sindh",
    name: "Sindh",
    tagline: "Indus civilization, Sufi heritage & Arabian Sea culture.",
    intro:
      "Sindh is where Pakistan's story begins — from the Bronze Age cities of the Indus Valley to the marble domes of Thatta and the energy of Karachi.",
    heroExternalUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2000&q=80",
    bestTime: "October–March for city and site touring.",
    tips: ["Pair Karachi with Thatta or Makli.", "Visit Mohenjo-daro early morning."],
    costEstimate: "Sindh heritage weekends from PKR 25k–50k per person.",
    matchTerms: ["sindh", "karachi", "thatta", "mohenjo", "hyderabad", "larkana"],
    sortOrder: 0,
    mapPointX: 420,
    mapPointY: 620,
    mapPointLabel: "Sindh",
    scrollyEyebrow: "Where it begins",
    scrollyTitle: "Sindh: Indus civilization & coastal culture.",
    scrollyBullets: [
      "Mohenjo-daro — one of the world's earliest urban centers",
      "Makli and Thatta — UNESCO marble necropolis and mosque",
      "Karachi — port-city food, markets, and Quaid's mausoleum",
    ],
    scrollyStats: ["Indus Valley", "Sufi shrines", "Coast"],
    paletteFrom: "rgba(15, 23, 42, 0.95)",
    paletteVia: "rgba(2, 132, 199, 0.22)",
    paletteTo: "rgba(2, 6, 23, 0.92)",
    paletteAccent: "rgba(56, 189, 248, 0.95)",
  },
  {
    slug: "balochistan",
    name: "Balochistan",
    tagline: "Desert canyons, juniper highlands & Makran coast.",
    intro:
      "Balochistan rewards travelers who want space and contrast — juniper forests at Ziarat, surreal Hingol National Park, and a Makran coastline.",
    heroExternalUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80",
    bestTime: "October–April.",
    tips: ["Confirm road security for remote routes.", "Carry water on desert drives."],
    costEstimate: "Balochistan circuits PKR 40k–120k+ depending on access.",
    matchTerms: ["balochistan", "quetta", "ziarat", "hingol", "gwadar", "khuzdar"],
    sortOrder: 1,
    mapPointX: 280,
    mapPointY: 520,
    mapPointLabel: "Balochistan",
    scrollyEyebrow: "Desert & coast",
    scrollyTitle: "Balochistan: juniper highlands to Makran shores.",
    scrollyBullets: [
      "Hingol — mud volcanoes and coastal cliffs",
      "Ziarat — Quaid's residency and juniper forest",
      "Quetta — bazaars and highland gateway",
    ],
    scrollyStats: ["Hingol", "Ziarat", "Makran"],
    paletteFrom: "rgba(30, 20, 10, 0.92)",
    paletteVia: "rgba(180, 83, 9, 0.18)",
    paletteTo: "rgba(2, 6, 23, 0.92)",
    paletteAccent: "rgba(245, 158, 11, 0.95)",
  },
  {
    slug: "punjab",
    name: "Punjab",
    tagline: "Mughal heartland, Sufi shrines & ancient Harappa.",
    intro:
      "Punjab is Pakistan's cultural engine — Lahore's Mughal masterpieces, Multan's shrines, and forts like Rohtas along the Grand Trunk Road.",
    heroExternalUrl:
      "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=2000&q=80",
    bestTime: "October–March for heritage walks.",
    tips: ["Start Lahore days early at the fort.", "Combine Multan with Lahore."],
    costEstimate: "Punjab heritage weekends PKR 25k–60k.",
    matchTerms: ["punjab", "lahore", "multan", "harappa", "faisalabad", "rohtas"],
    sortOrder: 2,
    mapPointX: 560,
    mapPointY: 420,
    mapPointLabel: "Punjab",
    scrollyEyebrow: "Mughal heartland",
    scrollyTitle: "Punjab: forts, shrines & living cities.",
    scrollyBullets: [
      "Lahore Fort, Badshahi Mosque, and Walled City",
      "Multan — Sufi shrines and blue tilework",
      "Harappa & Rohtas — archaeology and military heritage",
    ],
    scrollyStats: ["Mughal", "Sufi", "Archaeology"],
    paletteFrom: "rgba(17, 24, 39, 0.92)",
    paletteVia: "rgba(234, 88, 12, 0.18)",
    paletteTo: "rgba(2, 6, 23, 0.92)",
    paletteAccent: "rgba(251, 146, 60, 0.95)",
  },
  {
    slug: "islamabad",
    name: "Islamabad & Heritage Belt",
    tagline: "Gandhara archaeology, capital landmarks & Margalla trails.",
    intro:
      "The Islamabad region bridges ancient and modern Pakistan — Taxila's Gandhara ruins, Faisal Mosque, and Margalla Hills trails.",
    heroExternalUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80",
    bestTime: "October–April for site walks.",
    tips: ["Taxila deserves a licensed guide.", "Margalla trails need sun protection."],
    costEstimate: "Day trips from PKR 15k–35k.",
    matchTerms: ["islamabad", "taxila", "rawalpindi", "murree", "margalla"],
    sortOrder: 3,
    mapPointX: 500,
    mapPointY: 350,
    mapPointLabel: "Islamabad",
    scrollyEyebrow: "Capital & Gandhara",
    scrollyTitle: "Islamabad: ancient Taxila to modern landmarks.",
    scrollyBullets: [
      "Taxila — UNESCO Gandhara Buddhist heritage",
      "Faisal Mosque & Pakistan Monument",
      "Margalla Hills — trails above the capital",
    ],
    scrollyStats: ["Gandhara", "Capital", "Trails"],
    paletteFrom: "rgba(2, 6, 23, 0.92)",
    paletteVia: "rgba(16, 185, 129, 0.16)",
    paletteTo: "rgba(15, 23, 42, 0.92)",
    paletteAccent: "rgba(52, 211, 153, 0.95)",
  },
  {
    slug: "kpk",
    name: "Khyber Pakhtunkhwa",
    tagline: "Gandhara valleys, Peshawar bazaars & Kalash culture.",
    intro:
      "KPK layers Buddhist archaeology, frontier bazaar culture, and alpine valleys — from Peshawar to Swat, Chitral, and Kaghan.",
    heroExternalUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80",
    bestTime: "March–November for valleys.",
    tips: ["Respect Kalash customs.", "Check monsoon advisories."],
    costEstimate: "Swat/Kaghan PKR 35k–80k; Chitral–Kalash PKR 80k–150k+.",
    matchTerms: ["kpk", "khyber", "peshawar", "swat", "chitral", "kalash", "naran", "kaghan"],
    sortOrder: 4,
    mapPointX: 470,
    mapPointY: 280,
    mapPointLabel: "KPK",
    scrollyEyebrow: "Frontier heritage",
    scrollyTitle: "KPK: bazaars, Buddhist trails & alpine valleys.",
    scrollyBullets: [
      "Peshawar — Qissa Khwani and frontier history",
      "Swat — Gandhara stupas and emerald valleys",
      "Chitral & Kalash — living indigenous culture",
    ],
    scrollyStats: ["Gandhara", "Bazaars", "Valleys"],
    paletteFrom: "rgba(2, 6, 23, 0.92)",
    paletteVia: "rgba(34, 197, 94, 0.16)",
    paletteTo: "rgba(2, 6, 23, 0.92)",
    paletteAccent: "rgba(74, 222, 128, 0.95)",
  },
  {
    slug: "gilgit-baltistan",
    name: "Gilgit-Baltistan",
    tagline: "Mountain forts, Silk Route heritage & Karakoram lakes.",
    intro:
      "Gilgit-Baltistan is northern heritage at its peak — forts in Hunza, palaces in Skardu, Deosai, and Karakoram Highway viewpoints.",
    heroExternalUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80",
    bestTime: "Late April–October.",
    tips: ["Lead with fort visits before hikes.", "Buffer days for Skardu flights."],
    costEstimate: "GB road packages PKR 45k–150k+.",
    matchTerms: ["gilgit", "hunza", "skardu", "baltistan", "karakoram", "deosai"],
    sortOrder: 5,
    mapPointX: 450,
    mapPointY: 150,
    mapPointLabel: "Gilgit-Baltistan",
    scrollyEyebrow: "Northern heritage",
    scrollyTitle: "Gilgit-Baltistan: forts, valleys & Karakoram views.",
    scrollyBullets: [
      "Baltit & Altit forts — centuries above Hunza Valley",
      "Shigar Fort & Skardu — Silk Route royal heritage",
      "Deosai & Khunjerab — high-altitude adventure",
    ],
    scrollyStats: ["Forts", "Karakoram", "Lakes"],
    paletteFrom: "rgba(2, 6, 23, 0.92)",
    paletteVia: "rgba(244, 114, 182, 0.14)",
    paletteTo: "rgba(2, 6, 23, 0.92)",
    paletteAccent: "rgba(244, 114, 182, 0.95)",
  },
  {
    slug: "azad-kashmir",
    name: "Azad Kashmir",
    tagline: "Neelum Valley, Muzaffarabad & Pir Chinasi viewpoints.",
    intro:
      "Azad Kashmir combines frontier city heritage with deep green valleys — Muzaffarabad, Neelum, and Pir Chinasi viewpoints.",
    heroExternalUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80",
    bestTime: "April–October for valley access.",
    tips: ["Neelum needs 2–3 nights.", "Confirm LOC-area advisories."],
    costEstimate: "Weekend Neelum packages PKR 30k–55k.",
    matchTerms: ["kashmir", "muzaffarabad", "neelum", "rawalakot", "bagh"],
    sortOrder: 6,
    mapPointX: 580,
    mapPointY: 220,
    mapPointLabel: "Azad Kashmir",
    scrollyEyebrow: "Valley finish",
    scrollyTitle: "Azad Kashmir: rivers, pines & Himalayan views.",
    scrollyBullets: [
      "Neelum Valley — riverside villages and forest drives",
      "Muzaffarabad — Red Fort and confluence viewpoints",
      "Pir Chinasi — panoramic ridge above the capital",
    ],
    scrollyStats: ["Neelum", "Viewpoints", "Valleys"],
    paletteFrom: "rgba(2, 6, 23, 0.92)",
    paletteVia: "rgba(99, 102, 241, 0.16)",
    paletteTo: "rgba(2, 6, 23, 0.92)",
    paletteAccent: "rgba(129, 140, 248, 0.95)",
  },
];

export const syncDefaultCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    let created = 0;
    let updated = 0;
    for (let i = 0; i < DEFAULT_PROVINCES.length; i++) {
      const row = DEFAULT_PROVINCES[i]!;
      const existing = await ctx.db
        .query("provinces")
        .withIndex("by_slug", (q) => q.eq("slug", row.slug))
        .unique();
      const payload = { ...row, updatedAt: now + i };
      if (existing) {
        await ctx.db.patch(existing._id, payload);
        updated++;
      } else {
        await ctx.db.insert("provinces", { ...payload, createdAt: now + i });
        created++;
      }
    }
    return { created, updated, total: DEFAULT_PROVINCES.length };
  },
});

export const listForIndex = query({
  args: {},
  handler: async (ctx) => {
    const provinces = await ctx.db.query("provinces").collect();
    if (provinces.length === 0) return [];
    const tours = await ctx.db
      .query("tours")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(500);
    const sites = await ctx.db.query("sites").collect();
    const sorted = provinces.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
    return Promise.all(
      sorted.map(async (p) => {
        const heroUrl = await resolveProvinceHeroUrl(ctx, p);
        const tourCount = tours.filter((t) => belongsToProvince(t, p)).length;
        const siteCount = sites.filter((s) => s.provinceId === p._id && s.isActive).length;
        return {
          slug: p.slug,
          name: p.name,
          tagline: p.tagline,
          heroUrl,
          tourCount,
          siteCount,
          sortOrder: p.sortOrder,
        };
      }),
    );
  },
});

export const getPublicBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const p = await ctx.db
      .query("provinces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!p) return null;
    const heroUrl = await resolveProvinceHeroUrl(ctx, p);
    return {
      _id: p._id,
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      intro: p.intro,
      heroUrl,
      bestTime: p.bestTime,
      tips: p.tips,
      costEstimate: p.costEstimate,
      matchTerms: p.matchTerms,
      mapPoint: { x: p.mapPointX, y: p.mapPointY, label: p.mapPointLabel },
      scrollyEyebrow: p.scrollyEyebrow,
      scrollyTitle: p.scrollyTitle,
      scrollyBullets: p.scrollyBullets,
      scrollyStats: p.scrollyStats ?? [],
      palette: {
        from: p.paletteFrom,
        via: p.paletteVia,
        to: p.paletteTo,
        accent: p.paletteAccent,
      },
    };
  },
});

export const listSlugs = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("provinces").collect();
    return rows.map((p) => p.slug);
  },
});

export const listRelatedTours = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const p = await ctx.db
      .query("provinces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!p) return [];
    const tours = await ctx.db.query("tours").collect();
    const matched = tours.filter((t) => t.isActive && belongsToProvince(t, p));
    return Promise.all(
      matched.slice(0, 12).map(async (t) => ({
        slug: t.slug,
        title: t.title,
        description: t.description,
        price: t.price,
        durationDays: t.durationDays,
        location: t.location,
        images: await resolveTourImageUrls(ctx, t.images),
      })),
    );
  },
});

export const listForTourAssignment = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("provinces").collect();
    return rows
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((p) => ({ _id: p._id, name: p.name, slug: p.slug }));
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("provinces").collect();
    const tours = await ctx.db.query("tours").collect();
    const sites = await ctx.db.query("sites").collect();
    return Promise.all(
      rows
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map(async (p) => ({
          ...p,
          heroUrl: await resolveProvinceHeroUrl(ctx, p),
          tourCount: tours.filter((t) => t.isActive && belongsToProvince(t, p)).length,
          siteCount: sites.filter((s) => s.provinceId === p._id).length,
        })),
    );
  },
});

export const createProvince = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    tagline: v.string(),
    intro: v.string(),
    heroExternalUrl: v.optional(v.string()),
    bestTime: v.string(),
    tips: v.array(v.string()),
    costEstimate: v.string(),
    matchTerms: v.array(v.string()),
    sortOrder: v.number(),
    mapPointX: v.number(),
    mapPointY: v.number(),
    mapPointLabel: v.string(),
    scrollyEyebrow: v.string(),
    scrollyTitle: v.string(),
    scrollyBullets: v.array(v.string()),
    scrollyStats: v.optional(v.array(v.string())),
    paletteFrom: v.string(),
    paletteVia: v.string(),
    paletteTo: v.string(),
    paletteAccent: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const slug = await ensureUniqueSlug(ctx, args.slug.trim().toLowerCase());
    return await ctx.db.insert("provinces", {
      ...args,
      slug,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProvince = mutation({
  args: {
    provinceId: v.id("provinces"),
    name: v.optional(v.string()),
    tagline: v.optional(v.string()),
    intro: v.optional(v.string()),
    heroExternalUrl: v.optional(v.string()),
    bestTime: v.optional(v.string()),
    tips: v.optional(v.array(v.string())),
    costEstimate: v.optional(v.string()),
    matchTerms: v.optional(v.array(v.string())),
    sortOrder: v.optional(v.number()),
    mapPointX: v.optional(v.number()),
    mapPointY: v.optional(v.number()),
    mapPointLabel: v.optional(v.string()),
    scrollyEyebrow: v.optional(v.string()),
    scrollyTitle: v.optional(v.string()),
    scrollyBullets: v.optional(v.array(v.string())),
    scrollyStats: v.optional(v.array(v.string())),
    paletteFrom: v.optional(v.string()),
    paletteVia: v.optional(v.string()),
    paletteTo: v.optional(v.string()),
    paletteAccent: v.optional(v.string()),
  },
  handler: async (ctx, { provinceId, ...patch }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(provinceId);
    if (!existing) throw new Error("Province not found");
    const next: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val !== undefined) next[k] = val;
    }
    next.updatedAt = Date.now();
    await ctx.db.patch(provinceId, next as Partial<Doc<"provinces">>);
  },
});

export const deleteProvince = mutation({
  args: { provinceId: v.id("provinces") },
  handler: async (ctx, { provinceId }) => {
    await requireAdmin(ctx);
    const siteRows = await ctx.db
      .query("sites")
      .withIndex("by_province", (q) => q.eq("provinceId", provinceId))
      .collect();
    for (const s of siteRows) await ctx.db.delete(s._id);
    const tours = await ctx.db.query("tours").collect();
    for (const t of tours) {
      if (Array.isArray(t.provinceIds) && t.provinceIds.includes(provinceId)) {
        await ctx.db.patch(t._id, {
          provinceIds: t.provinceIds.filter((id) => id !== provinceId),
        });
      }
    }
    await ctx.db.delete(provinceId);
  },
});
