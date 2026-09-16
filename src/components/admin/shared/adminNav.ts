import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Info,
  LayoutDashboard,
  LineChart,
  Map,
  MapPin,
  MapPinned,
  MessageSquare,
  Newspaper,
  Receipt,
  Settings,
  Shield,
  Sparkles,
  Stamp,
  Star,
  Users,
} from "lucide-react";

export type AdminNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only match the exact path (for "/admin"). */
  exact?: boolean;
  /** Only shown to super admins. */
  superAdminOnly?: boolean;
  /** Other routes that should highlight this link (e.g. legacy redirects). */
  aliases?: string[];
};

export type AdminNavSection = {
  id: string;
  label: string;
  links: AdminNavLink[];
};

/**
 * Single source of truth for admin navigation — used by the desktop sidebar
 * AND the mobile drawer so the two can never drift apart again. Add a page
 * here once and it appears in both.
 */
export const ADMIN_NAV: AdminNavSection[] = [
  {
    id: "overview",
    label: "Overview",
    links: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    id: "inbox",
    label: "Inbox",
    links: [
      { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
      {
        href: "/admin/custom-itineraries",
        label: "Trip requests",
        icon: Sparkles,
        aliases: ["/admin/ai-planner"],
      },
      { href: "/admin/visa-invitations", label: "Visa invitations", icon: Stamp },
      { href: "/admin/contact", label: "Leads", icon: MessageSquare },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    links: [
      { href: "/admin/itineraries", label: "Itineraries", icon: FileText },
      { href: "/admin/invoices", label: "Invoices", icon: Receipt },
    ],
  },
  {
    id: "website",
    label: "Website",
    links: [
      { href: "/admin/tours", label: "Tours", icon: MapPinned },
      { href: "/admin/destinations", label: "Destinations", icon: MapPin },
      { href: "/admin/provinces", label: "Provinces", icon: Map },
      { href: "/admin/sites", label: "Sites", icon: Map },
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/admin/about", label: "About & team", icon: Info },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    links: [
      { href: "/admin/settings", label: "Site settings", icon: Settings },
      {
        href: "/admin/itinerary-template",
        label: "Itinerary template",
        icon: FileSpreadsheet,
      },
      { href: "/admin/users", label: "Users", icon: Users },
      {
        href: "/admin/manage-admins",
        label: "Admins",
        icon: Shield,
        superAdminOnly: true,
      },
      { href: "/admin/analytics", label: "Analytics", icon: LineChart },
    ],
  },
];

export function visibleAdminNav(showSuperAdmin: boolean): AdminNavSection[] {
  return ADMIN_NAV.map((s) => ({
    ...s,
    links: s.links.filter((l) => showSuperAdmin || !l.superAdminOnly),
  })).filter((s) => s.links.length > 0);
}

export function isAdminNavLinkActive(pathname: string, link: AdminNavLink): boolean {
  const hrefs = [link.href, ...(link.aliases ?? [])];
  return hrefs.some((href) =>
    link.exact && href === link.href
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`),
  );
}
