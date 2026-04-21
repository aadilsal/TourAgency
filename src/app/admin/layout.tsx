import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { PageContainer } from "@/components/ui/PageContainer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getServerSession();
  if (!s) redirect("/login?next=/admin");
  if (s.role !== "admin" && s.role !== "super_admin") {
    redirect("/dashboard");
  }
  const showManageAdmins = s.role === "super_admin";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminTopBar email={s.email} role={s.role} />
      <PageContainer className="flex gap-8 py-8 md:gap-10 md:py-10">
        <AdminSidebar showManageAdmins={showManageAdmins} />
        <div className="min-w-0 flex-1">
          <div className="md:hidden">
            <nav
              className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4"
              aria-label="Admin sections"
            >
              <AdminMobileLinks showManageAdmins={showManageAdmins} />
            </nav>
          </div>
          {children}
        </div>
      </PageContainer>
    </div>
  );
}

function AdminMobileLinks({
  showManageAdmins,
}: {
  showManageAdmins: boolean;
}) {
  const items = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/tours", label: "Tours" },
    { href: "/admin/destinations", label: "Destinations" },
    { href: "/admin/contact", label: "Contact" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/itineraries", label: "All Itineraries" },
    { href: "/admin/itineraries/new", label: "Create Itinerary" },
    { href: "/admin/invoices", label: "All Invoices" },
    { href: "/admin/invoices/new", label: "Create Invoice" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/blog", label: "Blog" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/settings", label: "Settings" },
    ...(showManageAdmins
      ? [{ href: "/admin/manage-admins", label: "Admins 🔐" as const }]
      : []),
  ];
  return (
    <>
      {items.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-border-strong hover:bg-panel-elevated"
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}
