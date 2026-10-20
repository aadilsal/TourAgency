import { AdminInvoicesTable } from "@/components/admin/AdminInvoicesTable";

export default function AdminInvoicesPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Invoices</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Make invoices for your customers, check them, download them and mark them as paid.
      </p>
      <div className="mt-8">
        <AdminInvoicesTable />
      </div>
    </main>
  );
}

