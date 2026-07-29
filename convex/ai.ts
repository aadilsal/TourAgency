"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server.js";
import { api, internal } from "./_generated/api.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type TourForAi = {
  title: string;
  slug: string;
  types: string[];
  location: string;
  durationDays: number;
  pricePkr: number;
  priceUsd: number | null;
  description: string;
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
      temperature: 0.4,
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

/** Strips currency amounts so a generated line can never read as a quote. */
function stripMoney(text: string): string {
  return text
    .replace(/\b(?:PKR|Rs\.?|USD|INR)\s*[\d,.]+\s*(?:k|thousand|lakh|million)?/gi, "")
    .replace(/\$\s*[\d,.]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Drafts the day-by-day route outline for an itinerary. Route narrative only:
 * no hotel names, no prices — those are commercial commitments the admin must
 * enter. Returns rows for review; it does not write to the itinerary.
 */
export const draftItineraryDays = action({
  args: {
    sessionToken: v.string(),
    itineraryId: v.id("itineraries"),
  },
  handler: async (ctx, { sessionToken, itineraryId }) => {
    const session = await ctx.runQuery(api.auth.validateSession, { token: sessionToken });
    if (!session) throw new Error("Not authenticated");
    if (session.role !== "admin" && session.role !== "super_admin") {
      throw new Error("Admin access required");
    }

    const itin = (await ctx.runQuery(api.itineraries.getForAdmin, {
      sessionToken,
      itineraryId,
    })) as {
      title: string;
      days: number;
      pickupDropoff?: string;
      startDate?: string;
      endDate?: string;
    } | null;
    if (!itin) throw new Error("Itinerary not found");

    const days = Math.max(1, Math.min(60, Math.floor(itin.days || 1)));
    const system = `You draft day-by-day route outlines for JunketTours, a Pakistan tour operator.
Reply with STRICT JSON only, no prose, in this exact shape:
{"days":[{"dayNumber":1,"title":"...","detail":"...","overnight":"..."}]}
Rules:
- Return exactly ${days} objects, dayNumber 1 to ${days} in order.
- "title": a short route label of 3 to 8 words, e.g. "Islamabad to Naran".
- "detail": 1-2 sentences covering the drive, stops and sightseeing for that day. Max 300 characters.
- "overnight": the town, city or valley of the night stay ONLY. Never name a hotel, motel, resort or guesthouse.
- Never mention prices, costs, currency amounts, package tiers or vehicle rates.
- Keep the routing geographically sensible and conventional for Pakistan travel; do not invent places that are not on the route.
- Use the real travel day pattern: arrival/drive days, sightseeing days, and a final departure day.`;

    const userPrompt = [
      `Trip title: ${itin.title || "Untitled"}`,
      `Total days: ${days}`,
      itin.pickupDropoff?.trim() ? `Pickup / drop-off: ${itin.pickupDropoff.trim()}` : "",
      itin.startDate && itin.endDate ? `Travel dates: ${itin.startDate} to ${itin.endDate}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await groqComplete(system, userPrompt);
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd <= jsonStart) {
      throw new Error("The assistant returned an unreadable draft. Try again.");
    }

    let parsed: { days?: Array<Record<string, unknown>> };
    try {
      parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as typeof parsed;
    } catch {
      throw new Error("The assistant returned an unreadable draft. Try again.");
    }

    const rows = Array.isArray(parsed.days) ? parsed.days : [];
    const drafted = Array.from({ length: days }, (_, i) => {
      const row = rows[i] ?? {};
      const overnight = stripMoney(String(row.overnight ?? "")).slice(0, 120);
      return {
        dayNumber: i + 1,
        title: stripMoney(String(row.title ?? "")).slice(0, 120),
        detail: stripMoney(String(row.detail ?? "")).slice(0, 400),
        overnight: overnight || undefined,
      };
    });

    await ctx.runMutation(internal.aiRequests.persist, {
      userId: session.userId,
      input: userPrompt,
      output: JSON.stringify(drafted),
      type: "draftItineraryDays",
    });

    return { days: drafted };
  },
});

export const generateTrip = action({
  args: {
    query: v.string(),
    budget: v.optional(v.number()),
    days: v.optional(v.number()),
    departureCity: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tours = (await ctx.runQuery(internal.tours.listToursForAi, {})) as TourForAi[];
    const catalog = tours
      .map(
        (t: TourForAi) =>
          `- ${t.title} (${t.location}, ${t.durationDays}d, PKR ${t.pricePkr}): ${t.description.slice(0, 200)}…`,
      )
      .join("\n");
    const system = `You are a Pakistan adventure travel planner for JunketTours. 
Use ONLY these tours when recommending; output strict JSON with keys: summary (string), recommendedSlugs (string[]), daysSuggested (number), tips (string[]).
Tours:\n${catalog}`;
    const userPrompt = `Trip request: ${args.query}. Budget PKR: ${args.budget ?? "unspecified"}. Days: ${args.days ?? "unspecified"}. Departure city: ${args.departureCity?.trim() || "unspecified"}.`;
    const raw = await groqComplete(system, userPrompt);
    let output = raw;
    try {
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        output = raw.slice(jsonStart, jsonEnd + 1);
      }
    } catch {
      /* keep raw */
    }
    const session = args.sessionToken
      ? await ctx.runQuery(api.auth.validateSession, { token: args.sessionToken })
      : null;
    const userId = session?.userId;
    await ctx.runMutation(internal.aiRequests.persist, {
      userId,
      input: args.query,
      output,
      type: "generateTrip",
    });
    await ctx.runMutation(internal.leads.createLeadFromAi, {
      name: "AI planner",
      phone: "0000000000",
      message: args.query.slice(0, 500),
    });
    return { output };
  },
});

export const chatAssistant = action({
  args: { message: v.string(), sessionToken: v.optional(v.string()) },
  handler: async (ctx, { message, sessionToken }) => {
    const tours = (await ctx.runQuery(internal.tours.listToursForAi, {})) as TourForAi[];
    const catalog = tours
      .map((t: TourForAi) => `- ${t.title} (${t.slug})`)
      .join("\n");
    const system = `You help users choose JunketTours packages in Pakistan. Available tours (slug list):\n${catalog}\nBe concise; suggest 1–2 slugs when relevant.`;
    const raw = await groqComplete(system, message);
    const session = sessionToken
      ? await ctx.runQuery(api.auth.validateSession, { token: sessionToken })
      : null;
    const userId = session?.userId;
    await ctx.runMutation(internal.aiRequests.persist, {
      userId,
      input: message,
      output: raw,
      type: "chatAssistant",
    });
    return { reply: raw };
  },
});

function parsePlannerJson(raw: string): {
  reply: string;
  recommendedSlugs: string[];
  itinerary: Array<{ day: number; title: string; detail: string }>;
  proposesCustomPlan: boolean;
  customPlanDraft: string;
} {
  const defaults = {
    reply: raw.slice(0, 2000),
    recommendedSlugs: [] as string[],
    itinerary: [] as Array<{ day: number; title: string; detail: string }>,
    proposesCustomPlan: false,
    customPlanDraft: "",
  };
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return defaults;
    const j = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    return {
      reply: typeof j.reply === "string" ? j.reply : defaults.reply,
      recommendedSlugs: Array.isArray(j.recommendedSlugs)
        ? (j.recommendedSlugs as string[]).filter((s) => typeof s === "string")
        : [],
      itinerary: Array.isArray(j.itinerary)
        ? (j.itinerary as unknown[])
            .map((row) => {
              const r = row as Record<string, unknown>;
              return {
                day: typeof r.day === "number" ? r.day : Number(r.day) || 0,
                title: typeof r.title === "string" ? r.title : "",
                detail: typeof r.detail === "string" ? r.detail : "",
              };
            })
            .filter((x) => x.day > 0)
        : [],
      proposesCustomPlan: Boolean(j.proposesCustomPlan),
      customPlanDraft:
        typeof j.customPlanDraft === "string" ? j.customPlanDraft : "",
    };
  } catch {
    return defaults;
  }
}

/** Chat-style planner: replies + structured itinerary + catalog slugs; can flag custom quote. */
export const plannerChat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, { messages, sessionToken }) => {
    const tours = (await ctx.runQuery(internal.tours.listToursForAi, {})) as TourForAi[];
    const catalog = tours
      .map(
        (t: TourForAi) =>
          `- slug: ${t.slug} | ${t.title} | ${t.location} | ${t.durationDays}d | PKR ${t.pricePkr} | ${t.description.slice(0, 160)}…`,
      )
      .join("\n");

    const system = `You are JunketTours' AI travel concierge.

PRIMARY focus: culture and history across Pakistan — heritage cities (Lahore, Multan), ancient sites (Taxila, Swat Buddhist trail), living traditions (Kalash, Hunza forts).

SECONDARY strength: northern heritage — Hunza & Skardu forts, valley culture, Karakoram scenery. When users ask about mountains or the north, frame it through heritage (forts, bazaars, local traditions) not adventure-only.

PROVINCE GUIDES: For broad questions ("what to see in Punjab", "Sindh heritage", "plan KPK"), suggest our province guide pages at /guides/[slug] — sindh, balochistan, punjab, islamabad, kpk, gilgit-baltistan, azad-kashmir — before drilling into city destinations or tours.

When intent is vague, suggest a culture-first itinerary that can include a northern extension.

TOUR CATALOG — only recommend tours using these exact slugs when they fit the user. Do not invent slugs.
${catalog}

Output rules:
- Respond with a single JSON object only. No markdown code fences. No text before or after the JSON.
- Shape: {"reply":"string (friendly, concise, helpful)","recommendedSlugs":["slug1"],"itinerary":[{"day":1,"title":"short","detail":"what happens"}],"proposesCustomPlan":false,"customPlanDraft":""}
- recommendedSlugs: 0–3 slugs from the catalog that best match.
- itinerary: day-by-day plan; align days with recommended tour durations when possible. Empty array if the user only asked a simple FAQ.
- If the user needs a route, budget, or inclusions that cannot be met by combining listed tours, set proposesCustomPlan true and put a detailed day-by-day draft in customPlanDraft for the operations team to price. Still give a helpful reply summarizing next steps.

Be accurate, warm, and conversion-focused.`;

    const recent = messages.slice(-24);
    const transcript = recent
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const raw = await groqComplete(system, transcript);
    const parsed = parsePlannerJson(raw);

    const session = sessionToken
      ? await ctx.runQuery(api.auth.validateSession, { token: sessionToken })
      : null;
    const userId = session?.userId;

    await ctx.runMutation(internal.aiRequests.persist, {
      userId,
      input: transcript.slice(-4000),
      output: JSON.stringify(parsed),
      type: "plannerChat",
    });

    return { raw, ...parsed };
  },
});

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

function stringArray(v: unknown, max: number): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, max);
  return out.length ? out : undefined;
}

/**
 * Fills an auto-generated destination with real guide content and links the
 * correct province. Scheduled from `destinations.syncFromTour` when a tour
 * introduces a region we don't have yet (requirement: dynamic provinces/destinations).
 */
export const enrichAutoDestination = internalAction({
  args: { destinationId: v.id("destinations"), tourId: v.id("tours") },
  handler: async (ctx, { destinationId, tourId }) => {
    if (!process.env.GROQ_API_KEY) return;

    const data = await ctx.runQuery(internal.destinations.getAutoEnrichContext, {
      destinationId,
      tourId,
    });
    if (!data || !data.destination.autoGenerated) return;

    const provinceSlugs = data.provinces.map((p) => p.slug);
    const system = `You determine the geography for a Pakistan tour and write concise, factual destination-guide content for JunketTours.
Return a SINGLE JSON object only. No markdown fences, no text around it.

Existing province slugs: ${provinceSlugs.join(", ") || "(none)"}

JSON shape:
{
  "name": "the proper primary destination name for this tour (e.g. 'Lahore', 'Hunza Valley', 'Swat') — a real place, not a multi-city label",
  "line": "one-line tagline for the region",
  "description": "2-3 factual sentences about the destination for travellers",
  "bestTime": "best months/season to visit",
  "costEstimate": "rough budget guidance in USD for international travellers",
  "tips": ["3-5 short practical tips"],
  "bullets": ["3-5 highlight bullets"],
  "matchTerms": ["lowercase alternative names / nearby cities for matching"],
  "provinceSlug": "the province slug this destination sits in — use an existing slug if it matches, otherwise a NEW lowercase-kebab slug",
  "provinceName": "the province's display name (only needed if provinceSlug is a new one)"
}

Rules:
- Be accurate about Pakistani geography; determine the actual province the destination sits in.
- Prefer an existing province slug when it fits; only invent a new slug for a genuinely new region.
- 'name' should be the single best real place name for this tour's main destination.
- Do not invent prices for specific tours; keep costEstimate as general guidance.`;

    const user = JSON.stringify({
      destination: data.destination,
      tour: data.tour,
      provinces: data.provinces,
    });

    let json: Record<string, unknown> | null;
    try {
      const raw = await groqComplete(system, user);
      json = extractJsonObject(raw);
    } catch {
      return;
    }
    if (!json) return;

    // Accept either an existing province slug or a new kebab-case one (which
    // applyAutoEnrichment will create + store).
    const rawProvinceSlug =
      typeof json.provinceSlug === "string"
        ? json.provinceSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        : "";
    const provinceSlug = rawProvinceSlug || undefined;

    await ctx.runMutation(internal.destinations.applyAutoEnrichment, {
      destinationId,
      tourId,
      name: typeof json.name === "string" ? json.name : undefined,
      line: typeof json.line === "string" ? json.line : undefined,
      description: typeof json.description === "string" ? json.description : undefined,
      bestTime: typeof json.bestTime === "string" ? json.bestTime : undefined,
      costEstimate: typeof json.costEstimate === "string" ? json.costEstimate : undefined,
      tips: stringArray(json.tips, 6),
      bullets: stringArray(json.bullets, 6),
      matchTerms: stringArray(json.matchTerms, 12),
      provinceSlug,
      provinceName: typeof json.provinceName === "string" ? json.provinceName : undefined,
    });
  },
});

export const submitCustomPlanRequest = action({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    summary: v.string(),
    proposal: v.string(),
    thread: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
        }),
      ),
    ),
    sessionToken: v.optional(v.string()),
    preferredStart: v.optional(v.string()),
    preferredEnd: v.optional(v.string()),
    adults: v.optional(v.number()),
    children: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = args.sessionToken
      ? await ctx.runQuery(api.auth.validateSession, { token: args.sessionToken })
      : null;
    const userId = session?.userId;
    const requestId = await ctx.runMutation(internal.customItineraries.createRequest, {
      userId,
      name: args.name.trim(),
      phone: args.phone.trim(),
      email: args.email.trim().toLowerCase(),
      summary: args.summary.slice(0, 2000),
      proposal: args.proposal.slice(0, 12000),
      thread: args.thread?.slice(0, 80),
      preferredStart: args.preferredStart?.trim() || undefined,
      preferredEnd: args.preferredEnd?.trim() || undefined,
      adults: args.adults,
      children: args.children,
    });
    await ctx.runMutation(internal.leads.createLeadFromAi, {
      name: args.name.trim(),
      phone: args.phone.trim(),
      message: `Custom itinerary: ${args.summary.slice(0, 500)}`,
    });
    await ctx.runAction(internal.email.sendCustomItineraryRequestNotification, {
      requestId,
    });
    return { ok: true as const };
  },
});
