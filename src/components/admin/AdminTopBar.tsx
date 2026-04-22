"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { createPortal } from "react-dom";
import { LogoutButton } from "@/components/LogoutButton";
import { PageContainer } from "@/components/ui/PageContainer";

type Props = {
  email: string;
  role: string;
  showManageAdmins: boolean;
};

export function AdminTopBar({ email, role, showManageAdmins }: Props) {
  const roleLabel = role.replace("_", " ");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const closeHref = useMemo(() => {
    // On mobile, provide a quick "close" affordance for create flows.
    if (!pathname.startsWith("/admin")) return null;
    if (!pathname.endsWith("/new")) return null;
    const parent = pathname.slice(0, -"/new".length) || "/admin";
    return parent === "/admin" ? "/admin" : parent;
  }, [pathname]);

  const items = useMemo(() => {
    return [
      { href: "/admin", label: "Dashboard" },
    ];
  }, []);

  const sections = useMemo(() => {
    return [
      {
        id: "catalog",
        label: "Catalog",
        links: [
          { href: "/admin/tours", label: "Tours" },
          { href: "/admin/destinations", label: "Destinations" },
        ],
      },
      {
        id: "inbox",
        label: "Inbox",
        links: [
          { href: "/admin/bookings", label: "Bookings" },
          { href: "/admin/contact", label: "Leads" },
        ],
      },
      {
        id: "documents",
        label: "Documents",
        links: [
          { href: "/admin/itineraries", label: "Itineraries" },
          { href: "/admin/invoices", label: "Invoices" },
        ],
      },
      {
        id: "more",
        label: "More",
        links: [
          { href: "/admin/users", label: "Users" },
          { href: "/admin/blog", label: "Blog" },
          { href: "/admin/analytics", label: "Analytics" },
          { href: "/admin/settings", label: "Settings" },
          ...(showManageAdmins ? [{ href: "/admin/manage-admins", label: "Admins 🔐" }] : []),
        ],
      },
    ] as const;
  }, [showManageAdmins]);

  const shouldOpenSection = (links: readonly { href: string }[]) =>
    links.some((l) => pathname === l.href || pathname.startsWith(`${l.href}/`));

  useEffect(() => {
    // Close drawer on route change.
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Robust scroll lock (incl. iOS): freeze body at current scrollY.
    const scrollY = window.scrollY;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
    };
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      document.body.style.paddingRight = prev.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-[90] border-b border-border bg-panel shadow-sm backdrop-blur-xl">
      <PageContainer className="flex flex-wrap items-center justify-between gap-3 py-3.5 md:py-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-panel-elevated p-2 text-foreground shadow-sm hover:bg-black/5 md:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight text-foreground hover:text-brand-sun"
          >
            JunketTours
          </Link>
          <span
            className="hidden h-5 w-px shrink-0 bg-border sm:block"
            aria-hidden
          />
          <span className="rounded-lg bg-brand-sun/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-sun ring-1 ring-brand-sun/30 sm:text-xs">
            Admin
          </span>
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-2 sm:gap-3">
          {closeHref ? (
            <Link
              href={closeHref}
              className="md:hidden inline-flex items-center justify-center rounded-xl border border-border bg-panel-elevated p-2 text-foreground shadow-sm hover:bg-black/5"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Link>
          ) : null}
          <span
            className="max-w-[140px] truncate text-xs text-muted sm:max-w-[220px] sm:text-sm"
            title={email}
          >
            {email}
          </span>
          <span className="rounded-full bg-brand-forest/12 px-2 py-0.5 text-[10px] font-bold capitalize text-brand-forest ring-1 ring-brand-forest/25 sm:text-xs">
            {roleLabel}
          </span>
          <Link
            href="/"
            className="text-xs font-semibold text-brand-cta underline-offset-2 hover:underline sm:text-sm"
          >
            View site
          </Link>
          <LogoutButton />
        </div>
      </PageContainer>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[200] md:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/80"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              />
              <div
                className="absolute left-0 top-0 h-dvh w-[92vw] max-w-[420px] border-r border-border bg-panel shadow-xl overscroll-contain"
                onTouchMove={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
              >
                {/* Drawer header (fixed) */}
                <div className="sticky top-0 z-10 border-b border-border bg-panel p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
                      Menu
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl border border-border bg-panel-elevated p-2 text-foreground shadow-sm hover:bg-black/5"
                      aria-label="Close menu"
                      onClick={() => setOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-3 rounded-2xl border border-border bg-panel-elevated p-3">
                    <p className="truncate text-sm font-semibold text-foreground" title={email}>
                      {email}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-brand-forest/12 px-2 py-0.5 text-[10px] font-bold capitalize text-brand-forest ring-1 ring-brand-forest/25">
                        {roleLabel}
                      </span>
                      <Link
                        href="/"
                        className="text-xs font-semibold text-brand-cta underline-offset-2 hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        View site
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Scrollable nav area */}
                <nav className="h-[calc(100%-1px)] overflow-y-auto p-4 pt-3 overscroll-contain">
                  <div className="grid gap-2 pb-6">
                    {items.map((l) => {
                      const active =
                        pathname === l.href || pathname.startsWith(`${l.href}/`);
                      return (
                        <Link
                          key={l.href}
                          href={l.href}
                          className={[
                            "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                            active
                              ? "border-brand-sun/30 bg-brand-sun/15 text-foreground"
                              : "border-border bg-panel-elevated text-foreground hover:bg-black/5",
                          ].join(" ")}
                          onClick={() => setOpen(false)}
                        >
                          {l.label}
                        </Link>
                      );
                    })}

                    <div className="my-2 h-px w-full bg-border" aria-hidden />

                    {sections.map((sec) => (
                      <details
                        key={sec.id}
                        open={shouldOpenSection(sec.links)}
                        className="rounded-xl border border-border bg-panel-elevated px-3 py-2"
                      >
                        <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-[0.2em] text-muted">
                          {sec.label}
                        </summary>
                        <div className="mt-2 grid gap-2">
                          {sec.links.map((l) => {
                            const active =
                              pathname === l.href || pathname.startsWith(`${l.href}/`);
                            return (
                              <Link
                                key={l.href}
                                href={l.href}
                                className={[
                                  "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                                  active
                                    ? "border-brand-sun/30 bg-brand-sun/15 text-foreground"
                                    : "border-border bg-panel text-foreground hover:bg-black/5",
                                ].join(" ")}
                                onClick={() => setOpen(false)}
                              >
                                {l.label}
                              </Link>
                            );
                          })}
                        </div>
                      </details>
                    ))}
                  </div>
                </nav>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
