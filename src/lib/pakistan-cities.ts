/**
 * City positions for the tour route map are DERIVED, not hand-placed:
 *
 *   real (lat, lng)  ──projectLatLng()──►  SVG (x, y) in pakistan-provinces.svg space
 *
 * `projectLatLng` is a quadratic transform calibrated (least-squares) to the
 * `public/maps/pakistan-provinces.svg` basemap (viewBox 0 0 866.66669 819.94934,
 * north = smaller y). Because positions come from actual coordinates, adding a
 * new city only needs its lat/lng — it is placed correctly automatically, and
 * every city stays geographically consistent with the others.
 */

export const PAK_MAP_W = 866.66669;
export const PAK_MAP_H = 819.94934;

// Quadratic coefficients over features [lng, lat, lng², lat², lng·lat, 1].
const CX = [90.7191, 20.6749, -0.7094, -2.2177, 1.4116, -3991.319];
const CY = [292.2411, -103.7866, -3.0109, -3.7012, 4.1115, -7380.2403];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Project real latitude/longitude to SVG (x, y) on the Pakistan basemap. */
export function projectLatLng(lat: number, lng: number): { x: number; y: number } {
  const f = [lng, lat, lng * lng, lat * lat, lng * lat, 1];
  const dot = (c: number[]) => f.reduce((s, fi, i) => s + fi * c[i]!, 0);
  return {
    x: clamp(dot(CX), 6, PAK_MAP_W - 6),
    y: clamp(dot(CY), 6, PAK_MAP_H - 6),
  };
}

export type CityPoint = {
  key: string;
  name: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
};

type CityDef = { name: string; lat: number; lng: number; aliases?: string[] };

/**
 * Gazetteer of Pakistani cities and tourist destinations with REAL coordinates.
 * Extend by adding `{ name, lat, lng }` — the map position is computed for you.
 */
const CITY_TABLE: CityDef[] = [
  // ── Gilgit-Baltistan ─────────────────────────────────────────────────────
  { name: "Khunjerab Pass", lat: 36.85, lng: 75.41, aliases: ["khunjerab", "khunjrab", "khunjerab top"] },
  { name: "Sost", lat: 36.68, lng: 74.86 },
  { name: "Passu", lat: 36.45, lng: 74.87, aliases: ["passu cones"] },
  { name: "Gulmit", lat: 36.39, lng: 74.86 },
  { name: "Attabad Lake", lat: 36.36, lng: 74.86, aliases: ["attabad"] },
  { name: "Hunza", lat: 36.32, lng: 74.65, aliases: ["karimabad", "hunza valley", "aliabad"] },
  { name: "Nagar", lat: 36.24, lng: 74.72, aliases: ["nagar valley"] },
  { name: "Minapin", lat: 36.23, lng: 74.55, aliases: ["rakaposhi"] },
  { name: "Naltar", lat: 36.17, lng: 74.18, aliases: ["naltar valley"] },
  { name: "Gilgit", lat: 35.92, lng: 74.31 },
  { name: "Fairy Meadows", lat: 35.39, lng: 74.58, aliases: ["fairy meadow", "nanga parbat", "raikot"] },
  { name: "Chilas", lat: 35.42, lng: 74.1 },
  { name: "Astore", lat: 35.37, lng: 74.86, aliases: ["astore valley", "rama"] },
  { name: "Skardu", lat: 35.3, lng: 75.63 },
  { name: "Shigar", lat: 35.42, lng: 75.73, aliases: ["shigar valley"] },
  { name: "Khaplu", lat: 35.16, lng: 76.34, aliases: ["khaplu valley"] },
  { name: "Deosai", lat: 34.98, lng: 75.42, aliases: ["deosai plains", "deosai national park"] },
  { name: "Phander", lat: 36.15, lng: 72.48, aliases: ["phander valley"] },
  { name: "Shandur", lat: 36.09, lng: 72.55, aliases: ["shandur pass", "shandur top"] },
  // ── Chitral / upper KPK ──────────────────────────────────────────────────
  { name: "Mastuj", lat: 36.28, lng: 72.51 },
  { name: "Chitral", lat: 35.85, lng: 71.79 },
  { name: "Kalash Valley", lat: 35.7, lng: 71.68, aliases: ["kalash", "bumburet", "rumbur"] },
  { name: "Dir", lat: 35.2, lng: 71.88, aliases: ["upper dir"] },
  // ── KPK (Kaghan / Swat / Hazara / plains) ────────────────────────────────
  { name: "Kalam", lat: 35.48, lng: 72.58, aliases: ["kalam valley"] },
  { name: "Bahrain", lat: 35.21, lng: 72.55, aliases: ["madyan"] },
  { name: "Malam Jabba", lat: 34.8, lng: 72.57 },
  { name: "Swat", lat: 34.77, lng: 72.36, aliases: ["mingora", "swat valley", "saidu sharif"] },
  { name: "Babusar", lat: 35.14, lng: 73.98, aliases: ["babusar top", "babusar pass"] },
  { name: "Naran", lat: 34.9, lng: 73.65, aliases: ["batakundi", "lulusar"] },
  { name: "Kaghan", lat: 34.77, lng: 73.53, aliases: ["kaghan valley"] },
  { name: "Shogran", lat: 34.63, lng: 73.46, aliases: ["siri paye", "siripaye"] },
  { name: "Balakot", lat: 34.55, lng: 73.35 },
  { name: "Mansehra", lat: 34.33, lng: 73.2 },
  { name: "Kumrat", lat: 35.53, lng: 72.15, aliases: ["kumrat valley"] },
  { name: "Nathia Gali", lat: 34.07, lng: 73.39, aliases: ["nathiagali", "ayubia", "galiyat", "thandiani"] },
  { name: "Abbottabad", lat: 34.15, lng: 73.21 },
  { name: "Peshawar", lat: 34.01, lng: 71.58 },
  { name: "Mardan", lat: 34.2, lng: 72.05 },
  { name: "Nowshera", lat: 34.02, lng: 71.98 },
  { name: "Kohat", lat: 33.58, lng: 71.44 },
  { name: "Dera Ismail Khan", lat: 31.83, lng: 70.9, aliases: ["di khan", "d.i. khan"] },
  // ── Azad Kashmir ─────────────────────────────────────────────────────────
  { name: "Neelum Valley", lat: 34.79, lng: 73.91, aliases: ["neelum", "keran", "sharda", "arang kel"] },
  { name: "Muzaffarabad", lat: 34.37, lng: 73.47, aliases: ["pir chinasi"] },
  { name: "Bagh", lat: 33.98, lng: 73.78 },
  { name: "Rawalakot", lat: 33.86, lng: 73.76, aliases: ["banjosa", "toli pir"] },
  { name: "Mirpur", lat: 33.15, lng: 73.75 },
  // ── Islamabad / Pothohar ─────────────────────────────────────────────────
  { name: "Murree", lat: 33.91, lng: 73.39, aliases: ["patriata", "new murree"] },
  { name: "Islamabad", lat: 33.68, lng: 73.05, aliases: ["isb"] },
  { name: "Rawalpindi", lat: 33.6, lng: 73.04, aliases: ["pindi"] },
  { name: "Taxila", lat: 33.74, lng: 72.79, aliases: ["gandhara"] },
  { name: "Khewra", lat: 32.65, lng: 73.01, aliases: ["khewra salt mine", "salt range"] },
  { name: "Katas Raj", lat: 32.72, lng: 72.95 },
  // ── Punjab ───────────────────────────────────────────────────────────────
  { name: "Jhelum", lat: 32.94, lng: 73.73, aliases: ["rohtas", "rohtas fort"] },
  { name: "Gujrat", lat: 32.57, lng: 74.08 },
  { name: "Sialkot", lat: 32.49, lng: 74.53 },
  { name: "Gujranwala", lat: 32.16, lng: 74.19 },
  { name: "Sheikhupura", lat: 31.71, lng: 73.98, aliases: ["hiran minar"] },
  { name: "Lahore", lat: 31.55, lng: 74.34, aliases: ["walled city", "badshahi", "shalimar"] },
  { name: "Faisalabad", lat: 31.42, lng: 73.08 },
  { name: "Sargodha", lat: 32.08, lng: 72.67 },
  { name: "Sahiwal", lat: 30.66, lng: 73.11, aliases: ["harappa"] },
  { name: "Multan", lat: 30.2, lng: 71.47 },
  { name: "Bahawalpur", lat: 29.4, lng: 71.68, aliases: ["cholistan", "derawar"] },
  { name: "Fort Munro", lat: 29.98, lng: 70.14 },
  { name: "Rahim Yar Khan", lat: 28.42, lng: 70.3 },
  // ── Balochistan ──────────────────────────────────────────────────────────
  { name: "Ziarat", lat: 30.38, lng: 67.73 },
  { name: "Quetta", lat: 30.18, lng: 66.99, aliases: ["hanna lake", "pishin"] },
  { name: "Kalat", lat: 29.02, lng: 66.59 },
  { name: "Khuzdar", lat: 27.8, lng: 66.62 },
  { name: "Hingol", lat: 25.51, lng: 65.51, aliases: ["hingol national park", "kund malir"] },
  { name: "Ormara", lat: 25.21, lng: 64.64 },
  { name: "Gwadar", lat: 25.13, lng: 62.32 },
  { name: "Turbat", lat: 26.0, lng: 63.05 },
  // ── Sindh ────────────────────────────────────────────────────────────────
  { name: "Sukkur", lat: 27.7, lng: 68.86 },
  { name: "Larkana", lat: 27.56, lng: 68.21, aliases: ["mohenjo daro", "mohenjo-daro", "moenjodaro"] },
  { name: "Nawabshah", lat: 26.24, lng: 68.41 },
  { name: "Gorakh Hill", lat: 26.83, lng: 67.3 },
  { name: "Hyderabad", lat: 25.4, lng: 68.37 },
  { name: "Thatta", lat: 24.75, lng: 67.92, aliases: ["makli", "keenjhar"] },
  { name: "Karachi", lat: 24.86, lng: 67.0, aliases: ["clifton"] },
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

function makePoint(c: CityDef): CityPoint {
  const { x, y } = projectLatLng(c.lat, c.lng);
  return { key: toKey(c.name), name: c.name, lat: c.lat, lng: c.lng, x, y };
}

/** (normalized alias → point), longest alias first for greedy matching. */
const ALIAS_INDEX: Array<{ alias: string; point: CityPoint }> = (() => {
  const out: Array<{ alias: string; point: CityPoint }> = [];
  for (const c of CITY_TABLE) {
    const point = makePoint(c);
    for (const a of [c.name, ...(c.aliases ?? [])]) {
      const n = norm(a);
      if (n) out.push({ alias: n, point });
    }
  }
  return out.sort((a, b) => b.alias.length - a.alias.length);
})();

const FILLER = new Set([
  "day", "arrive", "arrival", "depart", "departure", "drive", "travel",
  "transfer", "explore", "visit", "sightseeing", "overnight", "night",
  "stay", "return", "to", "via", "then", "and", "the", "head", "off", "at",
  "airport", "hotel", "check", "in", "out", "back",
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
  for (const { alias, point } of ALIAS_INDEX) {
    if (alias === segment) return point;
  }
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
    const words = seg.split(" ");
    if (words.every((w) => FILLER.has(w))) continue;
    const point = matchSegment(seg);
    if (!point) continue;
    // Keep each city once (first-visit order) so out-and-back itineraries render a
    // clean route without overlapping/duplicate markers.
    if (stops.some((s) => s.key === point.key)) continue;
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
  maxStops = 14,
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
    const kept: CityPoint[] = [stops[0]!];
    const step = (stops.length - 1) / (maxStops - 1);
    for (let i = 1; i < maxStops - 1; i++) kept.push(stops[Math.round(i * step)]!);
    kept.push(stops[stops.length - 1]!);
    stops = kept.filter((p, i, all) => i === 0 || all[i - 1]!.key !== p.key);
  }

  return stops;
}
