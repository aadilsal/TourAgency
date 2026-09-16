import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";

export default function AdminSettingsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Site settings</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Business info, contact details, map, licences and bank details — used on
        the website, invoices and itinerary PDFs.
      </p>
      <div className="mt-8">
        <AdminSettingsPanel />
      </div>
    </main>
  );
}

