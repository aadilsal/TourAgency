/**
 * City coordinates in the same SVG space as `public/maps/pakistan-provinces.svg`
 * (viewBox `0 0 866.66669 819.94934`, north = smaller y). These are hand-placed
 * relative to the province anchor points used by the scrolly map, so a derived
 * route reads geographically (south → north) on that stylised basemap.
 *
 * Used to turn a tour's free-text `location` + itinerary day titles into an
 * ordered list of map points that drive the animated route on the tour page.
 */

export type CityPoint = { key: string; name: string; x: number; y: number };

type CityDef = { name: string; x: number; y: number; aliases?: string[] };

const CITY_TABLE: CityDef[] = [
  // ── Gilgit-Baltistan (far north) ─────────────────────────────────────────
  { name: "Khunjerab Pass", x: 492, y: 104, aliases: ["khunjerab", "khunjrab", "khunjerab top"] },
  { name: "Passu", x: 480, y: 128, aliases: ["passu cones"] },
  { name: "Attabad Lake", x: 482, y: 140, aliases: ["attabad"] },
  { name: "Hunza", x: 476, y: 150, aliases: ["karimabad", "hunza valley", "aliabad"] },
  { name: "Nagar", x: 470, y: 154, aliases: ["nagar valley"] },
  { name: "Gilgit", x: 455, y: 182 },
  { name: "Naltar", x: 444, y: 176, aliases: ["naltar valley"] },
  { name: "Fairy Meadows", x: 452, y: 200, aliases: ["fairy meadow", "nanga parbat", "raikot"] },
  { name: "Skardu", x: 520, y: 176 },
  { name: "Shigar", x: 530, y: 166, aliases: ["shigar valley"] },
  { name: "Khaplu", x: 548, y: 178, aliases: ["khaplu valley"] },
  { name: "Deosai", x: 506, y: 202, aliases: ["deosai plains", "deosai national park"] },
  { name: "Astore", x: 482, y: 208, aliases: ["astore valley", "rama"] },
  // ── Chitral / upper KPK ──────────────────────────────────────────────────
  { name: "Chitral", x: 398, y: 188 },
  { name: "Kalash Valley", x: 384, y: 198, aliases: ["kalash", "bumburet", "rumbur"] },
  { name: "Mastuj", x: 420, y: 178 },
  // ── KPK north (Kaghan / Swat / Hazara) ───────────────────────────────────
  { name: "Kalam", x: 452, y: 232, aliases: ["kalam valley"] },
  { name: "Swat", x: 448, y: 252, aliases: ["mingora", "swat valley", "malam jabba", "bahrain"] },
  { name: "Naran", x: 498, y: 238 },
  { name: "Kaghan", x: 496, y: 250, aliases: ["kaghan valley"] },
  { name: "Shogran", x: 502, y: 262, aliases: ["siri paye", "siripaye"] },
  { name: "Babusar", x: 486, y: 222, aliases: ["babusar top", "babusar pass"] },
  { name: "Balakot", x: 500, y: 274 },
  { name: "Mansehra", x: 506, y: 288 },
  { name: "Abbottabad", x: 508, y: 302 },
  { name: "Peshawar", x: 430, y: 316 },
  // ── Azad Kashmir ─────────────────────────────────────────────────────────
  { name: "Muzaffarabad", x: 542, y: 312 },
  { name: "Neelum Valley", x: 560, y: 286, aliases: ["neelum", "keran", "sharda", "arang kel"] },
  { name: "Rawalakot", x: 560, y: 342, aliases: ["banjosa"] },
  // ── Islamabad region & Galiyat ───────────────────────────────────────────
  { name: "Nathia Gali", x: 514, y: 318, aliases: ["nathiagali", "galiyat", "ayubia"] },
  { name: "Murree", x: 522, y: 332 },
  { name: "Islamabad", x: 500, y: 350, aliases: ["rawalpindi", "isb", "islamabad rawalpindi"] },
  // ── Punjab ───────────────────────────────────────────────────────────────
  { name: "Lahore", x: 596, y: 402 },
  { name: "Faisalabad", x: 556, y: 428 },
  { name: "Multan", x: 504, y: 482 },
  { name: "Bahawalpur", x: 542, y: 502, aliases: ["cholistan"] },
  // ── Balochistan ──────────────────────────────────────────────────────────
  { name: "Quetta", x: 330, y: 470 },
  { name: "Ziarat", x: 352, y: 482 },
  { name: "Gwadar", x: 250, y: 642 },
  // ── Sindh ────────────────────────────────────────────────────────────────
  { name: "Sukkur", x: 452, y: 560 },
  { name: "Hyderabad", x: 430, y: 640 },
  { name: "Karachi", x: 402, y: 682 },
  // ── Region centroids (lowest priority fallbacks) ─────────────────────────
  { name: "Gilgit-Baltistan", x: 470, y: 165, aliases: ["gilgit baltistan"] },
  { name: "Kashmir", x: 560, y: 322, aliases: ["azad kashmir", "ajk"] },
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toKey(name: string): string {
  return norm(name).replace(/\s+/g, "-");
}

/** All (normalized alias → point) pairs, longest alias first for greedy matching. */
const ALIAS_INDEX: Array<{ alias: string; point: CityPoint }> = (() => {
  const out: Array<{ alias: string; point: CityPoint }> = [];
  for (const c of CITY_TABLE) {
    const point: CityPoint = { key: toKey(c.name), name: c.name, x: c.x, y: c.y };
    const aliases = [c.name, ...(c.aliases ?? [])];
    for (const a of aliases) {
      const n = norm(a);
      if (n) out.push({ alias: n, point });
    }
  }
  return out.sort((a, b) => b.alias.length - a.alias.length);
})();

const FILLER = new Set([
  "day",
  "arrive",
  "arrival",
  "depart",
  "departure",
  "drive",
  "travel",
  "transfer",
  "explore",
  "visit",
  "sightseeing",
  "overnight",
  "night",
  "stay",
  "return",
  "to",
  "via",
  "then",
  "and",
  "the",
]);

/** Split a free-text place phrase (day title or location) into candidate segments. */
function splitPlaces(raw: string): string[] {
  return raw
    .replace(/^\s*day\s*\d+\s*[:.\-]?\s*/i, "")
    .split(/\s*(?:-|–|—|→|\/|&|,|\bto\b|\bvia\b|\bthen\b)\s*/i)
    .map((s) => norm(s))
    .filter(Boolean);
}

/** Best matching city point for a single normalized segment, or null. */
function matchSegment(segment: string): CityPoint | null {
  if (!segment) return null;
  // Exact alias match wins.
  for (const { alias, point } of ALIAS_INDEX) {
    if (alias === segment) return point;
  }
  // Otherwise a distinctive (>=4 char) alias appearing as a whole word inside it.
  for (const { alias, point } of ALIAS_INDEX) {
    if (alias.length < 4) continue;
    const re = new RegExp(`(?:^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`);
    if (re.test(segment)) return point;
  }
  return null;
}

function matchSequence(segments: string[]): CityPoint[] {
  const stops: CityPoint[] = [];
  for (const seg of segments) {
    // A segment can still contain filler ("arrive islamabad") — matching handles it,
    // but skip pure-filler segments early for speed.
    const words = seg.split(" ");
    if (words.every((w) => FILLER.has(w))) continue;
    const point = matchSegment(seg);
    if (!point) continue;
    if (stops.length && stops[stops.length - 1]!.key === point.key) continue; // dedupe consecutive
    stops.push(point);
  }
  return stops;
}

/**
 * Derive an ordered list of route stops for a tour from its itinerary day titles
 * (preferred, since they encode order) with the `location` string as a fallback.
 * Returns at most `maxStops` points. Fewer than 2 means "no drawable route".
 */
export function deriveTourRoute(
  location: string,
  itinerary: Array<{ title: string }>,
  maxStops = 12,
): CityPoint[] {
  const segments: string[] = [];
  for (const day of itinerary) {
    for (const seg of splitPlaces(day.title ?? "")) segments.push(seg);
  }
  let stops = matchSequence(segments);

  if (stops.length < 2) {
    const locStops = matchSequence(splitPlaces(location ?? ""));
    if (locStops.length > stops.length) stops = locStops;
  }

  if (stops.length > maxStops) {
    // Keep first, last, and an even spread between so the shape is preserved.
    const kept: CityPoint[] = [stops[0]!];
    const step = (stops.length - 1) / (maxStops - 1);
    for (let i = 1; i < maxStops - 1; i++) kept.push(stops[Math.round(i * step)]!);
    kept.push(stops[stops.length - 1]!);
    stops = kept.filter((p, i, all) => i === 0 || all[i - 1]!.key !== p.key);
  }

  return stops;
}
