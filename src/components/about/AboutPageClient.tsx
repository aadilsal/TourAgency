"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmblaRow } from "@/components/ui/EmblaRow";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { cn } from "@/lib/cn";

type TeamMember = {
  _id: string;
  name: string;
  role: string;
  imageUrl: string | null;
};

type AboutContent = {
  eyebrow: string;
  heading: string;
  tabs: {
    explore: { title: string; body: string[]; image: string };
    mission: { title: string; body: string[]; image: string };
    vision: { title: string; body: string[]; image: string };
  };
  stats: { value: string; label: string }[];
  partners: { name: string; logoUrl: string | null }[];
  updatedAt: number;
} | null;

const TABS = [
  { id: "explore", label: "Explore" },
  { id: "mission", label: "Our Mission" },
  { id: "vision", label: "Our Vision" },
] as const;

export function AboutPageClient({
  team,
  content,
}: {
  team: TeamMember[];
  content: AboutContent;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("explore");

  const tabContent = useMemo(() => {
    if (content?.tabs) {
      if (tab === "mission") return content.tabs.mission;
      if (tab === "vision") return content.tabs.vision;
      return content.tabs.explore;
    }
    if (tab === "mission") {
      return {
        title: "Make Adventure Travel Possible for All",
        body: [
          "As a wide range of tourism services is offered by Junkettours, including adventure, culture, city exploration, and personalized tours.",
          "Our knowledge guarantees an effortless and pleasurable travel experience, meeting strict security protocols and compliance standards.",
          "We organize hiking, mountaineering, sightseeing, and other adventure travel. We specialize in Hunza, Gilgit, Skardu, Kashmir, Swat, and Naran — we provide complete tour packages that include accommodations and vehicle rental.",
        ],
        image:
          "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80",
      };
    }
    if (tab === "vision") {
      return {
        title: "Offer Travelers an Organized and Exciting Tour Experience",
        body: [
          "Our offer is to enrich vacation experiences that have been carefully organized in order to encourage adventure, create memories, and learn about new cultures.",
          "Our mild but effective service mixes quality, attentive care, and pleasant experiences throughout.",
          "Stay connected: Follow us on Facebook & Instagram. Get in touch with the Junket tour team at WhatsApp: +92 320 9973486.",
        ],
        image:
          "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=80",
      };
    }
    return {
      title: "Junkettours is your Reliable Travel Partner",
      body: [
        "Junkettours is one of Pakistan’s top Certified Adventure travel platforms. Junket Tour is a Government Registered Tourism Management Company having NTN No. PA-775557.",
        "We have been providing guided and personalized travel experiences for both domestic and international tourists, including families, students, corporate groups, and solo adventurers, for over 6 years.",
        "We deliver and manage memorable tourism experiences all over Pakistan, including all the northern areas. To help with the entire booking and travel process, Junkettours’ travel specialists are accessible online 24/7.",
      ],
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    };
  }, [content, tab]);

  const eyebrow = content?.eyebrow ?? "Community friendly";
  const heading = content?.heading ?? "Your Reliable Travel Partner";

  const stats =
    content?.stats?.length && content.stats.length >= 2
      ? content.stats.slice(0, 2)
      : [
          { value: "150k+", label: "Satisfied clients" },
          { value: "100+", label: "Our hard working staff" },
        ];

  const partners =
    content?.partners?.length && content.partners.length > 0
      ? content.partners
      : [
          { name: "FBR Pakistan", logoUrl: null },
          { name: "Tourism", logoUrl: null },
          { name: "SCP", logoUrl: null },
          { name: "NATO", logoUrl: null },
        ];

  return (
    <>
      <section className="relative overflow-hidden bg-brand-primary text-white">
        <div className="absolute inset-0 opacity-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=2000&q=60"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/55" />
        <PageContainer className="relative py-16 md:py-20">
          <h1 className="text-center font-display text-4xl font-semibold tracking-tight md:text-5xl">
            About Us
          </h1>
        </PageContainer>
      </section>

      <section className="py-12 md:py-16">
        <PageContainer>
          <SectionHeader
            align="center"
            eyebrow={eyebrow}
            title={heading}
            description=""
          />

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border bg-havezic-background-light px-4 pt-4">
                <div className="flex flex-wrap gap-2">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold transition",
                        tab === t.id
                          ? "bg-white text-foreground shadow-sm ring-1 ring-border"
                          : "text-muted hover:bg-white/70 hover:text-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 p-6 md:p-7">
                <h2 className="text-lg font-bold text-foreground">{tabContent.title}</h2>
                <div className="space-y-3 text-sm leading-relaxed text-muted">
                  {tabContent.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>

                {tab === "explore" ? (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-havezic-background-light px-5 py-4 ring-1 ring-border">
                      <p className="text-2xl font-extrabold text-havezic-primary">
                        {stats[0]?.value ?? "150k+"}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
                        {stats[0]?.label ?? "Satisfied clients"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-havezic-background-light px-5 py-4 ring-1 ring-border">
                      <p className="text-2xl font-extrabold text-havezic-primary">
                        {stats[1]?.value ?? "100+"}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
                        {stats[1]?.label ?? "Our hard working staff"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card className="relative overflow-hidden p-0">
              <Image
                src={tabContent.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 480px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            </Card>
          </div>

          <div className="mt-14">
            <p className="text-center text-xs font-semibold text-muted">
              Our partners in holiday experiences
            </p>
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-havezic-background-light px-6 py-6">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-muted">
                {partners.map((p) => (
                  <span
                    key={p.name}
                    className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 ring-1 ring-border"
                    title={p.name}
                  >
                    {p.logoUrl ? (
                      <span className="relative h-7 w-20">
                        <Image src={p.logoUrl} alt={p.name} fill className="object-contain" />
                      </span>
                    ) : (
                      p.name
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="py-10 md:py-14">
        <PageContainer>
          <SectionHeader
            align="center"
            eyebrow="Meet the team"
            title="The Crew Behind Your Adventure"
            description=""
          />

          <div className="mt-10">
            {team.length === 0 ? (
              <p className="text-center text-sm text-muted">
                Team coming soon.
              </p>
            ) : (
              <EmblaRow
                slideClassName="min-w-0 flex-[0_0_78%] sm:flex-[0_0_42%] lg:flex-[0_0_25%]"
                autoplayMs={2500}
              >
                {team.map((m) => (
                  <Card key={m._id} className="h-full overflow-hidden p-0">
                    <div className="relative h-56 w-full bg-havezic-background-light">
                      {m.imageUrl ? (
                        <Image
                          src={m.imageUrl}
                          alt=""
                          fill
                          sizes="320px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="p-5 text-center">
                      <p className="text-sm font-bold text-foreground">{m.name}</p>
                      <p className="mt-1 text-xs text-muted">{m.role}</p>
                    </div>
                  </Card>
                ))}
              </EmblaRow>
            )}
          </div>
        </PageContainer>
      </section>

      <section className="bg-havezic-background-light py-2">
        <TestimonialsCarousel />
      </section>
    </>
  );
}

