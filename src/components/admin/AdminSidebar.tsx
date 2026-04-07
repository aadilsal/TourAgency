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
  Users,
  Newspaper,
  LineChart,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/cn";

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
  icon: LucideIcon;
};

const links: NavLink[] = [
  { href: "/admin", label: "Dashboard", exact: true, icon: LayoutDashboard },
  { href: "/admin/tours", label: "Tours", icon: MapPinned },
  { href: "/admin/destinations", label: "Destinations", icon: Map },
  { href: "/admin/contact", label: "Contact", icon: MessageSquare },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/analytics", label: "Analytics", icon: LineChart },
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
  const all = showManageAdmins ? [...links, adminOnly] : links;

  return (
    <aside className="hidden w-60 shrink-0 md:block">
      <div className="sticky top-24 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card ring-1 ring-slate-900/[0.04]">
        <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">
          Menu
        </p>
        <nav className="mt-3 flex flex-col gap-1">
          {all.map((l) => {
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
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-brand-muted hover:bg-brand-surface hover:text-brand-ink",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-white/90" : "opacity-70",
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
