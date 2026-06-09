/** Province catalog for /guides and homepage scrolly — south to north. */

export const PROVINCE_SLUGS = [
  "sindh",
  "balochistan",
  "punjab",
  "islamabad",
  "kpk",
  "gilgit-baltistan",
  "azad-kashmir",
] as const;

export type ProvinceSlug = (typeof PROVINCE_SLUGS)[number];

export type ProvincePalette = {
  from: string;
  via: string;
  to: string;
  accent: string;
};

export type ProvinceRecord = {
  slug: ProvinceSlug;
  name: string;
  tagline: string;
  intro: string;
  heroImage: string;
  bestTime: string;
  tips: string[];
  costEstimate: string;
  matchTerms: string[];
  sortOrder: number;
  mapPoint: { x: number; y: number; label: string };
  scrollyEyebrow: string;
  scrollyTitle: string;
  scrollyBullets: string[];
  scrollyStats: string[];
  palette: ProvincePalette;
};

export const PROVINCES: ProvinceRecord[] = [
  {
    slug: "sindh",
    name: "Sindh",
    tagline: "Indus civilization, Sufi heritage & Arabian Sea culture.",
    intro:
      "Sindh is where Pakistan's story begins — from the Bronze Age cities of the Indus Valley to the marble domes of Thatta and the energy of Karachi. Expect ancient archaeology, Sufi shrines, desert forts, and a coastline that feels worlds away from the mountains.",
    heroImage:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2000&q=80",
    bestTime: "October–March for city and site touring; avoid peak summer heat in lower Sindh.",
    tips: [
      "Pair Karachi with a day trip to Thatta or Makli.",
      "Mohenjo-daro is best visited early morning.",
      "Dress modestly at shrines and archaeological sites.",
    ],
    costEstimate:
      "Sindh heritage weekends from PKR 25k–50k per person; longer circuits with Mohenjo-daro scale with transport.",
    matchTerms: ["sindh", "karachi", "thatta", "mohenjo", "hyderabad", "larkana"],
    sortOrder: 0,
    mapPoint: { x: 420, y: 620, label: "Sindh" },
    scrollyEyebrow: "Where it begins",
    scrollyTitle: "Sindh: Indus civilization & coastal culture.",
    scrollyBullets: [
      "Mohenjo-daro — one of the world's earliest urban centers",
      "Makli and Thatta — UNESCO marble necropolis and mosque",
      "Karachi — port-city food, markets, and Quaid's mausoleum",
    ],
    scrollyStats: ["Indus Valley", "Sufi shrines", "Coast"],
    palette: {
      from: "rgba(15, 23, 42, 0.95)",
      via: "rgba(2, 132, 199, 0.22)",
      to: "rgba(2, 6, 23, 0.92)",
      accent: "rgba(56, 189, 248, 0.95)",
    },
  },
  {
    slug: "balochistan",
    name: "Balochistan",
    tagline: "Desert canyons, juniper highlands & Makran coast.",
    intro:
      "Balochistan rewards travelers who want space and contrast — juniper forests at Ziarat, surreal Hingol National Park, ancient trade routes, and a Makran coastline that rivals any desert-meets-sea journey on earth.",
    heroImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80",
    bestTime: "October–April; summer interior heat is intense.",
    tips: [
      "Confirm road security and permits for remote routes.",
      "Carry water and fuel buffers on long desert drives.",
      "Gwadar and Hingol need 2–3 days minimum.",
    ],
    costEstimate:
      "Balochistan circuits vary widely — PKR 40k–120k+ depending on jeep access and hotel tier.",
    matchTerms: ["balochistan", "quetta", "ziarat", "hingol", "gwadar", "khuzdar"],
    sortOrder: 1,
    mapPoint: { x: 280, y: 520, label: "Balochistan" },
    scrollyEyebrow: "Desert & coast",
    scrollyTitle: "Balochistan: juniper highlands to Makran shores.",
    scrollyBullets: [
      "Hingol — mud volcanoes, Princess of Hope, coastal cliffs",
      "Ziarat — Quaid's residency and ancient juniper forest",
      "Quetta — bazaars and gateway to highland valleys",
    ],
    scrollyStats: ["Hingol", "Ziarat", "Makran"],
    palette: {
      from: "rgba(30, 20, 10, 0.92)",
      via: "rgba(180, 83, 9, 0.18)",
      to: "rgba(2, 6, 23, 0.92)",
      accent: "rgba(245, 158, 11, 0.95)",
    },
  },
  {
    slug: "punjab",
    name: "Punjab",
    tagline: "Mughal heartland, Sufi shrines & ancient Harappa.",
    intro:
      "Punjab is Pakistan's cultural engine — Lahore's Mughal masterpieces, Multan's blue-tile shrines, the archaeological wonder of Harappa, and forts like Rohtas that guard centuries of history along the Grand Trunk Road.",
    heroImage:
      "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=2000&q=80",
    bestTime: "October–March for comfortable heritage walks; spring festivals in Feb–Mar.",
    tips: [
      "Start Lahore days early at the fort before crowds.",
      "Combine Multan with Lahore for a full Punjab circuit.",
      "Harappa pairs well with a night in Sahiwal region.",
    ],
    costEstimate:
      "Punjab heritage weekends PKR 25k–60k; multi-city circuits PKR 70k–120k+.",
    matchTerms: ["punjab", "lahore", "multan", "harappa", "faisalabad", "rohtas"],
    sortOrder: 2,
    mapPoint: { x: 560, y: 420, label: "Punjab" },
    scrollyEyebrow: "Mughal heartland",
    scrollyTitle: "Punjab: forts, shrines & living cities.",
    scrollyBullets: [
      "Lahore Fort, Badshahi Mosque, and Walled City lanes",
      "Multan — Sufi shrines and blue tilework",
      "Harappa & Rohtas — archaeology and military heritage",
    ],
    scrollyStats: ["Mughal", "Sufi", "Archaeology"],
    palette: {
      from: "rgba(17, 24, 39, 0.92)",
      via: "rgba(234, 88, 12, 0.18)",
      to: "rgba(2, 6, 23, 0.92)",
      accent: "rgba(251, 146, 60, 0.95)",
    },
  },
  {
    slug: "islamabad",
    name: "Islamabad & Heritage Belt",
    tagline: "Gandhara archaeology, capital landmarks & Margalla trails.",
    intro:
      "The Islamabad region bridges ancient and modern Pakistan — Taxila's Gandhara ruins, the iconic Faisal Mosque, Lok Virsa living heritage, and Margalla Hills trails just minutes from the capital.",
    heroImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80",
    bestTime: "October–April for site walks and hill viewpoints.",
    tips: [
      "Taxila deserves a licensed guide for context.",
      "Combine museum morning with ruins afternoon.",
      "Margalla trails need water and sun protection.",
    ],
    costEstimate: "Day trips from PKR 15k–35k; weekend heritage PKR 30k–55k per person.",
    matchTerms: ["islamabad", "taxila", "rawalpindi", "murree", "margalla"],
    sortOrder: 3,
    mapPoint: { x: 500, y: 350, label: "Islamabad" },
    scrollyEyebrow: "Capital & Gandhara",
    scrollyTitle: "Islamabad: ancient Taxila to modern landmarks.",
    scrollyBullets: [
      "Taxila — UNESCO Gandhara Buddhist heritage",
      "Faisal Mosque & Pakistan Monument viewpoints",
      "Margalla Hills — trails above the capital",
    ],
    scrollyStats: ["Gandhara", "Capital", "Trails"],
    palette: {
      from: "rgba(2, 6, 23, 0.92)",
      via: "rgba(16, 185, 129, 0.16)",
      to: "rgba(15, 23, 42, 0.92)",
      accent: "rgba(52, 211, 153, 0.95)",
    },
  },
  {
    slug: "kpk",
    name: "Khyber Pakhtunkhwa",
    tagline: "Gandhara valleys, Peshawar bazaars & Kalash culture.",
    intro:
      "KPK layers Buddhist archaeology, frontier bazaar culture, and alpine valleys — from Peshawar's Qissa Khwani to Swat's stupas, Chitral's Kalash traditions, and the legendary Kaghan corridor.",
    heroImage:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80",
    bestTime: "March–November for valleys; Kalash festivals spring and autumn.",
    tips: [
      "Swat heritage sites pair with upper-valley scenery.",
      "Respect Kalash customs — ask before photographing rituals.",
      "Check monsoon advisories for riverside routes.",
    ],
    costEstimate: "Swat/Kaghan circuits PKR 35k–80k; Chitral–Kalash PKR 80k–150k+.",
    matchTerms: ["kpk", "khyber", "peshawar", "swat", "chitral", "kalash", "naran", "kaghan"],
    sortOrder: 4,
    mapPoint: { x: 470, y: 280, label: "KPK" },
    scrollyEyebrow: "Frontier heritage",
    scrollyTitle: "KPK: bazaars, Buddhist trails & alpine valleys.",
    scrollyBullets: [
      "Peshawar — Qissa Khwani and frontier history",
      "Swat — Gandhara stupas and emerald valleys",
      "Chitral & Kalash — living indigenous culture",
    ],
    scrollyStats: ["Gandhara", "Bazaars", "Valleys"],
    palette: {
      from: "rgba(2, 6, 23, 0.92)",
      via: "rgba(34, 197, 94, 0.16)",
      to: "rgba(2, 6, 23, 0.92)",
      accent: "rgba(74, 222, 128, 0.95)",
    },
  },
  {
    slug: "gilgit-baltistan",
    name: "Gilgit-Baltistan",
    tagline: "Mountain forts, Silk Route heritage & Karakoram lakes.",
    intro:
      "Gilgit-Baltistan is northern heritage at its peak — 700-year-old forts in Hunza, royal palaces in Skardu, the high plains of Deosai, and the Karakoram Highway's most dramatic viewpoints.",
    heroImage:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80",
    bestTime: "Late April–October for roads and forts; confirm pass status shoulder seasons.",
    tips: [
      "Lead with fort visits before aggressive hikes.",
      "Buffer days for flight delays to Skardu.",
      "Carry layers — weather shifts fast at altitude.",
    ],
    costEstimate: "GB road packages PKR 45k–150k+ depending on duration and transport.",
    matchTerms: ["gilgit", "hunza", "skardu", "baltistan", "karakoram", "deosai"],
    sortOrder: 5,
    mapPoint: { x: 450, y: 150, label: "Gilgit-Baltistan" },
    scrollyEyebrow: "Northern heritage",
    scrollyTitle: "Gilgit-Baltistan: forts, valleys & Karakoram views.",
    scrollyBullets: [
      "Baltit & Altit forts — centuries above Hunza Valley",
      "Shigar Fort & Skardu — Silk Route royal heritage",
      "Deosai & Khunjerab — high-altitude adventure",
    ],
    scrollyStats: ["Forts", "Karakoram", "Lakes"],
    palette: {
      from: "rgba(2, 6, 23, 0.92)",
      via: "rgba(244, 114, 182, 0.14)",
      to: "rgba(2, 6, 23, 0.92)",
      accent: "rgba(244, 114, 182, 0.95)",
    },
  },
  {
    slug: "azad-kashmir",
    name: "Azad Kashmir",
    tagline: "Neelum Valley, Muzaffarabad & Pir Chinasi viewpoints.",
    intro:
      "Azad Kashmir combines frontier city heritage with deep green valleys — Muzaffarabad's riverside setting, Neelum's pine forests, and viewpoints like Pir Chinasi that open onto the Himalayas.",
    heroImage:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80",
    bestTime: "April–October for valley access; winter roads can close.",
    tips: [
      "Neelum needs 2–3 nights for a relaxed pace.",
      "Confirm LOC-area travel advisories before booking.",
      "Pair with Islamabad for a capital + valleys loop.",
    ],
    costEstimate: "Weekend Neelum packages PKR 30k–55k; extended circuits scale with transport.",
    matchTerms: ["kashmir", "muzaffarabad", "neelum", "rawalakot", "bagh"],
    sortOrder: 6,
    mapPoint: { x: 580, y: 220, label: "Azad Kashmir" },
    scrollyEyebrow: "Valley finish",
    scrollyTitle: "Azad Kashmir: rivers, pines & Himalayan views.",
    scrollyBullets: [
      "Neelum Valley — riverside villages and forest drives",
      "Muzaffarabad — Red Fort and confluence viewpoints",
      "Pir Chinasi — panoramic ridge above the capital",
    ],
    scrollyStats: ["Neelum", "Viewpoints", "Valleys"],
    palette: {
      from: "rgba(2, 6, 23, 0.92)",
      via: "rgba(99, 102, 241, 0.16)",
      to: "rgba(2, 6, 23, 0.92)",
      accent: "rgba(129, 140, 248, 0.95)",
    },
  },
];

export function getProvince(slug: string): ProvinceRecord | null {
  return PROVINCES.find((p) => p.slug === slug) ?? null;
}

export function tourMatchesProvince(
  tourLocation: string,
  province: Pick<ProvinceRecord, "matchTerms">,
): boolean {
  const l = tourLocation.toLowerCase();
  return province.matchTerms.some((t) => l.includes(t.toLowerCase()));
}
