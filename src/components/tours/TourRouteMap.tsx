"use client";

import { useEffect, useMemo, useRef } from "react";
import { deriveTourRoute, type CityPoint } from "@/lib/pakistan-cities";
import {
  PAKISTAN_MAP_WIDTH,
  PAKISTAN_MAP_HEIGHT,
  PAKISTAN_MAP_VIEWBOX,
} from "@/components/scrolly/PakistanMapSvg";
import { TourLocationMap } from "./TourLocationMap";

type Props = {
  location: string;
  title: string;
  itinerary: Array<{ day: number; title: string; description: string }>;
};

/** Smooth Catmull-Rom spline through the route points (as an SVG path `d`). */
function catmullRomPath(points: CityPoint[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    const [a, b] = points;
    return `M ${a!.x},${a!.y} L ${b!.x},${b!.y}`;
  }
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

/** Fit the viewBox to the route (padded, aspect-corrected, clamped to the map). */
function computeViewBox(stops: CityPoint[], aspect = 1.6, pad = 96): string {
  const xs = stops.map((s) => s.x);
  const ys = stops.map((s) => s.y);
  let minX = Math.min(...xs) - pad;
  let maxX = Math.max(...xs) + pad;
  let minY = Math.min(...ys) - pad;
  let maxY = Math.max(...ys) + pad;
  let w = maxX - minX;
  let h = maxY - minY;

  if (w / h < aspect) {
    const nw = h * aspect;
    const cx = (minX + maxX) / 2;
    minX = cx - nw / 2;
    maxX = cx + nw / 2;
    w = nw;
  } else {
    const nh = w / aspect;
    const cy = (minY + maxY) / 2;
    minY = cy - nh / 2;
    maxY = cy + nh / 2;
    h = nh;
  }

  minX = Math.max(0, Math.min(minX, PAKISTAN_MAP_WIDTH - w));
  minY = Math.max(0, Math.min(minY, PAKISTAN_MAP_HEIGHT - h));
  minX = Math.max(0, minX);
  minY = Math.max(0, minY);
  w = Math.min(w, PAKISTAN_MAP_WIDTH);
  h = Math.min(h, PAKISTAN_MAP_HEIGHT);

  return `${minX} ${minY} ${w} ${h}`;
}

export function TourRouteMap({ location, title, itinerary }: Props) {
  const stops = useMemo(() => deriveTourRoute(location, itinerary), [location, itinerary]);
  const routeD = useMemo(() => catmullRomPath(stops), [stops]);
  const viewBox = useMemo(
    () => (stops.length >= 2 ? computeViewBox(stops) : PAKISTAN_MAP_VIEWBOX),
    [stops],
  );

  const trailRef = useRef<SVGPathElement | null>(null);
  const carRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const path = trailRef.current;
    const car = carRef.current;
    if (!path || !car || stops.length < 2) return;

    const len = path.getTotalLength();
    if (!len) return;
    path.style.strokeDasharray = String(len);

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const placeCar = (dist: number) => {
      const p = path.getPointAtLength(dist);
      const p2 = path.getPointAtLength(Math.min(len, dist + 1.5));
      const ang = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI;
      car.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${ang})`);
    };

    if (prefersReduced) {
      path.style.strokeDashoffset = "0";
      placeCar(len);
      return;
    }

    let raf = 0;
    let startTs = 0;
    const DURATION = Math.max(3800, len * 5.5); // longer routes drive longer
    const HOLD = 950; // pause at the end before looping

    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = (ts - startTs) % (DURATION + HOLD);
      const progress = Math.min(1, elapsed / DURATION);
      path.style.strokeDashoffset = String(len * (1 - progress));
      placeCar(len * progress);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [routeD, stops.length]);

  // No recognisable route → fall back to the plain location map.
  if (stops.length < 2) {
    return <TourLocationMap location={location} title={title} />;
  }

  const start = stops[0]!;
  const end = stops[stops.length - 1]!;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card ring-1 ring-slate-900/[0.04]">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-bold text-brand-ink">Where you&apos;ll go</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Your route across Pakistan:{" "}
          <span className="font-medium text-brand-ink">{start.name}</span> →{" "}
          <span className="font-medium text-brand-ink">{end.name}</span>
        </p>
      </div>
      <div className="relative aspect-[16/10] min-h-[240px] w-full bg-gradient-to-b from-sky-50 to-emerald-50/60">
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`Map of the tour route from ${start.name} to ${end.name}`}
        >
          <defs>
            <linearGradient id="tour-route-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="55%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>

          <image
            href="/maps/pakistan-provinces.svg"
            x={0}
            y={0}
            width={PAKISTAN_MAP_WIDTH}
            height={PAKISTAN_MAP_HEIGHT}
            opacity={0.85}
          />

          {/* Faint full route underneath */}
          <path
            d={routeD}
            fill="none"
            stroke="#0f172a"
            strokeOpacity={0.12}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Animated “driven so far” trail */}
          <path
            ref={trailRef}
            d={routeD}
            fill="none"
            stroke="url(#tour-route-grad)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* City markers + labels */}
          {stops.map((s, i) => {
            const isStart = i === 0;
            const isEnd = i === stops.length - 1;
            const r = isStart || isEnd ? 6 : 4;
            const fill = isStart ? "#10b981" : isEnd ? "#f43f5e" : "#0ea5e9";
            return (
              <g key={`${s.key}-${i}`}>
                <circle cx={s.x} cy={s.y} r={r + 2.5} fill="#fff" />
                <circle cx={s.x} cy={s.y} r={r} fill={fill} stroke="#fff" strokeWidth={1.5} />
                <text
                  x={s.x}
                  y={s.y - (r + 6)}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={700}
                  fill="#0f172a"
                  stroke="#ffffff"
                  strokeWidth={3.5}
                  paintOrder="stroke"
                  style={{ pointerEvents: "none" }}
                >
                  {s.name}
                </text>
              </g>
            );
          })}

          {/* The travelling car */}
          <g ref={carRef} transform={`translate(${start.x} ${start.y})`}>
            <ellipse cx={0} cy={0} rx={14} ry={7} fill="#0f172a" opacity={0.18} />
            <g>
              <rect x={-12} y={-6} width={24} height={12} rx={5} fill="#0f172a" />
              <rect x={-11} y={-5} width={22} height={10} rx={4} fill="#1e293b" />
              <rect x={2} y={-5} width={7} height={10} rx={2.5} fill="#7dd3fc" opacity={0.95} />
              <rect x={-8} y={-5} width={5} height={10} rx={2} fill="#38bdf8" opacity={0.55} />
              <circle cx={11.5} cy={0} r={1.6} fill="#fde68a" />
            </g>
          </g>
        </svg>

        <p className="pointer-events-none absolute bottom-2 right-3 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-500 backdrop-blur-sm">
          Illustrative route · not to scale
        </p>
      </div>
    </div>
  );
}
