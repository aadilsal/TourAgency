import { AdminItinerarySimpleBuilder } from "@/components/admin/AdminItinerarySimpleBuilder";

export default function AdminNewItineraryPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Create itinerary</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Fill the form on the left — your PDF updates live on the right. Progress autosaves after you create the draft.
      </p>
      <div className="mt-8">
        <AdminItinerarySimpleBuilder />
      </div>
    </main>
  );
}

