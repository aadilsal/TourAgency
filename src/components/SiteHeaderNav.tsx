"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";
import { LogoutButton } from "./LogoutButton";
import { PageContainer } from "@/components/ui/PageContainer";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

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
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/30 transition hover:bg-white/20",
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
              "absolute z-[80] mt-2 min-w-[13.5rem] rounded-xl border border-white/20 bg-slate-950/98 py-2 shadow-xl backdrop-blur-md",
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
            <p className="truncate px-3 pb-2 text-xs text-slate-400">
              {session.email}
            </p>
            <div className="border-t border-white/10" />
            <Link
              href="/dashboard"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4 text-sky-300" aria-hidden />
              Dashboard
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <Shield className="h-4 w-4 text-sky-300/80" aria-hidden />
                Admin
              </Link>
            ) : null}
            <div className="border-t border-white/10 px-3 pt-2">
              <LogoutButton className="w-full text-left text-slate-200 hover:text-white" />
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
  const [liveSession, setLiveSession] = useState<SessionInfo>(initialSession);

  useEffect(() => {
    setLiveSession(initialSession);
  }, [initialSession]);

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

  const links = [
    { href: "/tours", label: "Tours", icon: Compass },
    { href: "/destinations", label: "Destinations", icon: MapPin },
    { href: "/blog", label: "Guides", icon: BookOpen },
    { href: "/contact", label: "Contact", icon: PhoneCall },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/15 bg-slate-950/88 shadow-lg shadow-black/25 backdrop-blur-xl">
      <PageContainer className="!px-4 py-3 md:!px-8 lg:!px-12">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="shrink-0 font-display text-xl font-semibold tracking-tight text-white drop-shadow-sm transition hover:text-sky-200"
          >
            JunketTours
          </Link>

          <nav
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 md:flex"
            aria-label="Primary"
          >
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4 text-sky-300/90" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/ai-planner"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-cta px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/30 transition hover:brightness-110 sm:text-sm"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
              AI Planner
            </Link>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded-xl p-2 text-[#25D366] transition hover:bg-white/10 sm:inline-flex"
                aria-label="Chat on WhatsApp"
              >
                <WhatsAppBrandIcon className="h-6 w-6" />
              </a>
            ) : null}
            {liveSession ? (
              <AccountDropdown session={liveSession} align="right" />
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold text-white transition hover:text-sky-200"
              >
                Log in
              </Link>
            )}

            <button
              type="button"
              className="rounded-xl p-2 text-white transition hover:bg-white/10 md:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
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
                {links.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="h-4 w-4 text-sky-300" />
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
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    <LogIn className="h-4 w-4 text-sky-300" />
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
