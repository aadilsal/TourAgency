import { AdminInvoiceDetail } from "@/components/admin/AdminInvoiceDetail";

export default function AdminInvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <AdminInvoiceDetail invoiceId={params.id} />
    </main>
  );
}

