/** Shared destination catalog for /destinations index and /destinations/[slug] guides. */

export const DESTINATION_SLUGS = ["hunza", "skardu", "swat", "naran"] as const;
export type DestinationSlug = (typeof DESTINATION_SLUGS)[number];

export type DestinationIndexEntry = {
  slug: DestinationSlug;
  name: string;
  line: string;
  /** Primary substring match on `tour.location` (case-insensitive). */
  match: string;
  /** Optional extra substrings — tour matches if location includes any of these or `match`. */
  extraLocationTerms?: string[];
};

/** Cards on /destinations — order is display order. */
export const DESTINATIONS_INDEX: DestinationIndexEntry[] = [
  {
    slug: "hunza",
    name: "Hunza",
    line: "Karakoram classics and fort towns.",
    match: "hunza",
    extraLocationTerms: ["karimabad", "nagar", "aliabad", "eagle"],
  },
  {
    slug: "skardu",
    name: "Skardu",
    line: "Lakes, Deosai, and high peaks.",
    match: "skardu",
    extraLocationTerms: ["shigar", "kachura", "deosai", "khaplu"],
  },
  {
    slug: "swat",
    name: "Swat",
    line: "Green valleys and heritage.",
    match: "swat",
    extraLocationTerms: ["mingora", "malam jabba", "kalam"],
  },
  {
    slug: "naran",
    name: "Naran",
    line: "Saif-ul-Malook and Babusar.",
    match: "naran",
    extraLocationTerms: ["kaghan", "saif", "babusar", "shogran"],
  },
];

export type DestinationDetail = DestinationIndexEntry & {
  heroImage: string;
  description: string;
  bestTime: string;
  tips: string[];
  costEstimate: string;
  bullets: string[];
};

export const DESTINATION_DETAILS: Record<DestinationSlug, DestinationDetail> =
  {
    hunza: {
      slug: "hunza",
      name: "Hunza",
      line: "Karakoram classics and fort towns.",
      match: "hunza",
      extraLocationTerms: ["karimabad", "nagar", "aliabad", "eagle"],
      heroImage:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80",
      description:
        "Hunza Valley is the crown jewel of the Karakoram Highway — terraced villages, 700-year-old Baltit Fort, and unobstructed views of Rakaposhi and Ultar Sar.",
      bestTime:
        "Late April through October for stable roads, clear skies, and open high passes. Spring blossoms and autumn colors are peak photography windows.",
      tips: [
        "Acclimatize in Gilgit or Karimabad before aggressive hikes.",
        "Carry layers — mountain weather shifts fast even in summer.",
        "Book transport early for Naltar and Khunjerab add-ons.",
      ],
      costEstimate:
        "Budget trips often start around PKR 45k–70k per person for shorter road packages; mid-range with private jeep and better stays typically lands PKR 90k–150k+ depending on group size and inclusions.",
      bullets: [
        "Mix culture stops (Karimabad, Altit) with day hikes to Eagle’s Nest.",
        "Pair with Khunjerab Pass or Naltar for a longer northern loop.",
      ],
    },
    skardu: {
      slug: "skardu",
      name: "Skardu",
      line: "Lakes, Deosai, and high peaks.",
      match: "skardu",
      extraLocationTerms: ["shigar", "kachura", "deosai", "khaplu"],
      heroImage:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=80",
      description:
        "Skardu sits at the heart of Baltistan — the launch point for Shangrila, Upper Kachura Lake, Deosai Plains, and serious trekking toward some of the world’s highest peaks.",
      bestTime:
        "May–October for road access to lakes and Deosai; always confirm flight and road status for shoulder seasons.",
      tips: [
        "Buffer 1–2 days for domestic flight delays from Islamabad.",
        "Deosai requires a full day — start early and carry wind protection.",
        "Jeep safaris to remote viewpoints need local permits — we handle logistics.",
      ],
      costEstimate:
        "Road-and-lake itineraries often range PKR 55k–95k per person on shared packages; private jeep + upgraded lodging pushes toward PKR 120k–200k+.",
      bullets: [
        "Ideal for lake hopping and jeep safaris when roads are open.",
        "Add Deosai for wildlife and wide high-altitude plains.",
      ],
    },
    swat: {
      slug: "swat",
      name: "Swat",
      line: "Green valleys and heritage.",
      match: "swat",
      extraLocationTerms: ["mingora", "malam jabba", "kalam"],
      heroImage:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80",
      description:
        "Swat offers greener alpine scenery, river valleys, and Buddhist heritage — often easier logistics than far-north circuits while still feeling remote.",
      bestTime:
        "March–November for valley touring; Malam Jabba ski season runs winter months with different packing needs.",
      tips: [
        "Combine cultural stops in Mingora with upper-valley viewpoints.",
        "Check monsoon advisories for riverside routes in July–August.",
      ],
      costEstimate:
        "Shorter Swat circuits can start near PKR 35k–60k per person; extended luxury-stay packages scale with transport choice.",
      bullets: [
        "Great for shorter trips from major cities when time is tight.",
        "Combine Malam Jabba, Bahrain, and upper valley viewpoints.",
      ],
    },
    naran: {
      slug: "naran",
      name: "Naran",
      line: "Saif-ul-Malook and Babusar.",
      match: "naran",
      extraLocationTerms: ["kaghan", "saif", "babusar", "shogran"],
      heroImage:
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80",
      description:
        "Naran and Kaghan are classic road-trip territory — Saif-ul-Malook, Lulusar Lake, and the Babusar Pass link toward Gilgit-Baltistan.",
      bestTime:
        "June–September for Babusar access; winter closures apply — always verify pass status before locking dates.",
      tips: [
        "Lake Saif-ul-Malook jeeps fill fast — depart early morning.",
        "Pair with Hunza by road when Babusar is open for a longer loop.",
      ],
      costEstimate:
        "Weekend Naran–Shogran packages often fall PKR 25k–55k per person depending on transport class and hotel tier.",
      bullets: [
        "Peak season is summer; Babusar may close outside favorable months.",
        "Works well as a stepping stone toward Hunza or Skardu.",
      ],
    },
  };

export function tourMatchesDestination(
  tourLocation: string,
  dest: Pick<DestinationIndexEntry, "match" | "extraLocationTerms">,
): boolean {
  const l = tourLocation.toLowerCase();
  if (l.includes(dest.match.toLowerCase())) return true;
  return (
    dest.extraLocationTerms?.some((t) => l.includes(t.toLowerCase())) ?? false
  );
}

export function getDestinationDetail(slug: string): DestinationDetail | null {
  if (!DESTINATION_SLUGS.includes(slug as DestinationSlug)) return null;
  return DESTINATION_DETAILS[slug as DestinationSlug];
}
