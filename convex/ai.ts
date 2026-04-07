"use node";

import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { api, internal } from "./_generated/api.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type TourForAi = {
  title: string;
  slug: string;
  location: string;
  durationDays: number;
  price: number;
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
          `- ${t.title} (${t.location}, ${t.durationDays}d, PKR ${t.price}): ${t.description.slice(0, 200)}…`,
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
          `- slug: ${t.slug} | ${t.title} | ${t.location} | ${t.durationDays}d | PKR ${t.price} | ${t.description.slice(0, 160)}…`,
      )
      .join("\n");

    const system = `You are JunketTours' AI travel concierge for northern Pakistan (Hunza, Skardu, Swat, Naran, etc.).

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

export const submitCustomPlanRequest = action({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    summary: v.string(),
    proposal: v.string(),
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
    await ctx.runMutation(internal.customItineraries.createRequest, {
      userId,
      name: args.name.trim(),
      phone: args.phone.trim(),
      email: args.email?.trim() || undefined,
      summary: args.summary.slice(0, 2000),
      proposal: args.proposal.slice(0, 12000),
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
    return { ok: true as const };
  },
});
