import Link from "next/link";
import { getServerSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";

export default async function AdminHomePage() {
  const s = await getServerSession();
  const links = [
    { href: "/admin/tours", label: "Tours", desc: "Table, add/edit modals, packages" },
    {
      href: "/admin/destinations",
      label: "Destinations",
      desc: "Create/edit destination guides and sort order",
    },
    {
      href: "/admin/bookings",
      label: "Bookings",
      desc: "Unified guest + member table & filters",
    },
    {
      href: "/admin/contact",
      label: "Contact",
      desc: "Office settings + incoming contact messages",
    },
    { href: "/admin/users", label: "Users", desc: "Directory & account details" },
    { href: "/admin/blog", label: "Blog", desc: "Editor & publish toggle" },
    {
      href: "/admin/analytics",
      label: "Analytics",
      desc: "Total bookings, leads, revenue cards",
    },
    {
      href: "/admin/custom-itineraries",
      label: "Custom plans",
      desc: "AI custom itinerary approvals (linked from dashboard only)",
    },
  ];

  return (
    <div>
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent">
          Overview
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink md:text-4xl">
          Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-muted">
          Manage bookings, tours, content, and AI custom plan requests from one
          place.
        </p>
      </header>
      <p className="mt-4 text-sm text-brand-muted">
        Signed in as{" "}
        <span className="font-semibold text-brand-ink">{s?.email}</span>
      </p>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block h-full">
              <Card
                className="h-full border-slate-200/90 p-6 transition-shadow hover:border-brand-accent/35 hover:shadow-card-hover"
                hover
              >
                <p className="text-lg font-bold text-brand-ink">{l.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  {l.desc}
                </p>
                <span className="mt-5 inline-flex items-center text-sm font-bold text-brand-cta">
                  Open
                  <span className="ml-1" aria-hidden>
                    →
                  </span>
                </span>
              </Card>
            </Link>
          </li>
        ))}
        {s?.role === "super_admin" ? (
          <li>
            <Link href="/admin/manage-admins" className="block h-full">
              <Card
                className="h-full border border-brand-accent/40 bg-gradient-to-br from-white to-brand-accent/[0.06] p-6 transition-shadow hover:shadow-card-hover"
                hover
              >
                <p className="text-lg font-bold text-brand-ink">
                  Manage admins 🔐
                </p>
                <p className="mt-2 text-sm text-brand-muted">
                  Promote users to admin or demote admins
                </p>
                <span className="mt-5 inline-flex items-center text-sm font-bold text-brand-cta">
                  Open
                  <span className="ml-1" aria-hidden>
                    →
                  </span>
                </span>
              </Card>
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
