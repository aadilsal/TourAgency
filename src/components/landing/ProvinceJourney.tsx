"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROVINCES } from "@/lib/provinces-data";
import { PakistanMapSvg } from "@/components/scrolly/PakistanMapSvg";
import { PageContainer } from "@/components/ui/PageContainer";
import { cn } from "@/lib/cn";

/** Approx marker positions on the Pakistan map (% of the map box), south→north. */
const POSITIONS: Record<string, { left: number; top: number }> = {
  sindh: { left: 41, top: 78 },
  balochistan: { left: 23, top: 67 },
  punjab: { left: 61, top: 55 },
  islamabad: { left: 57, top: 41 },
  kpk: { left: 47, top: 35 },
  "gilgit-baltistan": { left: 63, top: 18 },
  "azad-kashmir": { left: 71, top: 29 },
};

export function ProvinceJourney() {
  const provinces = useMemo(() => PROVINCES, []);
  const [active, setActive] = useState(0);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const activeProvince = provinces[active] ?? provinces[0]!;
  const accent = activeProvince.palette.accent;
  const progress =
    provinces.length <= 1 ? 0 : active / (provinces.length - 1);

  const routePoints = useMemo(
    () =>
      provinces
        .map((p) => {
          const pos = POSITIONS[p.slug];
          return pos ? `${pos.left},${pos.top}` : null;
        })
        .filter(Boolean)
        .join(" "),
    [provinces],
  );

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            if (Number.isFinite(idx)) setActive(idx);
          }
        }
      },
      // Only the card crossing the vertical centre is "active".
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [provinces.length]);

  function scrollToCard(i: number) {
    cardRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <section aria-label="Journey through Pakistan's provinces">
      <PageContainer>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
          {/* Sticky map */}
          <div className="sticky top-16 z-10 h-[42vh] min-h-[260px] self-start lg:top-24 lg:h-[calc(100vh-8rem)]">
            <div
              className="relative h-full overflow-hidden rounded-3xl ring-1 ring-black/10 transition-colors duration-700"
              style={{
                background: `radial-gradient(120% 90% at 50% 10%, ${accent.replace(/0?\.\d+\)/, "0.16)")} 0%, rgba(2,6,23,0.04) 55%, rgba(2,6,23,0.02) 100%)`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
                <div className="relative aspect-[866/819] w-full max-w-[520px]">
                  <PakistanMapSvg className="opacity-90" />

                  {/* south → north route */}
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    aria-hidden
                  >
                    <polyline
                      points={routePoints}
                      fill="none"
                      stroke="rgba(15,23,42,0.18)"
                      strokeWidth={0.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points={routePoints}
                      pathLength={100}
                      fill="none"
                      stroke={accent}
                      strokeWidth={1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={100}
                      strokeDashoffset={100 * (1 - progress)}
                      style={{ transition: "stroke-dashoffset 700ms ease" }}
                    />
                  </svg>

                  {/* markers */}
                  {provinces.map((p, i) => {
                    const pos = POSITIONS[p.slug];
                    if (!pos) return null;
                    const isActive = i === active;
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => scrollToCard(i)}
                        aria-label={`Go to ${p.name}`}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                      >
                        <span className="relative flex items-center justify-center">
                          {isActive ? (
                            <span
                              className="absolute h-6 w-6 animate-ping rounded-full"
                              style={{ backgroundColor: accent, opacity: 0.35 }}
                            />
                          ) : null}
                          <span
                            className={cn(
                              "block rounded-full ring-2 ring-white transition-all duration-300",
                              isActive ? "h-4 w-4 shadow-lg" : "h-2.5 w-2.5",
                            )}
                            style={{
                              backgroundColor: isActive ? accent : "rgba(100,116,139,0.9)",
                            }}
                          />
                        </span>
                        {isActive ? (
                          <span
                            className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-900 shadow"
                          >
                            {p.name}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* caption chip */}
              <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-white/85 p-2.5 shadow-lg ring-1 ring-black/5 backdrop-blur md:inset-x-4 md:bottom-4 md:p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeProvince.heroImage}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-lg object-cover md:h-12 md:w-12"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-havezic-primary">
                    {activeProvince.scrollyEyebrow}
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {activeProvince.name}
                  </p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-slate-900/90 px-2.5 py-1 text-xs font-bold text-white">
                  {active + 1} / {provinces.length}
                </span>
              </div>
            </div>
          </div>

          {/* Province cards */}
          <div>
            {provinces.map((p, i) => (
              <div
                key={p.slug}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                data-idx={i}
                className="flex min-h-[68vh] items-center py-8"
              >
                <div
                  className={cn(
                    "w-full rounded-3xl border bg-panel p-6 shadow-sm transition-all duration-500 md:p-8",
                    i === active
                      ? "border-transparent shadow-xl"
                      : "border-border opacity-70",
                  )}
                  style={
                    i === active
                      ? { boxShadow: `0 20px 60px -20px ${p.palette.accent}` }
                      : undefined
                  }
                >
                  <div className="mb-5 h-40 overflow-hidden rounded-2xl md:h-48">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.heroImage}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p
                    className="text-xs font-bold uppercase tracking-[0.22em]"
                    style={{ color: p.palette.accent }}
                  >
                    {p.scrollyEyebrow}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {p.scrollyTitle}
                  </h3>
                  <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
                    {p.scrollyBullets.map((b) => (
                      <li key={b} className="flex gap-2.5">
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: p.palette.accent }}
                          aria-hidden
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  {p.scrollyStats?.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {p.scrollyStats.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-border bg-havezic-background-light px-3 py-1 text-xs font-semibold text-foreground/80"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <Link
                    href={`/guides/${p.slug}`}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
                    style={{ backgroundColor: p.palette.accent }}
                  >
                    Explore {p.name} guide
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
