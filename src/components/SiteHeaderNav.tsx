"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  X,
  Sparkles,
  MapPin,
  BookOpen,
  Compass,
  HelpCircle,
  PhoneCall,
  LayoutDashboard,
  Shield,
  LogIn,
  Heart,
  User,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";
import { LogoutButton } from "./LogoutButton";
import { PageContainer } from "@/components/ui/PageContainer";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

type DestinationIndexRow = {
  slug: string;
  name: string;
  line: string;
  heroUrl: string;
  tourCount: number;
};

type SessionInfo = {
  email?: string;
  role?: string;
  name?: string;
} | null;

function prefersHoverFinePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function accountInitials(name?: string, email?: string): string {
  const n = (name ?? "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (
        (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
      ).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const local = (email ?? "").split("@")[0] ?? "";
  return local.slice(0, 2).toUpperCase() || "?";
}

function AccountDropdown({
  session,
  align = "right",
}: {
  session: NonNullable<SessionInfo>;
  align?: "right" | "full";
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initials = useMemo(
    () => accountInitials(session.name, session.email),
    [session.name, session.email],
  );

  const isAdmin =
    session.role === "admin" || session.role === "super_admin";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function clearCloseTimer() {
    if (closeT.current) {
      clearTimeout(closeT.current);
      closeT.current = null;
    }
  }

  function scheduleClose() {
    clearCloseTimer();
    closeT.current = setTimeout(() => setOpen(false), 160);
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  return (
    <div
      ref={wrapRef}
      className={cn("relative", align === "full" && "w-full")}
      onMouseEnter={() => {
        if (prefersHoverFinePointer()) openMenu();
      }}
      onMouseLeave={() => {
        if (prefersHoverFinePointer()) scheduleClose();
      }}
    >
      <button
        type="button"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-havezic-background text-xs font-bold uppercase tracking-wide text-foreground ring-1 ring-border transition hover:ring-havezic-primary/40",
          align === "full" && "h-10 w-10",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => {
          if (prefersHoverFinePointer()) return;
          setOpen((o) => !o);
        }}
      >
        {initials}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-[80] mt-2 min-w-[13.5rem] rounded-2xl border border-border bg-background py-2 shadow-[0_18px_44px_rgba(0,0,0,0.12)]",
              align === "right" ? "right-0" : "left-0 right-0",
            )}
            role="menu"
            onMouseEnter={() => {
              if (prefersHoverFinePointer()) clearCloseTimer();
            }}
            onMouseLeave={() => {
              if (prefersHoverFinePointer()) scheduleClose();
            }}
          >
            <p className="truncate px-4 pb-2 text-xs text-muted">
              {session.email}
            </p>
            <div className="border-t border-border" />
            <Link
              href="/dashboard"
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-havezic-background-light"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4 text-havezic-primary" aria-hidden />
              Dashboard
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-havezic-background-light"
                onClick={() => setOpen(false)}
              >
                <Shield className="h-4 w-4 text-havezic-primary/90" aria-hidden />
                Admin
              </Link>
            ) : null}
            <div className="border-t border-border px-4 pt-2">
              <LogoutButton className="w-full text-left text-muted hover:text-havezic-primary" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DestinationsMegaDropdown({
  pathname,
  destinations,
}: {
  pathname: string | null;
  destinations: DestinationIndexRow[] | undefined;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function clearCloseTimer() {
    if (closeT.current) {
      clearTimeout(closeT.current);
      closeT.current = null;
    }
  }

  function scheduleClose() {
    clearCloseTimer();
    closeT.current = setTimeout(() => setOpen(false), 180);
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  const active =
    pathname === "/destinations" ||
    pathname?.startsWith("/destinations/");

  const items = destinations ?? [];
  const showSpinner = destinations === undefined;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => {
        if (prefersHoverFinePointer()) openMenu();
      }}
      onMouseLeave={() => {
        if (prefersHoverFinePointer()) scheduleClose();
      }}
    >
      <Link
        href="/destinations"
        className={cn(
          "flex items-center gap-1 text-sm font-semibold text-white/90 transition-colors hover:text-havezic-primary",
          active && "text-havezic-primary",
          open && "text-havezic-primary",
        )}
        aria-expanded={open}
        aria-haspopup="true"
        onFocus={() => openMenu()}
      >
        Destinations
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-90 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </Link>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-1/2 top-full z-[80] w-[min(calc(100vw-2rem),720px)] -translate-x-1/2 pt-2"
            onMouseEnter={() => {
              if (prefersHoverFinePointer()) clearCloseTimer();
            }}
            onMouseLeave={() => {
              if (prefersHoverFinePointer()) scheduleClose();
            }}
          >
            <div
              className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_22px_56px_rgba(0,0,0,0.14)]"
              role="menu"
              aria-label="Destinations"
            >
              <div className="border-b border-border bg-havezic-background-light px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-havezic-primary">
                  Explore
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  Destinations
                </p>
                <p className="mt-1 text-sm text-muted">
                  Pick a region — each page lists matching tours and tips.
                </p>
              </div>

              <div className="max-h-[min(70vh,420px)] overflow-y-auto p-4">
                {showSpinner ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex gap-3 rounded-xl border border-border bg-havezic-background-light/80 p-2 animate-pulse"
                      >
                        <div className="h-16 w-20 shrink-0 rounded-lg bg-black/10" />
                        <div className="flex flex-1 flex-col gap-2 pt-1">
                          <div className="h-3 w-24 rounded bg-black/10" />
                          <div className="h-2 w-full rounded bg-black/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">
                    No destinations yet.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((d) => (
                      <Link
                        key={d.slug}
                        href={`/destinations/${d.slug}`}
                        role="menuitem"
                        className="group flex gap-3 rounded-xl border border-border bg-background p-2.5 text-left transition hover:border-havezic-primary/45 hover:bg-havezic-background-light hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)]"
                        onClick={() => setOpen(false)}
                      >
                        <div className="relative h-[4.5rem] w-[5.25rem] shrink-0 overflow-hidden rounded-lg bg-havezic-background-light">
                          <Image
                            src={d.heroUrl}
                            alt=""
                            fill
                            sizes="120px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="font-semibold leading-snug text-foreground">
                            {d.name}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
                            {d.line}
                          </p>
                          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-havezic-primary">
                            {d.tourCount}{" "}
                            {d.tourCount === 1 ? "tour" : "tours"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border bg-havezic-background-light px-4 py-3">
                <Link
                  href="/destinations"
                  className="flex items-center justify-center gap-2 rounded-xl bg-havezic-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-havezic-primary-hover"
                  onClick={() => setOpen(false)}
                >
                  View all destinations
                  <ChevronDown className="h-4 w-4 -rotate-90" aria-hidden />
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MobileDestinationsAccordion({
  pathname,
  destinations,
  expanded,
  onToggle,
  onPick,
}: {
  pathname: string | null;
  destinations: DestinationIndexRow[] | undefined;
  expanded: boolean;
  onToggle: () => void;
  onPick: () => void;
}) {
  const active =
    pathname === "/destinations" ||
    pathname?.startsWith("/destinations/");

  const items = destinations ?? [];
  const loading = destinations === undefined;

  return (
    <div className="rounded-xl border border-white/15 bg-white/5">
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-white",
          active && "text-havezic-primary",
        )}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-havezic-primary/90" aria-hidden />
          Destinations
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto px-2 pb-2 pt-1">
              <Link
                href="/destinations"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white/95 hover:bg-white/10"
                onClick={onPick}
              >
                All destinations
              </Link>
              {loading ? (
                <p className="px-3 py-2 text-xs text-white/60">Loading…</p>
              ) : (
                items.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/destinations/${d.slug}`}
                    className="rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                    onClick={onPick}
                  >
                    {d.name}
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function SiteHeaderNav({
  whatsappUrl,
  initialSession,
}: {
  whatsappUrl: string | null;
  initialSession: SessionInfo;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileDestOpen, setMobileDestOpen] = useState(false);
  const [liveSession, setLiveSession] = useState<SessionInfo>(initialSession);

  const indexDestinations = useQuery(
    api.destinations.listForIndex,
    {},
  ) as DestinationIndexRow[] | undefined;

  useEffect(() => {
    setLiveSession(initialSession);
  }, [initialSession]);

  useEffect(() => {
    if (!open) setMobileDestOpen(false);
  }, [open]);

  useEffect(() => {
    let cancelled = false;

    async function pullSession() {
      try {
        const r = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const j = (await r.json()) as {
          user: { email: string; name: string; role: string } | null;
        };
        if (cancelled) return;
        setLiveSession(
          j.user
            ? { email: j.user.email, name: j.user.name, role: j.user.role }
            : null,
        );
      } catch {
        /* keep current navbar state on transient errors */
      }
    }

    void pullSession();

    const onAuthChange = () => void pullSession();
    window.addEventListener("junket-auth-change", onAuthChange);

    const onVisible = () => {
      if (document.visibilityState === "visible") void pullSession();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("junket-auth-change", onAuthChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname, initialSession]);

  const links = useMemo(
    () => [
      { href: "/about", label: "About Us", icon: Compass },
      { href: "/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/contact", label: "Contact", icon: PhoneCall },
      { href: "/blog", label: "Guides", icon: BookOpen },
    ],
    [],
  );

  return (
    <header className="sticky top-0 z-50 bg-brand-primary text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <PageContainer className="py-0">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4 md:gap-6">
          <Link
            href="/"
            className="group flex items-center gap-3 shrink-0 py-3 sm:py-5"
            aria-label="JunketTours"
            title="JunketTours"
          >
            <span className="relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/20">
              <Image
                src="/images-removebg-preview.png"
                alt=""
                fill
                className="object-contain p-1.5"
                priority
              />
            </span>
            <span className="hidden sm:block leading-tight">
              <span className="block text-lg font-semibold text-white">
                Junket Tours
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
                Destination Management Company
              </span>
            </span>
          </Link>

          <nav
            className="hidden min-w-0 items-center justify-center gap-8 md:flex"
            aria-label="Primary"
          >
            <Link
              href="/tours"
              className={cn(
                "text-sm font-semibold text-white/90 transition-colors hover:text-havezic-primary",
                pathname === "/tours" || pathname?.startsWith("/tours/")
                  ? "text-havezic-primary"
                  : undefined,
              )}
            >
              Tours
            </Link>
            <DestinationsMegaDropdown
              pathname={pathname}
              destinations={indexDestinations}
            />
            {links.map(({ href, label }) => {
              const active = pathname === href || pathname?.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "text-sm font-semibold text-white/90 transition-colors hover:text-havezic-primary",
                    active && "text-havezic-primary",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/90 ring-1 ring-white/15 transition hover:bg-white/15 hover:text-white"
                aria-label="Wishlist"
                title="Wishlist"
              >
                <Heart className="h-5 w-5" aria-hidden />
              </button>

              {liveSession ? (
                <AccountDropdown session={liveSession} align="right" />
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/90 ring-1 ring-white/15 transition hover:bg-white/15 hover:text-white"
                  aria-label="Profile"
                  title="Profile"
                >
                  <User className="h-5 w-5" aria-hidden />
                </Link>
              )}

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm ring-1 ring-white/15 transition hover:brightness-110"
                  aria-label="Chat on WhatsApp"
                  title="WhatsApp"
                >
                  <WhatsAppBrandIcon className="h-5 w-5" />
                </a>
              ) : null}
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white shadow-sm transition hover:border-white/35 md:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden md:hidden"
              aria-label="Mobile primary"
            >
              <div className="mt-3 flex flex-col gap-1 border-t border-white/20 pt-3 pb-1">
                <Link
                  href="/tours"
                  className="group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  <Compass className="h-4 w-4 text-brand-sun transition-colors group-hover:text-brand-forest" />
                  Tours
                </Link>
                <MobileDestinationsAccordion
                  pathname={pathname}
                  destinations={indexDestinations}
                  expanded={mobileDestOpen}
                  onToggle={() => setMobileDestOpen((o) => !o)}
                  onPick={() => {
                    setOpen(false);
                    setMobileDestOpen(false);
                  }}
                />
                {links.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="h-4 w-4 text-brand-sun transition-colors group-hover:text-brand-forest" />
                    {label}
                  </Link>
                ))}
                <Link
                  href="/ai-planner"
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-amber-400 hover:bg-white/5"
                  onClick={() => setOpen(false)}
                >
                  <Sparkles className="h-4 w-4" />
                  AI Planner
                </Link>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mx-3 inline-flex w-fit items-center justify-center rounded-full bg-[#25D366] p-3 text-white shadow-md"
                    aria-label="Chat on WhatsApp"
                    onClick={() => setOpen(false)}
                  >
                    <WhatsAppBrandIcon className="h-6 w-6" />
                  </a>
                ) : null}
                {liveSession ? (
                  <div className="mt-2 border-t border-white/15 pt-3">
                    <p className="px-3 text-xs font-semibold uppercase tracking-wide text-white/50">
                      Account
                    </p>
                    <div className="mt-2 px-3">
                      <AccountDropdown session={liveSession} align="full" />
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    <LogIn className="h-4 w-4 text-brand-sun transition-colors group-hover:text-brand-forest" />
                    Log in
                  </Link>
                )}
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </PageContainer>
    </header>
  );
}
