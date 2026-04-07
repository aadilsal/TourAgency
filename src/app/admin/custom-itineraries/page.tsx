import { AdminCustomItinerariesPanel } from "@/components/admin/AdminCustomItinerariesPanel";

export default function AdminCustomItinerariesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-ink">Custom itineraries</h1>
      <p className="mt-2 text-sm text-brand-muted">
        AI-flagged custom routes submitted by guests. Approve to pursue pricing
        or reject with an internal note.
      </p>
      <div className="mt-10">
        <AdminCustomItinerariesPanel />
      </div>
    </div>
  );
}
