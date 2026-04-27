"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/cn";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

type Dest = { slug: string; name: string; heroUrl?: string; tourCount?: number };

function DestinationMiniCard({
  slug,
  label,
  badge,
  image,
}: {
  slug: string;
  label: string;
  badge?: string;
  image?: string;
}) {
  return (
    <Link
      href={`/destinations/${slug}`}
      className="group relative h-[96px] w-[128px] shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-havezic-primary/40"
      title={label}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition group-hover:from-black/80" />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-havezic-primary text-white shadow-[0_10px_24px_rgba(251,91,50,0.35)]">
          <ArrowRight className="h-4 w-4" aria-hidden />
        </div>
      </div>
      {badge ? (
        <span className="absolute left-2 top-2 rounded-full bg-havezic-secondary px-2 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
      <p className="absolute bottom-2 left-2 right-2 truncate text-sm font-semibold text-white">
        {label}
      </p>
    </Link>
  );
}

function PhoneMock({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-[min(330px,56vw)] max-w-[380px]">
      <div className="absolute -inset-1 rounded-[44px] bg-black/20 blur-md" aria-hidden />
      <div className="relative overflow-hidden rounded-[44px] bg-[#0B0F18] p-[10px] shadow-[0_28px_70px_rgba(0,0,0,0.45)]">
        <div className="relative overflow-hidden rounded-[36px] bg-white">
          {/* notch */}
          <div
            className="pointer-events-none absolute left-1/2 top-2 z-20 h-6 w-32 -translate-x-1/2 rounded-full bg-black/90"
            aria-hidden
          />
          {/* screen */}
          <div className="relative aspect-[9/19] w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function NewsletterSection({ className }: { className?: string }) {
  const destinations = useQuery(api.destinations.listForIndex, {}) as Dest[] | undefined;
  const createLead = useMutation(api.leads.createLead);

  const chips = useMemo(() => {
    const d = destinations ?? [];
    return d.slice(0, 8).map((x) => ({
      slug: x.slug,
      label: x.name,
      badge: typeof x.tourCount === "number" ? `${x.tourCount} Tours` : undefined,
      image: x.heroUrl,
    }));
  }, [destinations]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createLead({
        name: name.trim() || "Newsletter",
        phone: phone.trim() || email.trim() || "n/a",
        source: "Manual",
        message: [
          "Newsletter / homepage",
          email.trim() ? `Email: ${email.trim()}` : null,
          message.trim() ? `Message: ${message.trim()}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      });
      setSent(true);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={cn("py-10 md:py-14", className)} aria-label="Newsletter">
      <PageContainer>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card className="overflow-hidden rounded-[28px] border border-border bg-[#EEF0FF] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-havezic-primary">
              Get in touch with us
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Subscribe To Our
              <br />
              News Letter
            </h2>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-havezic-primary" aria-hidden />
                Subscriber only deals
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-havezic-primary" aria-hidden />
                Easy trip planning
              </span>
            </div>

            {sent ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Thanks — we received your message.
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="h-11 rounded-full border border-border bg-white px-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-havezic-primary/20"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your Phone Number"
                  className="h-11 rounded-full border border-border bg-white px-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-havezic-primary/20"
                />
              </div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="h-11 w-full rounded-full border border-border bg-white px-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-havezic-primary/20"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your Message"
                rows={5}
                className="w-full resize-none rounded-3xl border border-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-havezic-primary/20"
              />
              <Button
                type="submit"
                variant="primary"
                className="mt-2 rounded-full px-7 py-3 text-sm"
                disabled={saving}
              >
                {saving ? "Submitting…" : "Submit"}
              </Button>
            </form>
          </Card>

          <div className="relative overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-[#F3B4A9] via-[#C5B0FF] to-[#7AA6FF]">
            <div className="absolute inset-0 opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://demo2wpopal.b-cdn.net/havezic/wp-content/uploads/2024/08/h4_bg2.jpg"
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-black/20" />

            <div className="relative grid h-full grid-rows-[1fr_auto] gap-4 p-6 md:p-8">
              <div className="flex items-end justify-center lg:justify-start">
                <PhoneMock>
                  <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-[#F4F6FF]" />

                  {/* top mini app header */}
                  <div className="relative flex items-center justify-between px-5 pt-10">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-havezic-primary text-white shadow-[0_10px_24px_rgba(251,91,50,0.35)]">
                        <Sparkles className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="leading-tight">
                        <p className="text-xs font-semibold text-foreground">Junket Tours</p>
                        <p className="text-[11px] text-muted">Trusted trips</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold text-muted">
                      Deals
                    </span>
                  </div>

                  {/* hero hook */}
                  <div className="relative mt-4 px-5">
                    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
                      <div className="relative h-[92px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80"
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-center px-4 text-left">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                            Limited slots
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            Find your next escape
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <p className="text-xs text-muted">
                          Tap a destination to explore
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-havezic-primary">
                          Open <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* carousel INSIDE phone screen */}
                  <div className="absolute inset-x-0 bottom-0 px-4 pb-6">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                      Top destinations
                    </p>
                    <p className="mt-1 text-center text-sm font-semibold text-foreground">
                      Find yourself far away
                    </p>
                    <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {chips.map((c) => (
                        <DestinationMiniCard
                          key={c.slug}
                          slug={c.slug}
                          label={c.label}
                          badge={c.badge}
                          image={c.image}
                        />
                      ))}
                    </div>
                  </div>
                </PhoneMock>
              </div>

              <div className="hidden lg:block" />
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

