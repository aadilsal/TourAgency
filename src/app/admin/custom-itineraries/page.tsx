import { AdminAiPlannerRequestsPanel } from "@/components/admin/AdminAiPlannerRequestsPanel";

export default function AdminCustomItinerariesPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Trip requests</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Custom trip requests from the AI planner. Review the transcript, draft the
        final itinerary or quote, then approve or reject with a note to the client.
      </p>
      <div className="mt-8">
        <AdminAiPlannerRequestsPanel />
      </div>
    </main>
  );
}
