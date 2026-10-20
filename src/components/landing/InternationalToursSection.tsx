"use client";

import Link from "next/link";
import { ArrowRight, FileCheck2, ShieldCheck, Stamp } from "lucide-react";
import { EmblaRow } from "@/components/ui/EmblaRow";
import { PageContainer } from "@/components/ui/PageContainer";
import { TourCard } from "@/components/shared/TourCard";
import { useCurrency } from "@/hooks/useCurrency";
import type { CurrencyCode } from "@/lib/money";
import type { FeaturedTour } from "./FeaturedToursCarousel";

const HELP_LINKS = [
  { href: "/visa-invitation", label: "Visa invitation letter", icon: Stamp },
  { href: "/pakistan-tourist-visa-guide", label: "Tourist visa guide", icon: FileCheck2 },
  { href: "/is-pakistan-safe-for-tourists", label: "Is Pakistan safe?", icon: ShieldCheck },
];

/**
 * Home-page band for tours marked "International" in the admin
 * (audience = "foreigners"). Renders nothing until at least one exists.
 */
export function InternationalToursSection({
  tours,
  initialCurrency,
}: {
  tours: FeaturedTour[];
  initialCurrency?: CurrencyCode;
}) {
  const currency = useCurrency(initialCurrency);
  const international = tours.filter((t) => t.audience === "foreigners");
  if (international.length === 0) return null;

  return (
    <section className="bg-brand-primary py-12 text-white md:py-16" aria-labelledby="intl-tours">
      <PageContainer>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          {/* SectionHeader's "onDark" variant keeps dark text, so the header is inline here. */}
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              Travelling from abroad?
            </p>
            <h2
              id="intl-tours"
              className="mt-3 text-[32px] font-semibold leading-[1.18] tracking-tight text-white sm:text-[40px] sm:leading-[1.14] lg:text-[48px] lg:leading-[1.125]"
            >
              International tours
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/80 md:text-lg">
              Routes planned for overseas travellers — we help with your visa invitation letter and
              handle transport, stays and guides on the ground.
            </p>
          </div>
          <Link
            href="/tours?audience=foreigners"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-primary shadow-sm transition hover:bg-white/90 lg:self-auto"
          >
            View all international tours
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <ul className="mt-6 flex flex-wrap gap-2">
          {HELP_LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white/60 hover:text-white"
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 md:mt-10">
          <EmblaRow
            itemLabel="international tour"
            slideClassName="min-w-0 flex-[0_0_90%] sm:flex-[0_0_55%] lg:flex-[0_0_36%] xl:flex-[0_0_32%]"
          >
            {international.map((t) => (
              <TourCard key={t._id} tour={t} currency={currency} />
            ))}
          </EmblaRow>
        </div>
      </PageContainer>
    </section>
  );
}
