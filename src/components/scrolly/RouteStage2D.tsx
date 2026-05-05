"use client";

import { cn } from "@/lib/cn";
import type { ScrollyChapterConfig } from "./scrollyConfig";
import { PakistanMapSvg, PAKISTAN_MAP_VIEWBOX } from "./PakistanMapSvg";
import { SCROLLY_ROUTE_POINTS } from "./scrollyConfig";
import React from "react";

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
  interactiveMarkers,
  onMarkerTap,
  activeChapterId,
  progress,
  enablePanZoom,
  showPerks = true,
}: {
  chapters: ScrollyChapterConfig[];
  className?: string;
  interactiveMarkers?: boolean;
  onMarkerTap?: (chapterId: string) => void;
  activeChapterId?: string;
  progress?: number;
  enablePanZoom?: boolean;
  showPerks?: boolean;
}) {
  // Stage renders all scenes layered; GSAP will crossfade and animate progress.
  const active = chapters.find((c) => c.id === activeChapterId) ?? chapters[0];
  const p = Math.min(1, Math.max(0, progress ?? 0));

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-3xl border border-border",
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

      <div className="absolute left-4 top-4 sm:left-6 sm:top-6 rounded-2xl border border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          Journey reel
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground" data-scrolly-stage-title>
          {active.eyebrow}
        </p>
      </div>

      <div
        className={cn(
          "absolute inset-0 z-10",
          interactiveMarkers ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
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
            const activePt = active.mapPoint;

            // Pan/zoom on mobile: translate to center, scale, translate back to active city point.
            // Using viewBox numbers directly keeps it stable across resize.
            const viewW = 866.66669;
            const viewH = 819.94934;
            const cx = (active.mobileViewport?.cx ?? 0.5) * viewW;
            const cy = (active.mobileViewport?.cy ?? 0.48) * viewH;
            const zoom = enablePanZoom ? (active.mobileViewport?.zoom ?? 1.85) : 1;
            const viewportTransform = enablePanZoom
              ? `translate(${cx} ${cy}) scale(${zoom}) translate(${-activePt.x} ${-activePt.y})`
              : undefined;

            const clickTo = (chapterId: string) => {
              if (!interactiveMarkers || !onMarkerTap) return;
              onMarkerTap(chapterId);
            };

            const keyTo = (e: React.KeyboardEvent<SVGGElement>, chapterId: string) => {
              if (!interactiveMarkers || !onMarkerTap) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onMarkerTap(chapterId);
              }
            };

            return (
              <g data-map-viewport transform={viewportTransform}>
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
                  style={
                    progress !== undefined
                      ? ({
                          strokeDashoffset: `${1 - p}`,
                        } as React.CSSProperties)
                      : undefined
                  }
                />

                {chapters.map((c) => {
                  const mp = c.mapPoint;
                  const isActive = c.id === activeChapterId;
                  const showLabel = !enablePanZoom || !interactiveMarkers || isActive;
                  return (
                    <g
                      key={c.id}
                      data-city-marker={c.id}
                      role={interactiveMarkers ? "button" : undefined}
                      tabIndex={interactiveMarkers ? 0 : undefined}
                      onClick={() => clickTo(c.id)}
                      onKeyDown={(e) => keyTo(e, c.id)}
                      className={interactiveMarkers ? "cursor-pointer focus:outline-none" : undefined}
                      aria-label={interactiveMarkers ? `Go to ${mp.label}` : undefined}
                    >
                      {interactiveMarkers ? (
                        <circle
                          cx={mp.x}
                          cy={mp.y}
                          r="24"
                          fill="transparent"
                          style={{ pointerEvents: "all" }}
                        />
                      ) : null}
                      <circle cx={mp.x} cy={mp.y} r="6.5" fill="rgba(255,255,255,0.88)" />
                      <circle cx={mp.x} cy={mp.y} r="12" fill="rgba(255,255,255,0.12)" />
                      {showLabel ? (
                        <text
                          x={mp.x + 14}
                          y={mp.y + 5}
                          fill={isActive ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.64)"}
                          fontWeight="750"
                          style={{ fontSize: "clamp(12px, 2.6vw, 18px)" }}
                        >
                          {mp.label}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </svg>
      </div>

      {showPerks ? (
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 grid gap-3 md:grid-cols-3">
          {[
            { k: "Private 4x4", v: "Comfort from pickup to drop-off" },
            { k: "Premium stays", v: "Handpicked hotels, better locations" },
            { k: "Personal guide", v: "Zero-hassle, end-to-end support" },
          ].map((c) => (
            <div
              key={c.k}
              className="rounded-2xl border border-border bg-background/80 px-4 py-3 backdrop-blur-md"
            >
              <p className="text-xs font-bold text-foreground">{c.k}</p>
              <p className="mt-1 text-xs text-muted">{c.v}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

