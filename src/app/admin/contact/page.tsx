import { AdminContactPanel } from "@/components/admin/AdminContactPanel";

export default function AdminContactPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Leads</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Messages and enquiries from your website. Mark where each follow-up stands and keep
        private notes.
      </p>
      <div className="mt-8">
        <AdminContactPanel />
      </div>
    </main>
  );
}
