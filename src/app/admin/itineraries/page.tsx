import { AdminItinerariesTable } from "@/components/admin/AdminItinerariesTable";

export default function AdminItinerariesPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Itineraries</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Sales documents you can preview and export as premium PDFs.
      </p>
      <div className="mt-8">
        <AdminItinerariesTable />
      </div>
    </main>
  );
}

