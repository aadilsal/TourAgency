import { AdminInvoiceWizard } from "@/components/admin/AdminInvoiceWizard";

export default function AdminInvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <AdminInvoiceWizard invoiceId={params.id} />
    </main>
  );
}

