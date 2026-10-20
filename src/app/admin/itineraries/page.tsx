import { AdminItinerariesTable } from "@/components/admin/AdminItinerariesTable";

export default function AdminItinerariesPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Itineraries</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Trip plans you send to customers. Check them and download them as PDF files.
      </p>
      <div className="mt-8">
        <AdminItinerariesTable />
      </div>
    </main>
  );
}

