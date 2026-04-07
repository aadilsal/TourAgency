import { AdminToursPanel } from "@/components/admin/AdminToursPanel";

export default function AdminToursPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Tours</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Table view — use Add tour or Edit for the full modal (itinerary JSON,
        images, pricing).
      </p>
      <div className="mt-8">
        <AdminToursPanel />
      </div>
    </main>
  );
}
