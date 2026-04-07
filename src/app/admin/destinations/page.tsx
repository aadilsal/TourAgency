import { AdminDestinationsPanel } from "@/components/admin/AdminDestinationsPanel";

export default function AdminDestinationsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Destinations</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Add, edit, and order destination guides used on the site.
      </p>
      <div className="mt-8">
        <AdminDestinationsPanel />
      </div>
    </main>
  );
}
