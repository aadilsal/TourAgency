"use client";

import { cn } from "@/lib/cn";

// This matches the downloaded `public/maps/pakistan-provinces.svg` nominal size.
export const PAKISTAN_MAP_VIEWBOX = "0 0 866.66669 819.94934";
export const PAKISTAN_MAP_WIDTH = 866.66669;
export const PAKISTAN_MAP_HEIGHT = 819.94934;

export function PakistanMapSvg({
  className,
  opacity = 0.9,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      className={cn("h-full w-full", className)}
      viewBox={PAKISTAN_MAP_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <image
        href="/maps/pakistan-provinces.svg"
        x={0}
        y={0}
        width={PAKISTAN_MAP_WIDTH}
        height={PAKISTAN_MAP_HEIGHT}
        opacity={opacity}
      />
    </svg>
  );
}

