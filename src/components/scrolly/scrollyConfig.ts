export type ScrollyPalette = {
  from: string;
  via: string;
  to: string;
  accent: string;
};

export type ScrollyChapterConfig = {
  id: string;
  eyebrow: string;
  title: string;
  bullets: string[];
  stats?: string[];
  image: string;
  palette: ScrollyPalette;
  mapPoint: {
    x: number;
    y: number;
    label: string;
  };
  mobileViewport?: {
    zoom: number;
    cx?: number;
    cy?: number;
  };
};

export const SCROLLY_CHAPTERS: ScrollyChapterConfig[] = [
  {
    id: "karachi",
    eyebrow: "The coast",
    title: "Where the journey starts: Karachi.",
    bullets: [
      "Arabian Sea breeze, big-city energy, and a clean start to your route",
      "Best for arrivals: flexible pickup windows and hotel options",
      "Optional: short coastal detours before heading inland",
    ],
    stats: ["Coastal start", "Easy arrivals", "Flexible pickups"],
    image: "/maps/karachi.jpg",
    palette: {
      from: "rgba(15, 23, 42, 0.95)",
      via: "rgba(2, 132, 199, 0.22)",
      to: "rgba(2, 6, 23, 0.92)",
      accent: "rgba(56, 189, 248, 0.95)",
    },
    mapPoint: { x: 410, y: 665, label: "Karachi" },
    mobileViewport: { zoom: 1.75, cy: 0.52 },
  },
  {
    id: "lahore",
    eyebrow: "Punjab heartland",
    title: "Food streets and history: Lahore.",
    bullets: [
      "Heritage walks, old-city nights, and the kind of chaos you’ll miss later",
      "Best planned with rest time: Lahore is a pace shift before the north",
      "Optional: day trips around Walled City + iconic landmarks",
    ],
    stats: ["Culture", "Food", "Heritage"],
    image: "/maps/lahore.jpg",
    palette: {
      from: "rgba(17, 24, 39, 0.92)",
      via: "rgba(234, 88, 12, 0.18)",
      to: "rgba(2, 6, 23, 0.92)",
      accent: "rgba(251, 146, 60, 0.95)",
    },
    mapPoint: { x: 585, y: 410, label: "Lahore" },
    mobileViewport: { zoom: 2.1, cy: 0.48 },
  },
  {
    id: "islamabad",
    eyebrow: "Capital gateway",
    title: "Islamabad: the calm before the climb.",
    bullets: [
      "The clean handoff point: gear checks, weather checks, and an early start north",
      "Best for a reset day: cafés, viewpoints, and smoother logistics",
      "Optional: Taxila / Margalla quick detours depending on timing",
    ],
    stats: ["Gateway north", "Reset day", "Logistics"],
    image: "/maps/islamabad.jpg",
    palette: {
      from: "rgba(2, 6, 23, 0.92)",
      via: "rgba(16, 185, 129, 0.16)",
      to: "rgba(15, 23, 42, 0.92)",
      accent: "rgba(52, 211, 153, 0.95)",
    },
    mapPoint: { x: 510, y: 360, label: "Islamabad" },
    mobileViewport: { zoom: 2.15, cy: 0.47 },
  },
  {
    id: "gilgit",
    eyebrow: "Karakoram Highway",
    title: "Gilgit: the northern crossroads.",
    bullets: [
      "The roads turn dramatic — every stop is a viewpoint if timed right",
      "Plan for altitude + daylight: better pacing means better photos",
      "Optional: short hikes and valley detours depending on season",
    ],
    stats: ["Karakoram", "Pace & altitude", "Daylight planning"],
    image: "/maps/gilgit.jpg",
    palette: {
      from: "rgba(2, 6, 23, 0.92)",
      via: "rgba(99, 102, 241, 0.16)",
      to: "rgba(2, 6, 23, 0.92)",
      accent: "rgba(129, 140, 248, 0.95)",
    },
    mapPoint: { x: 440, y: 190, label: "Gilgit" },
    mobileViewport: { zoom: 2.25, cy: 0.46 },
  },
  {
    id: "hunza",
    eyebrow: "Valleys",
    title: "Hunza: the views you came for.",
    bullets: [
      "Long vistas, crisp air, and valley towns that feel unreal at sunrise",
      "Weather-aware stops: we time the best viewpoints for the best light",
      "Optional: Passu cones / Attabad Lake add-ons",
    ],
    stats: ["Viewpoints", "Golden-hour stops", "Valley pacing"],
    image: "/maps/hunza.jpg",
    palette: {
      from: "rgba(2, 6, 23, 0.92)",
      via: "rgba(244, 114, 182, 0.14)",
      to: "rgba(2, 6, 23, 0.92)",
      accent: "rgba(244, 114, 182, 0.95)",
    },
    mapPoint: { x: 470, y: 145, label: "Hunza" },
    mobileViewport: { zoom: 2.35, cy: 0.46 },
  },
  {
    id: "khunjerab",
    eyebrow: "China border",
    title: "Khunjerab Pass: end of the road.",
    bullets: [
      "The top of the route — high altitude, big skies, and a true finish line",
      "We plan for weather closures and timing so you don’t waste the day",
      "Best paired with Hunza for a smooth, no-rush final push",
    ],
    stats: ["High altitude", "Weather-aware", "Finish line"],
    image: "/maps/Khunerjab.jpg",
    palette: {
      from: "rgba(2, 6, 23, 0.92)",
      via: "rgba(250, 204, 21, 0.10)",
      to: "rgba(2, 6, 23, 0.92)",
      accent: "rgba(234, 88, 12, 0.95)",
    },
    mapPoint: { x: 510, y: 100, label: "Khunjerab" },
    mobileViewport: { zoom: 2.55, cy: 0.46 },
  },
];

// Route-only waypoints to make the line visually follow the KKH better.
// These points are in the same SVG viewBox space as `mapPoint`.
// Chapters/markers still use `SCROLLY_CHAPTERS[*].mapPoint`.
export const SCROLLY_ROUTE_POINTS: Array<{ x: number; y: number }> = [
  // Karachi → Lahore → Islamabad
  { x: 410, y: 665 }, // Karachi
  { x: 520, y: 520 }, // Interior bend (Sukkur-ish) for nicer curve
  { x: 585, y: 410 }, // Lahore
  { x: 535, y: 385 }, // Gujranwala-ish bend
  { x: 510, y: 360 }, // Islamabad

  // Islamabad → Gilgit (KKH)
  { x: 495, y: 330 }, // Abbottabad-ish
  { x: 475, y: 300 }, // Mansehra-ish
  { x: 455, y: 270 }, // Besham-ish
  { x: 440, y: 245 }, // Dasu-ish
  { x: 430, y: 220 }, // Chilas-ish
  { x: 440, y: 190 }, // Gilgit

  // Gilgit → Hunza → Khunjerab
  { x: 455, y: 170 }, // Nagar-ish
  { x: 470, y: 145 }, // Hunza
  { x: 490, y: 128 }, // Passu-ish
  { x: 505, y: 112 }, // Sost-ish
  { x: 510, y: 100 }, // Khunjerab
];

