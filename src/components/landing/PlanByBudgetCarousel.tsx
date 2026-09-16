"use client";

import Link from "next/link";
import { EmblaRow } from "@/components/ui/EmblaRow";
import { PageContainer } from "@/components/ui/PageContainer";

const SLIDES: {
  title: string;
  subtitle: string;
  href: string;
  image: string;
}[] = [
  {
    title: "Under PKR 50,000",
    subtitle: "Heritage weekends & northern valley loops",
    href: "/tours?max=50000",
    image: "/images/marketing/budget-under-50k.jpg",
  },
  {
    title: "Under PKR 100,000",
    subtitle: "Mid-range comfort & longer trips",
    href: "/tours?max=100000",
    image: "/images/marketing/budget-under-100k.jpg",
  },
  {
    title: "Under PKR 150,000",
    subtitle: "Comfort upgrades & extended itineraries",
    href: "/tours?max=150000",
    image: "/images/marketing/budget-under-150k.jpg",
  },
  {
    title: "PKR 150,000 & above",
    subtitle: "Premium stays & private transport",
    href: "/tours?min=150000",
    image: "/images/marketing/budget-premium.jpg",
  },
];

export function PlanByBudgetCarousel() {
  return (
    <section className="border-y border-white/10 bg-gradient-to-br from-brand-primary via-brand-primary-dark to-slate-900 py-12 text-white sm:py-16 md:py-24">
      <PageContainer>
        <h2 className="font-display text-3xl font-semibold md:text-4xl">
          Plan by budget
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
          Drag or swipe — each card opens filtered tours. Not sure? Ask our AI
          planner.
        </p>
        <div className="mt-8 md:mt-12">
          <EmblaRow
            itemLabel="budget"
            arrowButtonClassName="border-white/20 bg-white/10 text-white hover:bg-white/20"
            slideClassName="min-w-0 flex-[0_0_88%] sm:flex-[0_0_65%] md:flex-[0_0_48%] lg:flex-[0_0_38%]">
            {SLIDES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group relative block h-[min(20rem,58vw)] overflow-hidden rounded-2xl shadow-card transition-shadow hover:shadow-card-hover"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 md:p-8">
                  <h3 className="text-xl font-bold sm:text-2xl">{s.title}</h3>
                  <p className="mt-2 text-sm text-white/85">{s.subtitle}</p>
                  <span className="mt-3 inline-flex text-sm font-semibold text-brand-accent">
                    View tours →
                  </span>
                </div>
              </Link>
            ))}
          </EmblaRow>
        </div>
      </PageContainer>
    </section>
  );
}
