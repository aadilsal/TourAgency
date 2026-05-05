import { AdminFaqsPanel } from "@/components/admin/AdminFaqsPanel";

export default function AdminFaqsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">FAQs</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Create and manage FAQs shown on the public FAQs page.
      </p>
      <div className="mt-8">
        <AdminFaqsPanel />
      </div>
    </main>
  );
}

