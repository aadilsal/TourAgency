import { AdminProvincesPanel } from "@/components/admin/AdminProvincesPanel";

export default function AdminProvincesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Provinces</h1>
        <p className="mt-1 text-sm text-slate-600">
          The province travel guides on your website’s Guides page. Edit their text, tips and
          order.
        </p>
      </div>
      <AdminProvincesPanel />
    </div>
  );
}
