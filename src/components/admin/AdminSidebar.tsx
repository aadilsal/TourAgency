"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MapPinned,
  Map,
  CalendarCheck,
  MessageSquare,
  Shield,
  Users,
  Newspaper,
  LineChart,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
  icon: LucideIcon;
};

type NavGroup =
  | { kind: "link"; link: NavLink }
  | { kind: "divider"; label?: string }
  | { kind: "heading"; label: string };

const adminOnly: NavLink = {
  href: "/admin/manage-admins",
  label: "Manage admins 🔐",
  icon: Shield,
};

export function AdminSidebar({
  showManageAdmins,
}: {
  showManageAdmins: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const sections = useMemo(() => {
    const s = [
      {
        id: "catalog",
        label: "Catalog",
        links: [
          { href: "/admin/tours", label: "Tours", icon: MapPinned },
          { href: "/admin/destinations", label: "Destinations", icon: Map },
        ],
      },
      {
        id: "inbox",
        label: "Inbox",
        links: [
          { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
          { href: "/admin/contact", label: "Leads", icon: MessageSquare },
        ],
      },
      {
        id: "documents",
        label: "Documents",
        links: [
          { href: "/admin/itineraries", label: "Itineraries", icon: FileText },
          { href: "/admin/invoices", label: "Invoices", icon: FileText },
        ],
      },
      {
        id: "more",
        label: "More",
        links: [
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/blog", label: "Blog", icon: Newspaper },
          { href: "/admin/analytics", label: "Analytics", icon: LineChart },
          { href: "/admin/settings", label: "Settings", icon: Settings },
          ...(showManageAdmins ? [adminOnly] : []),
        ],
      },
    ] as const;
    return s;
  }, [showManageAdmins]);

  const shouldOpen = (links: readonly NavLink[]) =>
    links.some((l) => isActive(l.href, l.exact));

  return (
    <aside className="hidden w-60 shrink-0 md:block">
      <div className="sticky top-24 rounded-2xl border border-border bg-panel p-4 shadow-sm backdrop-blur-xl">
        <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          Menu
        </p>
        <nav className="mt-3 flex flex-col gap-1">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              isActive("/admin", true)
                ? "bg-brand-sun/18 text-foreground ring-1 ring-brand-sun/25"
                : "text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
            )}
          >
            <LayoutDashboard
              className={cn(
                "h-4 w-4 shrink-0",
                isActive("/admin", true) ? "text-brand-sun" : "opacity-70",
              )}
              aria-hidden
            />
            Dashboard
          </Link>

          <div className="my-2 h-px w-full bg-border" aria-hidden />

          {sections.map((sec) => (
            <details
              key={sec.id}
              open={shouldOpen(sec.links)}
              className="group rounded-xl"
            >
              <summary
                className={cn(
                  "cursor-pointer list-none rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-muted",
                  "hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
                )}
              >
                {sec.label}
              </summary>
              <div className="mt-1 flex flex-col gap-1">
                {sec.links.map((l) => {
                  const active = isActive(l.href, l.exact);
                  const Icon = l.icon;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                        active
                          ? "bg-brand-sun/18 text-foreground ring-1 ring-brand-sun/25"
                          : "text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-brand-sun" : "opacity-70",
                        )}
                        aria-hidden
                      />
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </details>
          ))}
        </nav>
      </div>
    </aside>
  );
}
