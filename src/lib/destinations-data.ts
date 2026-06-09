/** Shared destination catalog for /destinations index and /destinations/[slug] guides. */

export const DESTINATION_SLUGS = [
  "lahore",
  "multan",
  "taxila",
  "chitral",
  "hunza",
  "skardu",
  "swat",
  "naran",
] as const;
export type DestinationSlug = (typeof DESTINATION_SLUGS)[number];

/** Culture-first slugs for heritage-focused metadata titles. */
export const CULTURE_DESTINATION_SLUGS = [
  "lahore",
  "multan",
  "taxila",
  "chitral",
] as const;

/** Curated homepage grid — culture anchors + northern touch. */
export const HOMEPAGE_DESTINATION_SLUGS = [
  "lahore",
  "taxila",
  "hunza",
  "swat",
] as const;

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
    slug: "lahore",
    name: "Lahore",
    line: "Mughal heartland & Walled City.",
    match: "lahore",
    extraLocationTerms: ["walled city", "badshahi", "shalimar", "fort road"],
  },
  {
    slug: "multan",
    name: "Multan",
    line: "Shrines, tilework & Sufi heritage.",
    match: "multan",
    extraLocationTerms: ["shrines", "ghanta ghar"],
  },
  {
    slug: "taxila",
    name: "Taxila",
    line: "Gandhara archaeology & museums.",
    match: "taxila",
    extraLocationTerms: ["gandhara", "museum"],
  },
  {
    slug: "chitral",
    name: "Chitral",
    line: "Kalash valleys & living traditions.",
    match: "chitral",
    extraLocationTerms: ["kalash", "bumburet", "runder"],
  },
  {
    slug: "hunza",
    name: "Hunza",
    line: "Ancient forts & Karakoram culture.",
    match: "hunza",
    extraLocationTerms: ["karimabad", "nagar", "aliabad", "eagle", "baltit", "altit"],
  },
  {
    slug: "skardu",
    name: "Skardu",
    line: "Royal forts, Silk Route & lakes.",
    match: "skardu",
    extraLocationTerms: ["shigar", "kachura", "deosai", "khaplu"],
  },
  {
    slug: "swat",
    name: "Swat",
    line: "Gandhara heritage & emerald valleys.",
    match: "swat",
    extraLocationTerms: ["mingora", "malam jabba", "kalam", "buddhist"],
  },
  {
    slug: "naran",
    name: "Naran",
    line: "Lake legends & highland culture.",
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

export const DESTINATION_DETAILS: Record<DestinationSlug, DestinationDetail> = {
  lahore: {
    slug: "lahore",
    name: "Lahore",
    line: "Mughal heartland & Walled City.",
    match: "lahore",
    extraLocationTerms: ["walled city", "badshahi", "shalimar", "fort road"],
    heroImage:
      "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=2000&q=80",
    description:
      "Lahore is Pakistan's cultural capital — Mughal masterpieces at Badshahi Mosque and Lahore Fort, labyrinthine Walled City lanes, and food streets that define Punjabi hospitality.",
    bestTime:
      "October–March for comfortable walking tours; spring (Feb–Mar) for festivals and mild weather.",
    tips: [
      "Start early at Lahore Fort before crowds build.",
      "Wear modest dress for mosque and shrine visits.",
      "Book a guided Walled City walk for hidden havelis and food stops.",
    ],
    costEstimate:
      "Weekend heritage packages often start PKR 25k–45k per person; private guides and boutique stays push toward PKR 60k–90k+.",
    bullets: [
      "Pair Badshahi Mosque with an old-city food trail.",
      "Add Shalimar Gardens or Wagah border for a longer Punjab circuit.",
    ],
  },
  multan: {
    slug: "multan",
    name: "Multan",
    line: "Shrines, tilework & Sufi heritage.",
    match: "multan",
    extraLocationTerms: ["shrines", "ghanta ghar"],
    heroImage:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=2000&q=80",
    description:
      "Multan — the City of Saints — blends blue-tile shrines, Sufi traditions, and centuries of craft heritage in a distinctly warm, spiritual south-Punjab atmosphere.",
    bestTime:
      "November–February for pleasant daytime walks; avoid peak summer heat for extended outdoor touring.",
    tips: [
      "Dress modestly at shrines and remove shoes where required.",
      "Visit early morning for shrine atmosphere and softer light.",
      "Combine with Lahore for a full Punjab heritage loop.",
    ],
    costEstimate:
      "Short Multan circuits often range PKR 20k–40k per person; multi-day Punjab heritage packages scale with transport and hotel tier.",
    bullets: [
      "Focus on shrine architecture and old-city bazaars.",
      "Pair with Lahore for Mughal + Sufi contrast.",
    ],
  },
  taxila: {
    slug: "taxila",
    name: "Taxila",
    line: "Gandhara archaeology & museums.",
    match: "taxila",
    extraLocationTerms: ["gandhara", "museum"],
    heroImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80",
    description:
      "Taxila preserves Gandhara civilization — Buddhist stupas, archaeological ruins, and museum collections just outside Islamabad, ideal for history-first day trips.",
    bestTime:
      "October–April for comfortable site walks; mornings are best before heat builds.",
    tips: [
      "Hire a licensed guide to interpret archaeological sites.",
      "Combine Taxila Museum with Jaulian or Sirkap ruins.",
      "Pair with Swat for a longer Buddhist heritage trail.",
    ],
    costEstimate:
      "Day trips from Islamabad often start PKR 15k–30k per person; private transport and guide push toward PKR 35k–55k.",
    bullets: [
      "Ideal as a day trip from Islamabad or Rawalpindi.",
      "Combine with Swat for Gandhara-focused itineraries.",
    ],
  },
  chitral: {
    slug: "chitral",
    name: "Chitral",
    line: "Kalash valleys & living traditions.",
    match: "chitral",
    extraLocationTerms: ["kalash", "bumburet", "runder"],
    heroImage:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2000&q=80",
    description:
      "Chitral opens onto the Kalash valleys — one of Pakistan's most distinctive living cultures, with valley drives, local festivals, and an off-the-beaten-path heritage feel.",
    bestTime:
      "May–October for valley access; Kalash festivals (spring/autumn) need advance planning.",
    tips: [
      "Respect Kalash customs — ask before photographing people or rituals.",
      "Buffer extra days for road conditions and weather.",
      "Pack layers — valley nights cool even in summer.",
    ],
    costEstimate:
      "Chitral–Kalash packages often range PKR 80k–150k+ per person depending on duration and transport.",
    bullets: [
      "Culture-first itinerary with Chitral town and Kalash villages.",
      "Combine with Swat or Hunza for a longer north circuit.",
    ],
  },
  hunza: {
    slug: "hunza",
    name: "Hunza",
    line: "Ancient forts & Karakoram culture.",
    match: "hunza",
    extraLocationTerms: ["karimabad", "nagar", "aliabad", "eagle", "baltit", "altit"],
    heroImage:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80",
    description:
      "Hunza Valley pairs 700-year-old Baltit and Altit forts with terraced villages, apricot culture, and unobstructed Karakoram views — northern heritage at its finest.",
    bestTime:
      "Late April through October for stable roads, clear skies, and open high passes. Spring blossoms and autumn colors are peak photography windows.",
    tips: [
      "Start with fort visits in Karimabad before longer hikes.",
      "Carry layers — mountain weather shifts fast even in summer.",
      "Book transport early for Naltar and Khunjerab add-ons.",
    ],
    costEstimate:
      "Budget trips often start around PKR 45k–70k per person for shorter road packages; mid-range with private jeep and better stays typically lands PKR 90k–150k+ depending on group size and inclusions.",
    bullets: [
      "Lead with Baltit & Altit forts, then Eagle's Nest viewpoints.",
      "Pair with Khunjerab Pass or Naltar for a longer northern heritage loop.",
    ],
  },
  skardu: {
    slug: "skardu",
    name: "Skardu",
    line: "Royal forts, Silk Route & lakes.",
    match: "skardu",
    extraLocationTerms: ["shigar", "kachura", "deosai", "khaplu"],
    heroImage:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=80",
    description:
      "Skardu blends Silk Route heritage — Shigar Fort, Khaplu Palace — with surreal lakes and Karakoram scenery at the heart of Baltistan.",
    bestTime:
      "May–October for road access to lakes and Deosai; always confirm flight and road status for shoulder seasons.",
    tips: [
      "Buffer 1–2 days for domestic flight delays from Islamabad.",
      "Shigar Fort deserves a full morning — interiors and village lanes.",
      "Jeep safaris to remote viewpoints need local permits — we handle logistics.",
    ],
    costEstimate:
      "Road-and-lake itineraries often range PKR 55k–95k per person on shared packages; private jeep + upgraded lodging pushes toward PKR 120k–200k+.",
    bullets: [
      "Heritage day at Shigar Fort, then lake hopping when roads are open.",
      "Add Deosai for wildlife and wide high-altitude plains.",
    ],
  },
  swat: {
    slug: "swat",
    name: "Swat",
    line: "Gandhara heritage & emerald valleys.",
    match: "swat",
    extraLocationTerms: ["mingora", "malam jabba", "kalam", "buddhist"],
    heroImage:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80",
    description:
      "Swat leads with Buddhist Gandhara heritage and archaeological sites, then opens into greener alpine valleys — often easier logistics than far-north circuits.",
    bestTime:
      "March–November for valley touring; Malam Jabba ski season runs winter months with different packing needs.",
    tips: [
      "Prioritize Buddhist heritage stops in Mingora before upper-valley scenery.",
      "Check monsoon advisories for riverside routes in July–August.",
    ],
    costEstimate:
      "Shorter Swat circuits can start near PKR 35k–60k per person; extended luxury-stay packages scale with transport choice.",
    bullets: [
      "Gandhara sites plus Malam Jabba and upper valley viewpoints.",
      "Great heritage extension from Taxila or Islamabad.",
    ],
  },
  naran: {
    slug: "naran",
    name: "Naran",
    line: "Lake legends & highland culture.",
    match: "naran",
    extraLocationTerms: ["kaghan", "saif", "babusar", "shogran"],
    heroImage:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80",
    description:
      "Naran and Kaghan carry Mughal-era lake legends around Saif-ul-Malook, highland culture, and the Babusar route linking toward Gilgit-Baltistan.",
    bestTime:
      "June–September for Babusar access; winter closures apply — always verify pass status before locking dates.",
    tips: [
      "Lake Saif-ul-Malook jeeps fill fast — depart early morning.",
      "Pair with Hunza by road when Babusar is open for a longer loop.",
    ],
    costEstimate:
      "Weekend Naran–Shogran packages often fall PKR 25k–55k per person depending on transport class and hotel tier.",
    bullets: [
      "Saif-ul-Malook folklore and highland scenery in one circuit.",
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

export function getHomepageDestinations(): DestinationDetail[] {
  return HOMEPAGE_DESTINATION_SLUGS.map(
    (slug) => DESTINATION_DETAILS[slug],
  );
}

export function isCultureDestinationSlug(slug: string): boolean {
  return (CULTURE_DESTINATION_SLUGS as readonly string[]).includes(slug);
}
