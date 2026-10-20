import { getServerSession } from "@/lib/session";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export default async function AdminHomePage() {
  const s = await getServerSession();

  return (
    <div>
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-sun">
          Overview
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          See every new booking, message, trip request, visa request and review in
          one list, and reply to customers on WhatsApp or by phone in one tap.
        </p>
      </header>
      <p className="mt-4 text-sm text-muted">
        Signed in as{" "}
        <span className="font-semibold text-foreground">{s?.email}</span>
      </p>
      {s?.role === "admin" || s?.role === "super_admin" ? (
        <div className="mt-8">
          <AdminDashboardClient role={s.role} />
        </div>
      ) : null}
    </div>
  );
}
