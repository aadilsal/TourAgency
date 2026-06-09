import { AdminSitesPanel } from "@/components/admin/AdminSitesPanel";

export default function AdminSitesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Sites</h1>
        <p className="mt-1 text-sm text-slate-600">
          Historical, cultural, natural, and adventure sites within each province.
        </p>
      </div>
      <AdminSitesPanel />
    </div>
  );
}
