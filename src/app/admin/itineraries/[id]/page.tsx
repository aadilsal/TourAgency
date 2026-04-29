import { AdminItineraryEditorGate } from "@/components/admin/AdminItineraryEditorGate";

export default function AdminItineraryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <AdminItineraryEditorGate itineraryId={params.id} />
    </main>
  );
}

