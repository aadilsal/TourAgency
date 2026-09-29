import { api } from "@convex/_generated/api";
import { BUSINESS, BUSINESS_SAME_AS, formatBusinessAddress } from "@/config/business";
import { getConvexServer } from "@/lib/convex-server";
import { getSiteUrl } from "@/lib/site";

/**
 * /llms.txt — a plain-text summary of the business for AI assistants and
 * answer engines (llms.txt convention). Built from the same business config and
 * live tour catalogue as the site, so it never drifts from what visitors see.
 * Google says it does not use this file; other assistants may, so it is a cheap
 * extra rather than a ranking lever.
 */
export const revalidate = 3600;

type TourRow = {
  slug: string;
  title: string;
  location?: string;
  durationDays?: number;
  priceUsd?: number;
};

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

export async function GET() {
  const base = getSiteUrl();

  let tours: TourRow[] = [];
  try {
    tours = (await getConvexServer().query(api.tours.listActiveToursForExplore, {})) as TourRow[];
  } catch {
    tours = []; // Convex unavailable (build/CI): the static sections still render.
  }

  const tourLines = tours
    .filter((t) => t.slug && t.title)
    .slice(0, 60)
    .map((t) => {
      const facts = [
        t.location ? oneLine(t.location) : null,
        t.durationDays && t.durationDays > 0 ? `${t.durationDays} days` : null,
        typeof t.priceUsd === "number" && t.priceUsd > 0 ? `from USD ${t.priceUsd}` : null,
      ].filter(Boolean);
      return `- [${oneLine(t.title)}](${base}/tours/${t.slug})${facts.length ? `: ${facts.join(", ")}` : ""}`;
    });

  const body = [
    `# ${BUSINESS.name} (Junket Tours)`,
    "",
    `> ${BUSINESS.description}`,
    "",
    "## Facts",
    `- Business type: licensed tour operator and travel agency, ${BUSINESS.address.addressLocality}, ${BUSINESS.address.countryName}`,
    `- Address: ${formatBusinessAddress()}`,
    `- Languages: ${BUSINESS.languages.join(", ")}`,
    "- Prices: shown in USD; enquiries and bookings are handled by the team (no online card payment)",
    `- Phone / WhatsApp: ${BUSINESS.phoneDisplay}`,
    `- Email: ${BUSINESS.email}`,
    `- Website: ${base}`,
    "",
    "## Main pages",
    `- [All Pakistan tours](${base}/tours): guided heritage, culture and northern-valley tours`,
    `- [Destinations](${base}/destinations): Hunza, Skardu, Swat, Lahore and more`,
    `- [Travel guides by province](${base}/guides)`,
    `- [Pakistan tourist visa guide](${base}/pakistan-tourist-visa-guide)`,
    `- [Visa invitation letters](${base}/visa-invitation)`,
    `- [Is Pakistan safe for tourists?](${base}/is-pakistan-safe-for-tourists)`,
    `- [Best time to visit Pakistan](${base}/best-time-to-visit-pakistan)`,
    `- [Hunza vs Skardu](${base}/hunza-vs-skardu)`,
    `- [Hunza tour operator](${base}/hunza-tour-operator)`,
    `- [Travel blog](${base}/blog)`,
    `- [About us and FAQs](${base}/about)`,
    `- [Contact / plan a trip](${base}/contact)`,
    "",
    ...(tourLines.length ? ["## Tours", ...tourLines, ""] : []),
    "## Elsewhere",
    ...BUSINESS_SAME_AS.map((u) => `- ${u}`),
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
