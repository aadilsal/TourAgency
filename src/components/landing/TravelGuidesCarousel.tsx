"use client";

import Link from "next/link";
import { EmblaRow } from "@/components/ui/EmblaRow";
import { ButtonLink } from "@/components/ui/Button";

export type GuideItem = {
  href: string;
  title: string;
  description?: string;
  image: string;
};

export function TravelGuidesCarousel({ items }: { items: GuideItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-border py-10 md:py-14">
      <div className="mx-auto max-w-content px-6 md:px-12 lg:px-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              Travel guides
            </h2>
            <p className="mt-2 text-muted">
              Swipe for stories and tips — drag with your mouse on desktop.
            </p>
          </div>
          <ButtonLink
            href="/blog"
            variant="ghost"
            className="shrink-0 py-2 text-foreground hover:bg-havezic-background-light"
          >
            View all →
          </ButtonLink>
        </div>
        <div className="mt-8">
          <EmblaRow slideClassName="min-w-0 flex-[0_0_90%] sm:flex-[0_0_55%] lg:flex-[0_0_36%] xl:flex-[0_0_32%]">
            {items.map((a, i) => (
              <Link
                key={`${a.href}-${a.title}-${i}`}
                href={a.href}
                className="group block h-full overflow-hidden rounded-2xl border border-border bg-background shadow-[0_14px_36px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5"
              >
                <div className="relative aspect-[16/10] bg-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.image}
                    alt=""
                    className="h-full w-full object-cover transition duration-600 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/80 to-transparent opacity-60" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-foreground">{a.title}</h3>
                  {a.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {a.description}
                    </p>
                  ) : null}
                  <span className="mt-3 inline-block text-sm font-semibold text-brand-accent">
                    Read →
                  </span>
                </div>
              </Link>
            ))}
          </EmblaRow>
        </div>
      </div>
    </section>
  );
}
