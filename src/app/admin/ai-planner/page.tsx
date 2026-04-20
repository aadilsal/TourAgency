import { AdminAiPlannerRequestsPanel } from "../../../components/admin/AdminAiPlannerRequestsPanel";

export default function AdminAiPlannerPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-ink">AI Planner</h1>
      <p className="mt-2 text-sm text-brand-muted">
        Review AI Planner requests, see the full transcript, and draft a final
        itinerary/quote for follow-up.
      </p>
      <div className="mt-10">
        <AdminAiPlannerRequestsPanel />
      </div>
    </div>
  );
}

