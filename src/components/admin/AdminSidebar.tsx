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
  Sparkles,
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
  { href: "/admin/ai-planner", label: "AI Planner", icon: Sparkles },
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
      <div className="sticky top-24 rounded-2xl border border-border bg-panel p-4 shadow-sm backdrop-blur-xl">
        <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
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
