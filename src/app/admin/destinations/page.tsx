import { AdminDestinationsPanel } from "@/components/admin/AdminDestinationsPanel";

export default function AdminDestinationsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Destinations</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Add and edit the places shown on your website’s Destinations pages, and choose their
        order.
      </p>
      <div className="mt-8">
        <AdminDestinationsPanel />
      </div>
    </main>
  );
}
