import { AdminInvoiceWizard } from "@/components/admin/AdminInvoiceWizard";

export default function AdminNewInvoicePage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Create invoice</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Step-by-step builder. Your progress autosaves.
      </p>
      <div className="mt-8">
        <AdminInvoiceWizard />
      </div>
    </main>
  );
}

