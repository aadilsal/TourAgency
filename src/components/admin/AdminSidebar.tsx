"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const groups: NavGroup[] = [
  // Original admin sections (kept)
  {
    kind: "link",
    link: { href: "/admin", label: "Dashboard", exact: true, icon: LayoutDashboard },
  },
  { kind: "link", link: { href: "/admin/tours", label: "Tours", icon: MapPinned } },
  {
    kind: "link",
    link: { href: "/admin/destinations", label: "Destinations", icon: Map },
  },
  { kind: "link", link: { href: "/admin/contact", label: "Contact", icon: MessageSquare } },
  {
    kind: "link",
    link: { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  },

  { kind: "divider" },

  // New modules (grouped, no redundancy)
  { kind: "heading", label: "Documents" },
  // Clients module removed — store clientName on each document instead.

  { kind: "heading", label: "Itineraries" },
  {
    kind: "link",
    link: { href: "/admin/itineraries", label: "All Itineraries", icon: FileText },
  },
  {
    kind: "link",
    link: { href: "/admin/itineraries/new", label: "Create New", icon: FileText },
  },

  { kind: "heading", label: "Invoices" },
  { kind: "link", link: { href: "/admin/invoices", label: "All Invoices", icon: FileText } },
  {
    kind: "link",
    link: { href: "/admin/invoices/new", label: "Create New", icon: FileText },
  },

  { kind: "divider" },

  // Kept original sections (after docs)
  { kind: "link", link: { href: "/admin/users", label: "Users", icon: Users } },
  { kind: "link", link: { href: "/admin/blog", label: "Blog", icon: Newspaper } },
  { kind: "link", link: { href: "/admin/analytics", label: "Analytics", icon: LineChart } },

  { kind: "divider" },
  { kind: "link", link: { href: "/admin/settings", label: "Settings", icon: Settings } },
];

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
  const all = showManageAdmins
    ? [...groups, { kind: "divider" as const }, { kind: "link" as const, link: adminOnly }]
    : groups;

  return (
    <aside className="hidden w-60 shrink-0 md:block">
      <div className="sticky top-24 rounded-2xl border border-border bg-panel p-4 shadow-sm backdrop-blur-xl">
        <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          Menu
        </p>
        <nav className="mt-3 flex flex-col gap-1">
          {all.map((item, idx) => {
            if (item.kind === "divider") {
              return (
                <div
                  key={`div-${idx}`}
                  className="my-2 h-px w-full bg-border"
                  aria-hidden
                />
              );
            }
            if (item.kind === "heading") {
              return (
                <p
                  key={`h-${item.label}`}
                  className="mt-2 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted"
                >
                  {item.label}
                </p>
              );
            }
            const l = item.link;
            const active = l.exact
              ? pathname === l.href
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
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
        </nav>
      </div>
    </aside>
  );
}
