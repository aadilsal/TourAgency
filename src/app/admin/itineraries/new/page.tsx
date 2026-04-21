import { AdminItineraryWizard } from "@/components/admin/AdminItineraryWizard";

export default function AdminNewItineraryPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Create itinerary</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Step-by-step builder. Your progress autosaves.
      </p>
      <div className="mt-8">
        <AdminItineraryWizard />
      </div>
    </main>
  );
}

