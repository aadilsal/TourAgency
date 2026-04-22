import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";
import { getServerSession } from "@/lib/session";

export default async function AdminSettingsPage() {
  const s = await getServerSession();
  const role =
    s?.role === "admin" || s?.role === "super_admin" ? s.role : undefined;
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Settings</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Update company contact details used in documents.
      </p>
      <div className="mt-8">
        <AdminSettingsPanel role={role} />
      </div>
    </main>
  );
}

