"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  X,
  Sparkles,
  MapPin,
  BookOpen,
  Compass,
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
import { LogoutButton } from "./LogoutButton";
import { SiteSearch } from "./SiteSearch";
import { PageContainer } from "@/components/ui/PageContainer";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { useBodyScrollLock } from "@/components/ui/useBodyScrollLock";
import { useFocusTrap } from "@/components/ui/useFocusTrap";
import type { LucideIcon } from "lucide-react";

type DestinationIndexRow = {
  slug: string;
  name: string;
  line: string;
  heroUrl: string;
  tourCount: number;
};

type ProvinceIndexRow = {
  slug: string;
  name: string;
  tagline: string;
  heroUrl: string;
  tourCount: number;
  siteCount: number;
};

const STATIC_PROVINCE_NAV = [
  { slug: "sindh", name: "Sindh" },
  { slug: "balochistan", name: "Balochistan" },
  { slug: "punjab", name: "Punjab" },
  { slug: "islamabad", name: "Islamabad & Heritage Belt" },
  { slug: "kpk", name: "Khyber Pakhtunkhwa" },
  { slug: "gilgit-baltistan", name: "Gilgit-Baltistan" },
  { slug: "azad-kashmir", name: "Azad Kashmir" },
];

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
  provinces,
}: {
  pathname: string | null;
  destinations: DestinationIndexRow[] | undefined;
  provinces: ProvinceIndexRow[] | undefined;
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
    pathname?.startsWith("/destinations/") ||
    pathname === "/guides" ||
    pathname?.startsWith("/guides/");

  const cityItems = destinations ?? [];
  const provinceItems =
    provinces && provinces.length > 0
      ? provinces
      : STATIC_PROVINCE_NAV.map((p) => ({
          slug: p.slug,
          name: p.name,
          tagline: "",
          heroUrl: "",
          tourCount: 0,
          siteCount: 0,
        }));
  const showSpinner =
    destinations === undefined || provinces === undefined;

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
              aria-label="Destinations and provinces"
            >
              <div className="border-b border-border bg-havezic-background-light px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-havezic-primary">
                  Explore
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  Destinations
                </p>
                <p className="mt-1 text-sm text-muted">
                  Province guides south to north, plus city tour hubs.
                </p>
              </div>

              <div className="max-h-[min(70vh,480px)] overflow-y-auto p-4">
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
                ) : (
                  <>
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">
                      Provinces
                    </p>
                    <div className="mb-6 grid gap-2 sm:grid-cols-2">
                      {provinceItems.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/guides/${p.slug}`}
                          role="menuitem"
                          className="group flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition hover:border-havezic-primary/45 hover:bg-havezic-background-light"
                          onClick={() => setOpen(false)}
                        >
                          {p.heroUrl ? (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-havezic-background-light">
                              <Image
                                src={p.heroUrl}
                                alt=""
                                aria-hidden
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-havezic-primary/10 text-xs font-bold text-havezic-primary">
                              {p.name.slice(0, 2)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground">
                              {p.name}
                            </p>
                            {p.tagline ? (
                              <p className="line-clamp-1 text-xs text-muted">
                                {p.tagline}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                      ))}
                    </div>

                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">
                      City tour hubs
                    </p>
                    {cityItems.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted">
                        No city destinations yet.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {cityItems.map((d) => (
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
                                aria-hidden
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
                              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-havezic-primary">
                                {d.tourCount}{" "}
                                {d.tourCount === 1 ? "tour" : "tours"}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid gap-2 border-t border-border bg-havezic-background-light px-4 py-3 sm:grid-cols-2">
                <Link
                  href="/guides"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-havezic-primary/40"
                  onClick={() => setOpen(false)}
                >
                  All province guides
                </Link>
                <Link
                  href="/destinations"
                  className="flex items-center justify-center gap-2 rounded-xl bg-havezic-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-havezic-primary-hover"
                  onClick={() => setOpen(false)}
                >
                  All city destinations
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
  provinces,
  expanded,
  onToggle,
  onPick,
}: {
  pathname: string | null;
  destinations: DestinationIndexRow[] | undefined;
  provinces: ProvinceIndexRow[] | undefined;
  expanded: boolean;
  onToggle: () => void;
  onPick: () => void;
}) {
  const active =
    pathname === "/destinations" ||
    pathname?.startsWith("/destinations/") ||
    pathname === "/guides" ||
    pathname?.startsWith("/guides/");

  const cityItems = destinations ?? [];
  const provinceItems =
    provinces && provinces.length > 0 ? provinces : STATIC_PROVINCE_NAV;
  const loading = destinations === undefined || provinces === undefined;

  return (
    <div className="rounded-xl border border-white/15 bg-white/5">
      <button
        type="button"
        className={cn(
          "flex min-h-12 w-full items-center justify-between gap-2 px-3 text-left text-base font-semibold text-white",
          active && "text-havezic-primary",
        )}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-brand-sun" aria-hidden />
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
            <div className="flex flex-col gap-0.5 px-2 pb-2 pt-1">
              <p className="px-3 pt-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                Provinces
              </p>
              <Link
                href="/guides"
                className="flex min-h-11 items-center rounded-lg px-3 text-base font-semibold text-white/95 hover:bg-white/10"
                onClick={onPick}
              >
                All province guides
              </Link>
              {loading ? (
                <div className="space-y-1 px-3 py-1" aria-busy="true" aria-label="Loading provinces">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-9 animate-pulse rounded-lg bg-white/10" />
                  ))}
                </div>
              ) : (
                provinceItems.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/guides/${p.slug}`}
                    className="flex min-h-11 items-center rounded-lg px-3 text-base text-white/90 hover:bg-white/10"
                    onClick={onPick}
                  >
                    {p.name}
                  </Link>
                ))
              )}
              <p className="mt-2 px-3 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                Cities
              </p>
              <Link
                href="/destinations"
                className="flex min-h-11 items-center rounded-lg px-3 text-base font-semibold text-white/95 hover:bg-white/10"
                onClick={onPick}
              >
                All city destinations
              </Link>
              {!loading
                ? cityItems.map((d) => (
                    <Link
                      key={d.slug}
                      href={`/destinations/${d.slug}`}
                      className="flex min-h-11 items-center rounded-lg px-3 text-base text-white/90 hover:bg-white/10"
                      onClick={onPick}
                    >
                      {d.name}
                    </Link>
                  ))
                : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const mobileRowClass =
  "group flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-havezic-primary";

/**
 * Full-height mobile navigation sheet: 48px rows, body scroll lock, focus
 * trap + Escape. The parent closes it on route change / resize past md.
 */
function MobileNavSheet({
  open,
  onClose,
  pathname,
  destinations,
  provinces,
  mobileDestOpen,
  setMobileDestOpen,
  links,
  session,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
  destinations: DestinationIndexRow[] | undefined;
  provinces: ProvinceIndexRow[] | undefined;
  mobileDestOpen: boolean;
  setMobileDestOpen: React.Dispatch<React.SetStateAction<boolean>>;
  links: { href: string; label: string; icon: LucideIcon }[];
  session: SessionInfo;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open);
  useFocusTrap(panelRef, open, onClose);

  const isActive = (href: string) =>
    pathname === href || Boolean(pathname?.startsWith(href + "/"));

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="mobile-nav"
          ref={panelRef}
          id="mobile-nav-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[90] flex flex-col bg-brand-primary text-white md:hidden"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/15 px-4 py-3">
            <Link href="/" className="flex min-h-11 items-center gap-3" onClick={onClose}>
              <span className="relative h-10 w-10 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/20">
                <Image
                  src="/images-removebg-preview.png"
                  alt=""
                  fill
                  sizes="40px"
                  className="object-contain p-1.5"
                />
              </span>
              <span className="text-lg font-semibold">Junket Tours</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:border-white/35"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>

          <nav
            aria-label="Mobile primary"
            className="flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-3"
            data-lenis-prevent
          >
            <SiteSearch variant="inline" className="px-1 pb-3" />
            <div className="flex flex-col gap-1">
              <Link
                href="/tours"
                className={cn(mobileRowClass, isActive("/tours") && "bg-white/10 text-havezic-primary")}
                aria-current={isActive("/tours") ? "page" : undefined}
                onClick={onClose}
              >
                <Compass className="h-5 w-5 text-brand-sun" aria-hidden />
                Tours
              </Link>
              <MobileDestinationsAccordion
                pathname={pathname}
                destinations={destinations}
                provinces={provinces}
                expanded={mobileDestOpen}
                onToggle={() => setMobileDestOpen((o) => !o)}
                onPick={onClose}
              />
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(mobileRowClass, isActive(href) && "bg-white/10 text-havezic-primary")}
                  aria-current={isActive(href) ? "page" : undefined}
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5 text-brand-sun" aria-hidden />
                  {label}
                </Link>
              ))}
              <Link
                href="/ai-planner"
                className={cn(mobileRowClass, "text-amber-400")}
                onClick={onClose}
              >
                <Sparkles className="h-5 w-5" aria-hidden />
                AI Planner
              </Link>
            </div>

            <div className="mt-4 border-t border-white/15 pt-4">
              {session ? (
                <>
                  <p className="px-3 text-xs font-semibold uppercase tracking-wide text-white/60">
                    Account
                  </p>
                  {session.email ? (
                    <p className="mt-1 truncate px-3 text-sm text-white/75">{session.email}</p>
                  ) : null}
                  <div className="mt-2 flex flex-col gap-1">
                    <Link href="/dashboard" className={mobileRowClass} onClick={onClose}>
                      <LayoutDashboard className="h-5 w-5 text-brand-sun" aria-hidden />
                      Dashboard
                    </Link>
                    {session.role === "admin" || session.role === "super_admin" ? (
                      <Link href="/admin" className={mobileRowClass} onClick={onClose}>
                        <Shield className="h-5 w-5 text-brand-sun" aria-hidden />
                        Admin
                      </Link>
                    ) : null}
                    <div className="flex min-h-12 items-center px-3">
                      <LogoutButton className="text-base font-semibold text-white/80 hover:text-havezic-primary" />
                    </div>
                  </div>
                </>
              ) : (
                <Link href="/login" className={mobileRowClass} onClick={onClose}>
                  <LogIn className="h-5 w-5 text-brand-sun" aria-hidden />
                  Log in
                </Link>
              )}
            </div>
          </nav>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function SiteHeaderNav({
  initialSession,
}: {
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

  const provinceNavItems = useQuery(api.provinces.listForIndex, {}) as
    | ProvinceIndexRow[]
    | undefined;

  useEffect(() => {
    if (!open) setMobileDestOpen(false);
  }, [open]);

  const closeMenu = useCallback(() => setOpen(false), []);

  // Close the mobile sheet whenever the route changes (incl. back/forward).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close if the viewport grows past the mobile breakpoint while open.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
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
    // Refresh on mount, on explicit auth changes, and when the tab regains focus —
    // not on every client-side navigation (which caused a redundant /api/auth/me
    // request per route change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const links = useMemo(
    () => [
      { href: "/about", label: "About Us", icon: Compass },
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
                alt="JunketTours"
                fill
                className="object-contain p-1.5"
                priority
              />
            </span>
            <span className="hidden sm:block leading-tight">
              <span className="block text-lg font-semibold text-white">
                Junket Tours
              </span>
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
                Pakistan, province by province
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
              provinces={provinceNavItems}
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
              <SiteSearch variant="icon" />
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
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white shadow-sm transition hover:border-white/35 md:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav-sheet"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <MobileNavSheet
          open={open}
          onClose={closeMenu}
          pathname={pathname}
          destinations={indexDestinations}
          provinces={provinceNavItems}
          mobileDestOpen={mobileDestOpen}
          setMobileDestOpen={setMobileDestOpen}
          links={links}
          session={liveSession}
        />
      </PageContainer>
    </header>
  );
}
