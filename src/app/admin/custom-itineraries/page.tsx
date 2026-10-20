import { AdminAiPlannerRequestsPanel } from "@/components/admin/AdminAiPlannerRequestsPanel";

export default function AdminCustomItinerariesPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Trip requests</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Custom trips that visitors planned with the AI planner. Read the chat, prepare the final
        plan or price, then approve or decline with a note to the customer.
      </p>
      <div className="mt-8">
        <AdminAiPlannerRequestsPanel />
      </div>
    </main>
  );
}
