"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** Intrepid-style hero: one large image + a thumbnail strip; click a thumb to swap. */
export function TourHeroGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const list = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const hero = list[active] ?? list[0];

  if (list.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 text-sm text-slate-500">
        Photos coming soon
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero}
          alt={title}
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      </div>
      {list.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {list.slice(0, 5).map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-lg ring-1 transition",
                i === active
                  ? "ring-2 ring-havezic-primary"
                  : "ring-black/5 hover:ring-black/20",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              {i === 4 && list.length > 5 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs font-bold text-white">
                  All photos ({list.length})
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
