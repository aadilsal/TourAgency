import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, FileText, Home, MessageCircle, Search, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageContainer } from "@/components/ui/PageContainer";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { getWhatsAppClickUrl } from "@/lib/whatsapp-server";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { BUSINESS, formatBusinessAddress } from "@/config/business";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Page not found",
  description: "Sorry, we couldn't find that page. Browse Pakistan heritage tours or talk to our travel team.",
  robots: { index: false, follow: true },
};

const POPULAR_LINKS = [
  { href: "/tours", label: "All Pakistan tours", icon: Compass },
  { href: "/destinations", label: "Destinations", icon: Compass },
  { href: "/visa-invitation", label: "Visa invitation letter", icon: FileText },
  { href: "/pakistan-tourist-visa-guide", label: "Pakistan visa guide", icon: FileText },
  { href: "/is-pakistan-safe-for-tourists", label: "Is Pakistan safe?", icon: FileText },
  { href: "/contact", label: "Contact us", icon: MessageCircle },
];

async function loadPopularTours(): Promise<Array<{ slug: string; title: string; durationDays: number }>> {
  try {
    const client = getConvexServer();
    const tours = (await client.query(api.tours.listActiveToursForExplore, {})) as Array<{
      slug: string;
      title: string;
      durationDays: number;
    }>;
    return tours.slice(0, 4);
  } catch {
    return [];
  }
}

/**
 * Root 404. Rendered outside the (site) route-group layout, so it brings its
 * own header/footer to look like the rest of the site.
 */
export default async function NotFound() {
  const [whatsappUrl, tours] = await Promise.all([
    getWhatsAppClickUrl("Hi JunketTours — I was looking for a page on your website and need help planning a trip."),
    loadPopularTours(),
  ]);

  return (
    <div className="relative z-[1] flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-16 md:py-24">
        <PageContainer className="max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-havezic-primary">Error 404</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            This trail doesn&apos;t lead anywhere
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
            The page you&apos;re looking for may have moved, or the tour is no longer running.
            Let&apos;s get you back on the road.
          </p>

          <form action="/tours" method="get" role="search" className="mx-auto mt-8 flex max-w-lg gap-2">
            <label htmlFor="nf-search" className="sr-only">
              Search tours
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="nf-search"
                name="q"
                type="search"
                placeholder="Search tours, e.g. Lahore, Hunza"
                className="min-h-11 w-full rounded-xl border border-border bg-white py-3 pl-9 pr-3 text-base text-foreground shadow-sm outline-none focus:border-havezic-primary focus:ring-2 focus:ring-havezic-primary/20 sm:text-sm"
              />
            </div>
            <button type="submit" className={buttonClass("primary")}>
              Search
            </button>
          </form>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/ai-planner" variant="primary">
              <Sparkles className="h-4 w-4" aria-hidden />
              Plan my trip
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonClass("secondary"),
                  "border-emerald-200 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50",
                )}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                WhatsApp us
              </a>
            ) : null}
            <ButtonLink href="/" variant="ghost">
              <Home className="h-4 w-4" aria-hidden />
              Back home
            </ButtonLink>
          </div>
        </PageContainer>

        <PageContainer className="mt-14 max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            {tours.length > 0 ? (
              <section aria-labelledby="nf-tours" className="rounded-2xl border border-border bg-white p-6 text-left shadow-card">
                <h2 id="nf-tours" className="text-lg font-bold text-foreground">
                  Popular tours
                </h2>
                <ul className="mt-4 divide-y divide-border">
                  {tours.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/tours/${t.slug}`}
                        className="flex min-h-11 items-center justify-between gap-3 py-3 text-sm font-medium text-foreground hover:text-havezic-primary"
                      >
                        <span>{t.title}</span>
                        {t.durationDays > 0 ? (
                          <span className="shrink-0 text-xs text-muted">{t.durationDays} days</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <section
              aria-labelledby="nf-links"
              className={cn(
                "rounded-2xl border border-border bg-white p-6 text-left shadow-card",
                tours.length === 0 && "md:col-span-2",
              )}
            >
              <h2 id="nf-links" className="text-lg font-bold text-foreground">
                Helpful links
              </h2>
              <ul className="mt-4 divide-y divide-border">
                {POPULAR_LINKS.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex min-h-11 items-center gap-3 py-3 text-sm font-medium text-foreground hover:text-havezic-primary"
                    >
                      <Icon className="h-4 w-4 text-havezic-primary" aria-hidden />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </PageContainer>
      </main>
      <SiteFooter
        whatsappUrl={whatsappUrl}
        contactPhone={BUSINESS.phoneDisplay}
        officeAddress={formatBusinessAddress()}
        mapsEmbedUrl={process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL}
      />
    </div>
  );
}
