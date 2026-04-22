import { AdminItineraryWizard } from "@/components/admin/AdminItineraryWizard";

export default function AdminItineraryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <AdminItineraryWizard itineraryId={params.id} />
    </main>
  );
}

