"use node";

import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import {
  inferTourTypesFromText,
  parseTourPdfTemplate,
  slugifyTourTitle,
  type ParsedTourPdfSections,
} from "./lib/parseTourPdfTemplate.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const TOUR_TYPES = [
  "family",
  "honeymoon",
  "adventure",
  "corporate",
  "budget",
  "culture",
] as const;

export type TourPdfImportDraft = {
  title: string;
  slug: string;
  description: string;
  durationDays: number;
  location: string;
  types: string[];
  destinationSlugs: string[];
  provinceSlugs: string[];
  itinerary: Array<{ day: number; title: string; description: string }>;
  highlights: string[];
  included: string[];
  excluded: string[];
  tourTypeLabel?: string;
  maxPeople?: number;
  minAge?: number;
  timeSlots?: string[];
  ticketGroups?: Array<{ label: string; ageRange?: string }>;
  warnings: string[];
  enrichedByLlm: boolean;
};

type CatalogEntry = { slug: string; name: string };

type LlmEnrichment = {
  slug?: string;
  description?: string;
  location?: string;
  highlights?: string[];
  types?: string[];
  destinationSlugs?: string[];
  provinceSlugs?: string[];
  tourTypeLabel?: string;
  itinerary?: Array<{ day: number; title: string; description: string }>;
  included?: string[];
  excluded?: string[];
  maxPeople?: number;
  minAge?: number;
  timeSlots?: string[];
  ticketGroups?: Array<{ label: string; ageRange?: string }>;
};

async function groqComplete(system: string, user: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured");
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.25,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Groq error: ${res.status} ${t}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function filterSlugs(candidates: unknown, catalog: CatalogEntry[]): string[] {
  if (!Array.isArray(candidates)) return [];
  const allowed = new Set(catalog.map((c) => c.slug.toLowerCase()));
  const out: string[] = [];
  for (const item of candidates) {
    if (typeof item !== "string") continue;
    const s = item.trim().toLowerCase();
    if (allowed.has(s) && !out.includes(s)) out.push(s);
  }
  return out;
}

function filterTypes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().toLowerCase())
    .filter((t): t is (typeof TOUR_TYPES)[number] =>
      (TOUR_TYPES as readonly string[]).includes(t),
    );
}

function normalizeItinerary(
  raw: unknown,
  fallback: ParsedTourPdfSections["days"],
): Array<{ day: number; title: string; description: string }> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallback.map((d) => ({
      day: d.day,
      title: d.title,
      description: d.description.slice(0, 800),
    }));
  }
  const out: Array<{ day: number; title: string; description: string }> = [];
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const day =
      typeof o.day === "number"
        ? o.day
        : Number.parseInt(String(o.day ?? i + 1), 10);
    if (!Number.isFinite(day) || day < 1) continue;
    const title =
      typeof o.title === "string" && o.title.trim()
        ? o.title.trim()
        : fallback.find((f) => f.day === day)?.title ?? `Day ${day}`;
    const description =
      typeof o.description === "string"
        ? o.description.trim().slice(0, 800)
        : (fallback.find((f) => f.day === day)?.description ?? "").slice(
            0,
            800,
          );
    out.push({ day, title, description });
  }
  return out.length > 0
    ? out.sort((a, b) => a.day - b.day)
    : fallback.map((d) => ({
        day: d.day,
        title: d.title,
        description: d.description.slice(0, 800),
      }));
}

function buildFallbackDescription(parsed: ParsedTourPdfSections): string {
  const places = parsed.title.replace(/^\d+\s+days?\s+trip\s+to\s+/i, "").trim();
  const route = parsed.days
    .slice(0, 4)
    .map((d) => d.title)
    .join("; ");
  let text = `Discover Pakistan on this ${parsed.durationDays}-day journey through ${places}. `;
  if (route) text += `Highlights include ${route}. `;
  if (parsed.accommodations) {
    text += `Comfortable stays are arranged across the route. `;
  }
  text += `Ideal for travelers who want culture, heritage, and scenic drives with expert guidance.`;
  return text;
}

function buildFallbackHighlights(parsed: ParsedTourPdfSections): string[] {
  const fromDays = parsed.days
    .map((d) => d.title)
    .filter((t) => t.length > 4)
    .slice(0, 6);
  const extras: string[] = [];
  if (parsed.included.some((x) => /breakfast/i.test(x))) {
    extras.push("Daily breakfast included");
  }
  if (parsed.included.some((x) => /transport|sedan|jeep/i.test(x))) {
    extras.push("Private transport with fuel & tolls");
  }
  if (parsed.accommodations) {
    extras.push("Hand-picked hotels along the route");
  }
  return [...fromDays, ...extras].slice(0, 8);
}

async function enrichWithLlm(
  parsed: ParsedTourPdfSections,
  catalog: { destinations: CatalogEntry[]; provinces: CatalogEntry[] },
): Promise<{ enrichment: LlmEnrichment; enrichedByLlm: boolean }> {
  if (!process.env.GROQ_API_KEY) {
    return { enrichment: {}, enrichedByLlm: false };
  }

  const system = `You convert parsed Pakistan tour PDF data into website tour metadata for JunketTours.
Output a single JSON object only. No markdown fences.

Allowed types: ${TOUR_TYPES.join(", ")}
Use ONLY destination slugs from: ${catalog.destinations.map((d) => d.slug).join(", ") || "(none)"}
Use ONLY province slugs from: ${catalog.provinces.map((p) => p.slug).join(", ") || "(none)"}

JSON shape:
{
  "slug": "url-friendly-slug",
  "description": "150-350 word marketing description",
  "location": "short location label for cards",
  "highlights": ["5-8 bullets"],
  "types": ["culture"],
  "destinationSlugs": ["swat"],
  "provinceSlugs": ["kpk"],
  "tourTypeLabel": "e.g. Heritage & Culture tours",
  "itinerary": [{"day":1,"title":"short title","description":"2-4 sentences max"}],
  "included": ["strings"],
  "excluded": ["strings"],
  "maxPeople": 12,
  "minAge": 0,
  "timeSlots": ["08:00","10:00"],
  "ticketGroups": [{"label":"Adult","ageRange":"18+"}]
}

Rules:
- Do not invent prices or ratings.
- Clean day titles (move "Breakfast at hotel" into description when it leaked into title).
- Trim each itinerary description to website-friendly length.
- Pick destinations/provinces that match cities in the title and itinerary.`;

  const user = JSON.stringify({
    title: parsed.title,
    durationDays: parsed.durationDays,
    days: parsed.days,
    note: parsed.note,
    accommodations: parsed.accommodations,
    included: parsed.included,
    excluded: parsed.excluded,
    paymentTerms: parsed.paymentTerms,
    destinations: catalog.destinations,
    provinces: catalog.provinces,
  });

  try {
    const raw = await groqComplete(system, user);
    const json = extractJsonObject(raw);
    if (!json) return { enrichment: {}, enrichedByLlm: false };
    return { enrichment: json as LlmEnrichment, enrichedByLlm: true };
  } catch {
    return { enrichment: {}, enrichedByLlm: false };
  }
}

function mergeDraft(
  parsed: ParsedTourPdfSections,
  enrichment: LlmEnrichment,
  catalog: { destinations: CatalogEntry[]; provinces: CatalogEntry[] },
  enrichedByLlm: boolean,
): TourPdfImportDraft {
  const warnings: string[] = [
    "Price not found in PDF — enter PKR/USD before publishing.",
    "Upload tour images before publishing.",
  ];
  if (!enrichedByLlm) {
    warnings.push(
      "LLM enrichment unavailable — review slug, description, and destinations.",
    );
  }

  const blob = [
    parsed.title,
    ...parsed.days.map((d) => `${d.title} ${d.description}`),
    parsed.accommodations ?? "",
  ].join(" ");

  const slug =
    (typeof enrichment.slug === "string" && enrichment.slug.trim()
      ? slugifyTourTitle(enrichment.slug)
      : "") || slugifyTourTitle(parsed.title);

  const types =
    filterTypes(enrichment.types).length > 0
      ? filterTypes(enrichment.types)
      : inferTourTypesFromText(blob);

  const destinationSlugs = filterSlugs(
    enrichment.destinationSlugs,
    catalog.destinations,
  );
  const provinceSlugs = filterSlugs(enrichment.provinceSlugs, catalog.provinces);

  const description =
    typeof enrichment.description === "string" && enrichment.description.trim()
      ? enrichment.description.trim()
      : buildFallbackDescription(parsed);

  const location =
    typeof enrichment.location === "string" && enrichment.location.trim()
      ? enrichment.location.trim()
      : parsed.title.replace(/^\d+\s+days?\s+trip\s+to\s+/i, "").trim();

  const highlights =
    Array.isArray(enrichment.highlights) && enrichment.highlights.length > 0
      ? enrichment.highlights
          .filter((h): h is string => typeof h === "string" && h.trim().length > 0)
          .slice(0, 10)
      : buildFallbackHighlights(parsed);

  const included =
    Array.isArray(enrichment.included) && enrichment.included.length > 0
      ? enrichment.included.filter((x): x is string => typeof x === "string")
      : parsed.included;

  const excluded =
    Array.isArray(enrichment.excluded) && enrichment.excluded.length > 0
      ? enrichment.excluded.filter((x): x is string => typeof x === "string")
      : parsed.excluded;

  const itinerary = normalizeItinerary(enrichment.itinerary, parsed.days);

  const tourTypeLabel =
    typeof enrichment.tourTypeLabel === "string" && enrichment.tourTypeLabel.trim()
      ? enrichment.tourTypeLabel.trim()
      : types.includes("culture")
        ? "Heritage & Culture tours"
        : types.includes("adventure")
          ? "Adventure tours"
          : "Private tours";

  return {
    title: parsed.title,
    slug,
    description,
    durationDays: parsed.durationDays,
    location,
    types,
    destinationSlugs,
    provinceSlugs,
    itinerary,
    highlights,
    included,
    excluded,
    tourTypeLabel,
    maxPeople:
      typeof enrichment.maxPeople === "number" ? enrichment.maxPeople : undefined,
    minAge: typeof enrichment.minAge === "number" ? enrichment.minAge : undefined,
    timeSlots: Array.isArray(enrichment.timeSlots)
      ? enrichment.timeSlots.filter((s): s is string => typeof s === "string")
      : ["08:00", "10:00", "12:00"],
    ticketGroups: Array.isArray(enrichment.ticketGroups)
      ? enrichment.ticketGroups
          .filter(
            (g): g is { label: string; ageRange?: string } =>
              Boolean(g && typeof g === "object" && typeof (g as { label?: string }).label === "string"),
          )
          .map((g) => ({
            label: g.label,
            ageRange: typeof g.ageRange === "string" ? g.ageRange : undefined,
          }))
      : [
          { label: "Adult", ageRange: "18+" },
          { label: "Youth", ageRange: "13-17" },
          { label: "Children", ageRange: "0-12" },
        ],
    warnings,
    enrichedByLlm,
  };
}

export const parseTourPdf = action({
  args: {
    sessionToken: v.string(),
    /** Plain text extracted from the PDF in the browser. */
    pdfText: v.string(),
  },
  handler: async (ctx, { sessionToken, pdfText }) => {
    console.log("[parseTourPdf] start, pdfText length:", pdfText.length);

    const ok = await ctx.runQuery(internal.auth.isAdminSession, { sessionToken });
    if (!ok) {
      console.log("[parseTourPdf] unauthorized session");
      throw new Error("Unauthorized");
    }

    const trimmed = pdfText.trim();
    if (!trimmed) throw new Error("PDF text is empty");
    if (trimmed.length > 120_000) {
      throw new Error("PDF text is too large to parse");
    }

    let parsed: ParsedTourPdfSections;
    try {
      parsed = parseTourPdfTemplate(trimmed);
    } catch (parseErr) {
      console.error("[parseTourPdf] template parse failed:", parseErr);
      throw parseErr;
    }
    console.log("[parseTourPdf] parsed title:", parsed.title, "days:", parsed.days.length);
    const catalog = await ctx.runQuery(
      internal.tourPdfImportCatalog.listCatalogForPdfImport,
      {},
    );
    const { enrichment, enrichedByLlm } = await enrichWithLlm(parsed, catalog);
    console.log("[parseTourPdf] LLM enriched:", enrichedByLlm);

    const draft = mergeDraft(parsed, enrichment, catalog, enrichedByLlm);
    console.log("[parseTourPdf] draft slug:", draft.slug);

    await ctx.runMutation(internal.aiRequests.persist, {
      userId: undefined,
      input: parsed.title.slice(0, 500),
      output: JSON.stringify({
        slug: draft.slug,
        durationDays: draft.durationDays,
        enrichedByLlm,
      }),
      type: "parseTourPdf",
    });

    return draft;
  },
});
