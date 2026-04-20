"use client";

import { cn } from "@/lib/cn";
import type { ScrollyChapterConfig } from "./scrollyConfig";
import { PakistanMapSvg, PAKISTAN_MAP_VIEWBOX } from "./PakistanMapSvg";
import { SCROLLY_ROUTE_POINTS } from "./scrollyConfig";

function toBg(chapter: ScrollyChapterConfig) {
  const { from, via, to } = chapter.palette;
  return `linear-gradient(135deg, ${from} 0%, ${via} 45%, ${to} 100%)`;
}

type Pt = { x: number; y: number };

function catmullRomPath(points: Pt[]) {
  if (points.length < 2) return "";
  if (points.length === 2) {
    const [a, b] = points;
    return `M ${a.x},${a.y} L ${b.x},${b.y}`;
  }

  // Convert Catmull-Rom spline to cubic Beziers (smooth path through points).
  // This is deterministic and keeps the route visually pleasing without hand-drawing.
  let d = `M ${points[0]!.x},${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function RouteStage2D({
  chapters,
  className,
}: {
  chapters: ScrollyChapterConfig[];
  className?: string;
}) {
  // Stage renders all scenes layered; GSAP will crossfade and animate progress.
  const active = chapters[0];

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-3xl border border-white/10",
        className,
      )}
    >
      <div className="absolute inset-0" aria-hidden>
        {chapters.map((c, idx) => (
          <div
            key={c.id}
            data-scrolly-scene
            data-scene-id={c.id}
            className="absolute inset-0"
            style={{ opacity: idx === 0 ? 1 : 0 }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${c.image})` }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: toBg(c),
                opacity: 0.6,
              }}
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

      <div className="absolute left-6 top-6 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-md">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/65">
          Journey reel
        </p>
        <p className="mt-1 text-sm font-semibold text-white" data-scrolly-stage-title>
          {active.eyebrow}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <PakistanMapSvg className="absolute inset-0" opacity={0.85} />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={PAKISTAN_MAP_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {(() => {
            const pts = SCROLLY_ROUTE_POINTS.length
              ? SCROLLY_ROUTE_POINTS
              : chapters.map((c) => c.mapPoint);
            const routeD = catmullRomPath(pts);
            return (
              <>
                <path
                  d={routeD}
                  fill="none"
                  stroke="rgba(255,255,255,0.24)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  data-route-progress
                  d={routeD}
                  fill="none"
                  stroke="var(--scrolly-accent)"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              </>
            );
          })()}

          {chapters.map((c) => {
            const p = c.mapPoint;
            return (
              <g key={c.id} data-city-marker={c.id}>
                <circle cx={p.x} cy={p.y} r="6.5" fill="rgba(255,255,255,0.88)" />
                <circle cx={p.x} cy={p.y} r="12" fill="rgba(255,255,255,0.12)" />
                <text
                  x={p.x + 14}
                  y={p.y + 5}
                  fill="rgba(255,255,255,0.74)"
                  fontSize="18"
                  fontWeight="750"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="absolute bottom-6 left-6 right-6 grid gap-3 md:grid-cols-3">
        {[
          { k: "Private 4x4", v: "Comfort from pickup to drop-off" },
          { k: "Premium stays", v: "Handpicked hotels, better locations" },
          { k: "Personal guide", v: "Zero-hassle, end-to-end support" },
        ].map((c) => (
          <div
            key={c.k}
            className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-md"
          >
            <p className="text-xs font-bold text-white/85">{c.k}</p>
            <p className="mt-1 text-xs text-white/65">{c.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

