import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, ArrowRight } from "lucide-react";
import { loadDestinationIndexRows } from "@/lib/destinations-server";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Explore Hunza, Skardu, Swat, Naran — guides and tours for each region across northern Pakistan.",
};

export default async function DestinationsIndexPage() {
  const byDestination = await loadDestinationIndexRows();

  return (
    <main className="min-h-screen py-16 md:py-24">
      <PageContainer>
        <SectionHeader
          variant="onDark"
          eyebrow="Northern Pakistan"
          title="Destinations"
          description="Choose a region for the full guide and every tour we list for that area. Hero imagery comes from Convex when you seed regions and upload tour photos."
        />

        <ul className="mt-12 grid items-stretch gap-8 md:grid-cols-2 xl:gap-10">
          {byDestination.map(
            ({ slug, name, line, heroUrl, tourCount, previewTours, moreCount }) => {
              const preview = previewTours;
              const rest = moreCount;

              return (
                <li key={slug} className="h-full">
                  <Card className="flex h-full min-h-[42rem] flex-col overflow-hidden p-0 shadow-card">
                    <Link
                      href={`/destinations/${slug}`}
                      className="group relative block h-80 bg-slate-200 outline-none ring-brand-accent transition focus-visible:ring-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroUrl}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-sm">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {tourCount} tour
                          {tourCount !== 1 ? "s" : ""}
                        </span>
                        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                          {name}
                        </h2>
                        <p className="mt-1 max-w-md text-sm text-white/90">
                          {line}
                        </p>
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-6">
                      {preview.length > 0 ? (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">
                            Tours in this region
                          </p>
                          <ul className="mt-3 space-y-2">
                            {preview.map((t) => (
                              <li key={t.slug}>
                                <Link
                                  href={`/tours/${t.slug}`}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-brand-surface/50 px-3 py-2.5 text-sm font-medium text-brand-ink transition hover:border-brand-accent/40 hover:bg-white"
                                >
                                  <span className="line-clamp-1">{t.title}</span>
                                  <span className="shrink-0 text-xs text-brand-accent">
                                    PKR {t.price.toLocaleString()}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                          {rest > 0 ? (
                            <p className="mt-2 text-xs text-brand-muted">
                              +{rest} more on the{" "}
                              <Link
                                href={`/destinations/${slug}`}
                                className="font-semibold text-brand-accent underline"
                              >
                                {name} page
                              </Link>
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-sm text-brand-muted">
                          No tours tagged for this region yet — see the{" "}
                          <Link
                            href={`/destinations/${slug}`}
                            className="font-semibold text-brand-accent underline"
                          >
                            {name} guide
                          </Link>{" "}
                          for planning tips, or{" "}
                          <Link
                            href="/tours"
                            className="font-semibold text-brand-accent underline"
                          >
                            browse all tours
                          </Link>
                          .
                        </p>
                      )}

                      <Link
                        href={`/destinations/${slug}`}
                        className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-brand-accent hover:underline"
                      >
                        Open {name} guide
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </Card>
                </li>
              );
            },
          )}
        </ul>

        <p className="mt-14 text-center text-sm text-brand-muted">
          Looking for something else?{" "}
          <Link href="/tours" className="font-semibold text-brand-accent underline">
            View every tour
          </Link>{" "}
          or{" "}
          <Link href="/ai-planner" className="font-semibold text-brand-accent underline">
            plan with AI
          </Link>
          .
        </p>
      </PageContainer>
    </main>
  );
}
