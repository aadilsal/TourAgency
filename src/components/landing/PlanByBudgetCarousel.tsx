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
    subtitle: "Weekend & shorter northern loops",
    href: "/tours?max=50000",
    image:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Under PKR 100,000",
    subtitle: "Mid-range comfort & longer trips",
    href: "/tours?max=100000",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Under PKR 150,000",
    subtitle: "Comfort upgrades & extended itineraries",
    href: "/tours?max=150000",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "PKR 150,000 & above",
    subtitle: "Premium stays & private transport",
    href: "/tours?min=150000",
    image:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
  },
];

export function PlanByBudgetCarousel() {
  return (
    <section className="border-y border-white/10 bg-gradient-to-br from-brand-primary via-brand-primary-dark to-slate-900 py-16 text-white md:py-24">
      <PageContainer>
        <h2 className="font-display text-3xl font-semibold md:text-4xl">
          Plan by budget
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
          Drag or swipe — each card opens filtered tours. Not sure? Ask our AI
          planner.
        </p>
        <div className="mt-12">
          <EmblaRow slideClassName="min-w-0 flex-[0_0_88%] sm:flex-[0_0_65%] md:flex-[0_0_48%] lg:flex-[0_0_38%]">
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
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                  <h3 className="text-2xl font-bold">{s.title}</h3>
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
