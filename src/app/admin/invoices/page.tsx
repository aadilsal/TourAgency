import { AdminInvoicesTable } from "@/components/admin/AdminInvoicesTable";

export default function AdminInvoicesPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Invoices</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Create invoices, preview, export, and mark paid.
      </p>
      <div className="mt-8">
        <AdminInvoicesTable />
      </div>
    </main>
  );
}

