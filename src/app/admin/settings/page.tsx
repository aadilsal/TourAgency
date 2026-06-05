import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";

export default function AdminSettingsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Settings</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Update company contact details used in documents.
      </p>
      <div className="mt-8">
        <AdminSettingsPanel />
      </div>
    </main>
  );
}

