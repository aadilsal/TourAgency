import { PROVINCES } from "@/lib/provinces-data";
import { getFeaturedSitesForProvince } from "@/lib/sites-data";

export type ScrollyPalette = {
  from: string;
  via: string;
  to: string;
  accent: string;
};

export type ScrollyPreviewSite = {
  name: string;
  type: "historical" | "cultural" | "natural" | "adventure";
  summary: string;
};

export type ScrollyChapterConfig = {
  id: string;
  provinceSlug: string;
  guideHref: string;
  eyebrow: string;
  title: string;
  bullets: string[];
  stats?: string[];
  previewSites: ScrollyPreviewSite[];
  ctaLabel?: string;
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

export const SCROLLY_CHAPTERS: ScrollyChapterConfig[] = PROVINCES.map((p) => ({
  id: p.slug,
  provinceSlug: p.slug,
  guideHref: `/guides/${p.slug}`,
  eyebrow: p.scrollyEyebrow,
  title: p.scrollyTitle,
  bullets: p.scrollyBullets,
  stats: p.scrollyStats,
  previewSites: getFeaturedSitesForProvince(p.slug, 5).map((s) => ({
    name: s.name,
    type: s.type,
    summary: s.summary,
  })),
  ctaLabel: `Explore ${p.name} guide`,
  image: p.heroImage,
  palette: p.palette,
  mapPoint: p.mapPoint,
  mobileViewport: { zoom: 1.85, cy: 0.48 },
}));

// South → north route through province centroids
export const SCROLLY_ROUTE_POINTS: Array<{ x: number; y: number }> = [
  { x: 420, y: 620 }, // Sindh
  { x: 350, y: 570 }, // Bend west
  { x: 280, y: 520 }, // Balochistan
  { x: 420, y: 470 }, // Interior bend
  { x: 560, y: 420 }, // Punjab
  { x: 530, y: 385 }, // Toward capital
  { x: 500, y: 350 }, // Islamabad
  { x: 485, y: 315 }, // KPK approach
  { x: 470, y: 280 }, // KPK
  { x: 460, y: 215 }, // Toward GB
  { x: 450, y: 150 }, // Gilgit-Baltistan
  { x: 515, y: 185 }, // East bend
  { x: 580, y: 220 }, // Azad Kashmir
];
